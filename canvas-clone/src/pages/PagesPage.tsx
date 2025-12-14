import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Plus, FileText, Folder, Pencil, Trash2 } from "lucide-react";
import CourseHeader from "../components/CourseHeader";
import AddPageFromPagesModal from "../components/AddPageFromPagesModal";
import RenamePageModal from "../components/RenamePageModal";
import ConfirmDeletePageModal from "../components/ConfirmDeleteModal";

import {
  extractPageItems,
  loadModulesFromStorage,
  saveModulesToStorage,
  slugifyLabel,
  MODULES_STORAGE_KEY,
  type ModuleT,
} from "../utils/modules";

type PageRow = ReturnType<typeof extractPageItems>[number];

function pageStorageKey(courseId: string, pageId: string) {
  return `canvasClone:page:${courseId}:${pageId}`;
}

function uniquePageId(desiredTitle: string, existingPageIds: Set<string>) {
  const base = slugifyLabel(desiredTitle);
  if (!existingPageIds.has(base)) return base;

  let i = 2;
  while (existingPageIds.has(`${base}-${i}`)) i++;
  return `${base}-${i}`;
}

export default function PagesPage() {
  const navigate = useNavigate();
  const { courseId } = useParams();

  const [modules, setModules] = useState<ModuleT[]>(() =>
    loadModulesFromStorage()
  );

  const [showCreateModal, setShowCreateModal] = useState(false);

  // Rename modal state
  const [renameTarget, setRenameTarget] = useState<PageRow | null>(null);

  // Delete modal state
  const [deleteTarget, setDeleteTarget] = useState<PageRow | null>(null);

  // Keep Pages in sync if Modules updates localStorage in another tab/window.
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== MODULES_STORAGE_KEY) return;
      setModules(loadModulesFromStorage());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const pages = useMemo(() => extractPageItems(modules), [modules]);

  const existingPageIds = useMemo(
    () => new Set(pages.map((p) => p.pageId)),
    [pages]
  );

  const openPage = (pageId: string) => {
    if (!courseId) return;
    navigate(`/courses/${courseId}/pages/${pageId}`);
  };

  const handleCreatePage = (args: {
    title: string;
    targetModuleTitle: string;
  }) => {
    const newId = uniquePageId(args.title, existingPageIds);

    setModules((prev) => {
      const next = prev.map((m) => {
        if (m.title !== args.targetModuleTitle) return m;
        return {
          ...m,
          items: [
            ...m.items,
            {
              type: "page",
              label: args.title,
              pageId: newId,
            },
          ],
        };
      });

      saveModulesToStorage(next);
      return next;
    });

    if (courseId) navigate(`/courses/${courseId}/pages/${newId}`);
  };

  /**
   * Rename:
   * - Update page item's label + pageId across modules where it appears
   * - Migrate the saved page content key so content persists
   */
  const renamePage = (target: PageRow, newTitle: string) => {
    if (!courseId) return;

    const oldId = target.pageId;
    const newId = uniquePageId(
      newTitle,
      new Set([...existingPageIds].filter((id) => id !== oldId))
    );

    // 1) Update modules (source of truth)
    setModules((prev) => {
      const next = prev.map((m) => ({
        ...m,
        items: m.items.map((it) => {
          if (it.type !== "page") return it;

          const pid = it.pageId ?? slugifyLabel(it.label);
          if (pid !== oldId) return it;

          return {
            ...it,
            label: newTitle,
            pageId: newId,
          };
        }),
      }));

      saveModulesToStorage(next);
      return next;
    });

    // 2) Migrate page content in localStorage
    try {
      const oldKey = pageStorageKey(courseId, oldId);
      const newKey = pageStorageKey(courseId, newId);

      const existing = window.localStorage.getItem(oldKey);
      if (existing != null) {
        window.localStorage.setItem(newKey, existing);
        window.localStorage.removeItem(oldKey);
      }
    } catch (err) {
      console.error("Failed to migrate page content storage on rename", err);
    }

    // 3) If currently viewing that page, navigate to new id
    const currentPath = window.location.pathname;
    if (currentPath.includes(`/pages/${oldId}`)) {
      navigate(`/courses/${courseId}/pages/${newId}`);
    }
  };

  /**
   * Delete:
   * - Remove page items across modules where it appears
   * - Remove saved page content key
   */
  const deletePage = (target: PageRow) => {
    if (!courseId) return;

    const idToDelete = target.pageId;

    // 1) Remove from modules
    setModules((prev) => {
      const next = prev.map((m) => ({
        ...m,
        items: m.items.filter((it) => {
          if (it.type !== "page") return true;
          const pid = it.pageId ?? slugifyLabel(it.label);
          return pid !== idToDelete;
        }),
      }));

      saveModulesToStorage(next);
      return next;
    });

    // 2) Remove stored content
    try {
      window.localStorage.removeItem(pageStorageKey(courseId, idToDelete));
    } catch (err) {
      console.error("Failed to delete page content storage", err);
    }

    // 3) If currently viewing that page, navigate back to Pages
    const currentPath = window.location.pathname;
    if (currentPath.includes(`/pages/${idToDelete}`)) {
      navigate(`/courses/${courseId}/pages`);
    }
  };

  return (
    <div className="flex flex-col w-full bg-canvas-grayLight h-full">
      <CourseHeader />

      <div className="flex-1 px-16 py-10 overflow-y-auto bg-white">
        <div className="max-w-4xl">
          <div className="flex items-start justify-between gap-4 mb-6">
            <div>
              <h2 className="text-2xl font-semibold text-canvas-grayDark">
                Pages
              </h2>
              <p className="text-gray-600 leading-relaxed mt-1">
                All pages currently used across your modules. You can create,
                rename, and delete pages here.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-[#008EE2] text-white text-sm font-medium hover:bg-[#0079C2] shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Page
            </button>
          </div>

          <div className="h-px bg-gray-200 my-6"></div>

          {pages.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 px-6 py-8">
              <p className="text-gray-700 font-medium">No pages yet</p>
              <p className="text-gray-600 text-sm mt-1">
                Add a page from here, or add a Page item inside Modules.
              </p>
            </div>
          ) : (
            <div className="rounded-xl border border-gray-200 overflow-hidden">
              <div className="bg-gray-50 px-5 py-3 text-xs font-semibold text-gray-600 grid grid-cols-[1fr_220px_140px] items-center gap-4">
                <span>Page</span>
                <span>Module</span>
                <span className="text-right">Actions</span>
              </div>

              <div className="divide-y divide-gray-200">
                {pages.map((p) => (
                  <div
                    key={`${p.moduleTitle}:${p.pageId}`}
                    className="px-5 py-4 hover:bg-gray-50 transition-colors grid grid-cols-[1fr_220px_140px] items-center gap-4"
                  >
                    <button
                      type="button"
                      onClick={() => openPage(p.pageId)}
                      className="text-left flex items-center gap-3 min-w-0"
                    >
                      <FileText className="w-4 h-4 text-gray-500 flex-shrink-0" />
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-[#2D3B45] truncate">
                          {p.label}
                        </div>
                        <div className="text-xs text-gray-500 truncate">
                          {p.pageId}
                        </div>
                      </div>
                    </button>

                    <div className="flex items-center gap-2 text-sm text-gray-600 min-w-0">
                      <Folder className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <span className="truncate">{p.moduleTitle}</span>
                    </div>

                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setRenameTarget(p)}
                        className="inline-flex items-center gap-2 px-3 py-2 rounded-md border border-gray-300 bg-white hover:bg-gray-100 text-sm text-[#2D3B45]"
                        title="Rename"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => setDeleteTarget(p)}
                        className="inline-flex items-center gap-2 px-3 py-2 rounded-md border border-gray-300 bg-white hover:bg-red-50 text-sm text-red-600"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {showCreateModal && (
        <AddPageFromPagesModal
          modules={modules}
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreatePage}
        />
      )}

      <RenamePageModal
        isOpen={!!renameTarget}
        initialTitle={renameTarget?.label ?? ""}
        initialModuleTitle={renameTarget?.moduleTitle ?? ""}
        onClose={() => setRenameTarget(null)}
        onRename={(newTitle) => {
          if (!renameTarget) return;
          renamePage(renameTarget, newTitle);
        }}
      />

      <ConfirmDeletePageModal
        isOpen={!!deleteTarget}
        title="Delete page?"
        description={
          deleteTarget
            ? `This will remove "${deleteTarget.label}" from Modules and delete its saved content. This cannot be undone.`
            : ""
        }
        confirmText="Delete"
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (!deleteTarget) return;
          deletePage(deleteTarget);
        }}
      />
    </div>
  );
}
