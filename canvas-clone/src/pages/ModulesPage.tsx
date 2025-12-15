import { useMemo, useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import CourseHeader from "../components/CourseHeader";
import ModuleItem from "../components/ModuleItem";
import AddModuleModal from "../components/AddModuleModal";
import { Plus, GripVertical } from "lucide-react";

import {
  replaceModuleTitleInAllFiles,
  addModuleRefToFile,
  removeModuleRefFromFile,
  mergeModuleRefsIntoFilesMeta,
} from "../utils/files";

import {
  DndContext,
  closestCenter,
  useSensor,
  useSensors,
  PointerSensor,
  type DragStartEvent,
  type DragOverEvent,
  type DragEndEvent,
  DragOverlay,
  type Modifier,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import {
  slugifyLabel,
  loadModulesFromStorage,
  saveModulesToStorage,
  type Item,
  type ModuleT,
} from "../utils/modules";

type IdModule = `module:${string}`;
type IdItem = `item:${string}:${string}`;
type IdContainer = `container:${string}`;
type IdPlaceholder = `placeholder:${string}:${string}`;
type AnyId = IdModule | IdItem | IdContainer | IdPlaceholder;

const modId = (title: string): IdModule => `module:${title}`;
const itemId = (moduleTitle: string, label: string): IdItem =>
  `item:${moduleTitle}:${label}`;
const containerId = (moduleTitle: string): IdContainer =>
  `container:${moduleTitle}`;

function parseId(id: string) {
  if (id.startsWith("module:"))
    return { kind: "module" as const, title: id.slice(7) };

  if (id.startsWith("item:")) {
    const rest = id.slice(5);
    const i = rest.indexOf(":");
    return {
      kind: "item" as const,
      moduleTitle: rest.slice(0, i),
      label: rest.slice(i + 1),
    };
  }

  if (id.startsWith("container:"))
    return { kind: "container" as const, moduleTitle: id.slice(10) };

  if (id.startsWith("placeholder:")) {
    const rest = id.slice(12);
    const i = rest.indexOf(":");
    return {
      kind: "placeholder" as const,
      moduleTitle: rest.slice(0, i),
      sectionLabel: rest.slice(i + 1),
    };
  }

  return { kind: "unknown" as const };
}

const restrictToVertical: Modifier = ({ transform }: any) => ({
  ...transform,
  x: 0,
});

const transitionStyle = {
  transition:
    "transform 250ms cubic-bezier(0.22, 1, 0.36, 1), opacity 150ms ease",
};

function clampIndent(n: unknown) {
  const v = typeof n === "number" && Number.isFinite(n) ? Math.floor(n) : 0;
  return Math.max(0, Math.min(3, v));
}

function findCollapsedInsertIndex(mod: ModuleT, sectionLabel: string) {
  const i = mod.items.findIndex((it) => it.label === sectionLabel);
  if (i < 0) return mod.items.length;

  const section = mod.items[i];
  const sectionIndent = clampIndent(section.indent ?? 0);

  let j = i + 1;
  while (j < mod.items.length) {
    const nxt = mod.items[j];

    // Boundary 1: next section header
    if (nxt.type === "section") break;

    // Boundary 2: outdent encountered
    const nxtIndent = clampIndent(nxt.indent ?? 0);
    if (nxtIndent <= sectionIndent) break;

    j += 1;
  }

  // Insert right at the end boundary (inside collapsed section, before boundary row)
  return j;
}

function DraggableModuleShell(props: {
  id: IdModule;
  title: string;
  items: Item[];
  fadeOut: boolean;
  courseId?: string;

  onAddItem: (moduleTitle: string, newItem: Item) => void;
  onEditItem: (moduleTitle: string, oldLabel: string, newLabel: string) => void;
  onEditItemFull: (
    moduleTitle: string,
    oldLabel: string,
    updatedItem: Item
  ) => void;
  onDeleteItem: (moduleTitle: string, labelToRemove: string) => void;

  onIndentItem: (moduleTitle: string, label: string) => void;
  onOutdentItem: (moduleTitle: string, label: string) => void;
  onToggleSectionCollapsed: (moduleTitle: string, sectionLabel: string) => void;

  onEditModule: (oldTitle: string, newTitle: string) => void;
  onDeleteModule: (titleToDelete: string) => void;

  getItemId: (label: string) => IdItem;
  getContainerId: () => IdContainer;

  dropIndex: number | null;
  moduleIsHighlighted: boolean;

  onOpenPageItem: (label: string, pageId?: string) => void;
  onOpenFileItem: (label: string, fileId?: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useSortable({ id: props.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    ...transitionStyle,
    zIndex: isDragging ? 60 : "auto",
    opacity: isDragging ? 0.9 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative flex items-start group rounded-xl transition-all ${
        isDragging
          ? "translate-y-2 shadow-[0_8px_20px_rgba(0,0,0,0.25)] ring-2 ring-blue-300/40 bg-white/95 backdrop-blur-sm duration-200"
          : "shadow-sm hover:shadow-md hover:shadow-gray-300/40 duration-100"
      } ${
        props.moduleIsHighlighted ? "ring-2 ring-blue-400/60 bg-blue-50/60" : ""
      }`}
    >
      <div
        {...attributes}
        {...listeners}
        className="absolute -left-8 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing transition-opacity duration-150"
      >
        <GripVertical className="w-5 h-5" />
      </div>

      <div className="flex-1">
        <ModuleItem
          title={props.title}
          items={props.items}
          fadeOut={props.fadeOut}
          onAddItem={props.onAddItem}
          onEditItem={props.onEditItem}
          onEditItemFull={props.onEditItemFull}
          onDeleteItem={props.onDeleteItem}
          onIndentItem={props.onIndentItem}
          onOutdentItem={props.onOutdentItem}
          onToggleSectionCollapsed={props.onToggleSectionCollapsed}
          onEditModule={props.onEditModule}
          onDeleteModule={props.onDeleteModule}
          getItemId={props.getItemId}
          getContainerId={props.getContainerId}
          dropIndex={props.dropIndex}
          moduleIsHighlighted={props.moduleIsHighlighted}
          onOpenPageItem={props.onOpenPageItem}
          onOpenFileItem={props.onOpenFileItem}
          courseId={props.courseId}
        />
      </div>
    </div>
  );
}

export default function ModulesPage() {
  const navigate = useNavigate();
  const { courseId } = useParams();

  const [modules, setModules] = useState<ModuleT[]>(() =>
    loadModulesFromStorage()
  );

  const [fadingModules, setFadingModules] = useState<Set<string>>(new Set());
  const [showAddModuleModal, setShowAddModuleModal] = useState(false);
  const [activeId, setActiveId] = useState<AnyId | null>(null);
  const [dropIndicator, setDropIndicator] = useState<{
    moduleTitle: string | null;
    index: number | null; // FULL items array index
  }>({ moduleTitle: null, index: null });
  const [highlightModuleTitle, setHighlightModuleTitle] = useState<
    string | null
  >(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  useEffect(() => {
    saveModulesToStorage(modules);
  }, [modules]);

  useEffect(() => {
    const cid = courseId;
    if (!cid) return;

    const refMap = new Map<string, Set<string>>();
    for (const m of modules) {
      for (const it of m.items as any[]) {
        if (it?.type === "file" && it.fileId) {
          if (!refMap.has(it.fileId)) refMap.set(it.fileId, new Set());
          refMap.get(it.fileId)!.add(m.title);
        }
      }
    }

    mergeModuleRefsIntoFilesMeta(cid, refMap);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modules, courseId]);

  const handleAddModule = (newModuleTitle: string) => {
    setModules((prev) => [...prev, { title: newModuleTitle, items: [] }]);
    setShowAddModuleModal(false);
  };

  const handleOpenPageItem = (label: string, pageId?: string) => {
    const cid = courseId;
    if (!cid) return;
    const finalPageId = pageId ?? slugifyLabel(label);
    navigate(`/courses/${cid}/pages/${finalPageId}`);
  };

  const handleOpenFileItem = (_label: string, fileId?: string) => {
    const cid = courseId;
    if (!cid || !fileId) return;
    navigate(`/courses/${cid}/files/${fileId}`);
  };

  const handleEditModule = (oldTitle: string, newTitle: string) => {
    setModules((prev) =>
      prev.map((m) => (m.title === oldTitle ? { ...m, title: newTitle } : m))
    );

    const cid = courseId;
    if (cid) replaceModuleTitleInAllFiles(cid, oldTitle, newTitle);
  };

  const handleDeleteModule = (title: string) => {
    setFadingModules((prev) => new Set([...prev, title]));
    setTimeout(() => {
      const cid = courseId;
      if (cid) {
        const mod = modules.find((m) => m.title === title);
        for (const it of (mod?.items ?? []) as any[]) {
          if (it?.type === "file" && it.fileId) {
            removeModuleRefFromFile(cid, it.fileId, title);
          }
        }
      }

      setModules((prev) => prev.filter((m) => m.title !== title));
      setFadingModules((prev) => {
        const next = new Set(prev);
        next.delete(title);
        return next;
      });
    }, 250);
  };

  const handleAddItemToModule = (moduleTitle: string, newItem: Item) => {
    const makeUniqueLabel = (raw: string) => {
      const base = raw.trim();
      const mod = modules.find((m) => m.title === moduleTitle);
      const existing = new Set((mod?.items ?? []).map((it) => it.label));
      if (!existing.has(base)) return base;
      let n = 2;
      while (existing.has(`${base} (${n})`)) n += 1;
      return `${base} (${n})`;
    };

    const label = makeUniqueLabel(newItem.label);

    const normalizedIncoming: Item = {
      ...newItem,
      label,
      indent: clampIndent(newItem.indent ?? 0),
      collapsed: newItem.type === "section" ? !!newItem.collapsed : undefined,
    };

    const itemToAdd: Item =
      normalizedIncoming.type === "page"
        ? {
            ...normalizedIncoming,
            pageId: slugifyLabel(normalizedIncoming.label),
          }
        : normalizedIncoming;

    const cid = courseId;
    if (cid && itemToAdd.type === "file" && (itemToAdd as any).fileId) {
      addModuleRefToFile(cid, (itemToAdd as any).fileId, moduleTitle);
    }

    setModules((prev) =>
      prev.map((m) =>
        m.title === moduleTitle ? { ...m, items: [...m.items, itemToAdd] } : m
      )
    );
  };

  const handleEditItemInModule = (
    moduleTitle: string,
    oldLabel: string,
    newLabel: string
  ) => {
    setModules((prev) =>
      prev.map((m) =>
        m.title === moduleTitle
          ? {
              ...m,
              items: m.items.map((it) =>
                it.label === oldLabel ? { ...it, label: newLabel } : it
              ),
            }
          : m
      )
    );
  };

  const handleEditItemInModuleFull = (
    moduleTitle: string,
    oldLabel: string,
    updatedItem: Item
  ) => {
    const cid = courseId;

    const makeUniqueLabelForEdit = (raw: string) => {
      const base = raw.trim();
      const mod = modules.find((m) => m.title === moduleTitle);
      const existing = new Set(
        (mod?.items ?? [])
          .filter((it) => it.label !== oldLabel)
          .map((it) => it.label)
      );
      if (!existing.has(base)) return base;
      let n = 2;
      while (existing.has(`${base} (${n})`)) n += 1;
      return `${base} (${n})`;
    };

    setModules((prev) =>
      prev.map((m) => {
        if (m.title !== moduleTitle) return m;

        return {
          ...m,
          items: m.items.map((it) => {
            if (it.label !== oldLabel) return it;

            const prevFileId =
              it.type === "file" ? (it as any).fileId : undefined;
            const nextFileId =
              updatedItem.type === "file"
                ? (updatedItem as any).fileId
                : undefined;

            const nextLabel = makeUniqueLabelForEdit(updatedItem.label);

            let next: Item = {
              ...it,
              label: nextLabel,
              type: updatedItem.type,
              url: updatedItem.url,
              fileId: (updatedItem as any).fileId,
              fileName: (updatedItem as any).fileName,
              indent: clampIndent(updatedItem.indent ?? it.indent ?? 0),
              collapsed:
                updatedItem.type === "section"
                  ? !!updatedItem.collapsed
                  : undefined,
            };

            if (it.type === "page" && updatedItem.type === "page") {
              next.pageId = it.pageId ?? slugifyLabel(it.label);
            } else if (it.type !== "page" && updatedItem.type === "page") {
              next.pageId = slugifyLabel(nextLabel);
            } else if (updatedItem.type !== "page") {
              delete (next as any).pageId;
            }

            if (cid) {
              if (prevFileId && prevFileId !== nextFileId) {
                removeModuleRefFromFile(cid, prevFileId, moduleTitle);
              }
              if (nextFileId) {
                addModuleRefToFile(cid, nextFileId, moduleTitle);
              }
            }

            return next;
          }),
        };
      })
    );
  };

  const handleDeleteItemInModule = (moduleTitle: string, label: string) => {
    const cid = courseId;

    setModules((prev) => {
      const module = prev.find((m) => m.title === moduleTitle);
      const itemToRemove = module?.items.find((it) => it.label === label);

      const next = prev.map((m) =>
        m.title === moduleTitle
          ? { ...m, items: m.items.filter((it) => it.label !== label) }
          : m
      );

      if (
        cid &&
        itemToRemove &&
        itemToRemove.type === "file" &&
        (itemToRemove as any).fileId
      ) {
        removeModuleRefFromFile(cid, (itemToRemove as any).fileId, moduleTitle);
      }

      return next;
    });
  };

  const handleIndentItem = (moduleTitle: string, label: string) => {
    setModules((prev) =>
      prev.map((m) =>
        m.title !== moduleTitle
          ? m
          : {
              ...m,
              items: m.items.map((it) =>
                it.label === label
                  ? { ...it, indent: clampIndent((it.indent ?? 0) + 1) }
                  : it
              ),
            }
      )
    );
  };

  const handleOutdentItem = (moduleTitle: string, label: string) => {
    setModules((prev) =>
      prev.map((m) =>
        m.title !== moduleTitle
          ? m
          : {
              ...m,
              items: m.items.map((it) =>
                it.label === label
                  ? { ...it, indent: clampIndent((it.indent ?? 0) - 1) }
                  : it
              ),
            }
      )
    );
  };

  const handleToggleSectionCollapsed = (
    moduleTitle: string,
    sectionLabel: string
  ) => {
    setModules((prev) =>
      prev.map((m) =>
        m.title !== moduleTitle
          ? m
          : {
              ...m,
              items: m.items.map((it) =>
                it.label === sectionLabel && it.type === "section"
                  ? { ...it, collapsed: !it.collapsed }
                  : it
              ),
            }
      )
    );
  };

  const activeMeta = useMemo(() => {
    if (!activeId) return null;
    const p = parseId(String(activeId));
    if (p.kind === "module") {
      const mod = modules.find((m) => m.title === p.title);
      return mod
        ? { type: "module" as const, title: mod.title, count: mod.items.length }
        : null;
    }
    if (p.kind === "item") {
      const it = modules
        .find((m) => m.title === p.moduleTitle)
        ?.items.find((i) => i.label === p.label);
      return it ? { type: "item" as const, label: it.label } : null;
    }
    return null;
  }, [activeId, modules]);

  function handleDragStart(e: DragStartEvent) {
    setActiveId(e.active.id as AnyId);
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!over) return;

    const a = parseId(String(active.id));
    const b = parseId(String(over.id));

    setHighlightModuleTitle(null);
    setDropIndicator({ moduleTitle: null, index: null });

    if (a.kind === "module" && b.kind === "module") {
      setHighlightModuleTitle(b.title);
      return;
    }

    if (a.kind === "item") {
      // Drop “into collapsed section”
      if (b.kind === "placeholder") {
        const mod = modules.find((m) => m.title === b.moduleTitle);
        if (!mod) return;

        const insertIndex = findCollapsedInsertIndex(mod, b.sectionLabel);
        setDropIndicator({ moduleTitle: b.moduleTitle, index: insertIndex });
        return;
      }

      if (b.kind === "item") {
        const overElem = document.querySelector(`[data-id='${over.id}']`);
        if (!overElem) return;

        const rect = (overElem as HTMLElement).getBoundingClientRect();
        const midY = rect.top + rect.height / 2;
        const clientY = (event.activatorEvent as MouseEvent)?.clientY ?? midY;
        const insertBefore = clientY < midY;

        const modTitle = b.moduleTitle;
        const overModule = modules.find((m) => m.title === modTitle);
        if (!overModule) return;

        const targetIndex = overModule.items.findIndex(
          (it) => it.label === b.label
        );
        const finalIndex = insertBefore ? targetIndex : targetIndex + 1;

        setDropIndicator({ moduleTitle: modTitle, index: finalIndex });
        return;
      }

      if (b.kind === "container") {
        setDropIndicator({
          moduleTitle: b.moduleTitle,
          index:
            modules.find((m) => m.title === b.moduleTitle)?.items.length ?? 0,
        });
      }
    }
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveId(null);
    setDropIndicator({ moduleTitle: null, index: null });
    setHighlightModuleTitle(null);
    if (!over) return;

    const a = parseId(String(active.id));
    const b = parseId(String(over.id));

    if (a.kind === "module" && b.kind === "module") {
      setModules((prev) => {
        const from = prev.findIndex((m) => m.title === a.title);
        const to = prev.findIndex((m) => m.title === b.title);
        if (from < 0 || to < 0 || from === to) return prev;
        return arrayMove(prev, from, to);
      });
      return;
    }

    // Item dragged onto placeholder => treat as insert into that module at computed index
    if (a.kind === "item" && b.kind === "placeholder") {
      const cid = courseId;

      setModules((prev) => {
        const fromIdx = prev.findIndex((m) => m.title === a.moduleTitle);
        const toIdx = prev.findIndex((m) => m.title === b.moduleTitle);
        if (fromIdx < 0 || toIdx < 0) return prev;

        const toMod = prev[toIdx];
        const insertIndex = findCollapsedInsertIndex(toMod, b.sectionLabel);

        // Remove from source
        const source = [...prev[fromIdx].items];
        const oldIndex = source.findIndex((it) => it.label === a.label);
        if (oldIndex < 0) return prev;
        const [moving] = source.splice(oldIndex, 1);

        // If moving across modules, update file refs
        if (
          cid &&
          fromIdx !== toIdx &&
          moving?.type === "file" &&
          (moving as any).fileId
        ) {
          const fileId = (moving as any).fileId as string;
          removeModuleRefFromFile(cid, fileId, a.moduleTitle);
          addModuleRefToFile(cid, fileId, b.moduleTitle);
        }

        // Insert into target
        const target = [...prev[toIdx].items];
        const safeIndex = Math.max(0, Math.min(target.length, insertIndex));
        target.splice(safeIndex, 0, moving);

        // If moving within same module, account for index shift when removing before inserting
        if (fromIdx === toIdx) {
          const adjustedTarget = [...prev[toIdx].items];
          const oldIdx2 = adjustedTarget.findIndex(
            (it) => it.label === a.label
          );
          if (oldIdx2 < 0) return prev;
          const [moving2] = adjustedTarget.splice(oldIdx2, 1);

          // recompute insert index on the “post-removal” array
          const tempMod: ModuleT = { ...toMod, items: adjustedTarget };
          const insert2 = findCollapsedInsertIndex(tempMod, b.sectionLabel);
          const safe2 = Math.max(0, Math.min(adjustedTarget.length, insert2));
          adjustedTarget.splice(safe2, 0, moving2);

          const nextSame = [...prev];
          nextSame[toIdx] = { ...nextSame[toIdx], items: adjustedTarget };
          return nextSame;
        }

        const next = [...prev];
        next[fromIdx] = { ...next[fromIdx], items: source };
        next[toIdx] = { ...next[toIdx], items: target };
        return next;
      });

      return;
    }

    if (a.kind === "item" && (b.kind === "item" || b.kind === "container")) {
      const cid = courseId;

      setModules((prev) => {
        const fromIdx = prev.findIndex((m) => m.title === a.moduleTitle);
        const toIdx = prev.findIndex((m) => m.title === b.moduleTitle);
        if (fromIdx < 0 || toIdx < 0) return prev;

        if (fromIdx === toIdx) {
          const list = [...prev[fromIdx].items];
          const oldIndex = list.findIndex((it) => it.label === a.label);
          if (oldIndex < 0) return prev;

          const newIndex =
            b.kind === "item"
              ? list.findIndex((it) => it.label === b.label)
              : list.length;

          const reordered = arrayMove(list, oldIndex, newIndex);
          const next = [...prev];
          next[fromIdx] = { ...next[fromIdx], items: reordered };
          return next;
        }

        const source = [...prev[fromIdx].items];
        const oldIndex = source.findIndex((it) => it.label === a.label);
        if (oldIndex < 0) return prev;

        const [moving] = source.splice(oldIndex, 1);
        const target = [...prev[toIdx].items];

        if (cid && moving?.type === "file" && (moving as any).fileId) {
          const fileId = (moving as any).fileId as string;
          removeModuleRefFromFile(cid, fileId, a.moduleTitle);
          addModuleRefToFile(cid, fileId, b.moduleTitle);
        }

        const insertAt =
          b.kind === "item"
            ? target.findIndex((it) => it.label === b.label)
            : target.length;

        const insertIndex = insertAt >= 0 ? insertAt : target.length;
        target.splice(insertIndex, 0, moving);

        const next = [...prev];
        next[fromIdx] = { ...next[fromIdx], items: source };
        next[toIdx] = { ...next[toIdx], items: target };
        return next;
      });
    }
  }

  return (
    <div className="flex flex-col w-full bg-canvas-grayLight h-full">
      <CourseHeader />

      <div className="flex-1 px-20 py-10 overflow-y-auto bg-white relative">
        <div className="max-w-4xl space-y-6">
          <h2 className="text-2xl font-semibold text-canvas-grayDark">
            Modules
          </h2>
          <p className="text-gray-600">
            Organize your course content into modules.
          </p>

          <div className="h-px bg-gray-200 my-6" />

          <div className="flex items-center justify-between pb-3 border-b border-gray-200">
            <p className="text-sm text-gray-500">
              Showing {modules.length} module{modules.length !== 1 ? "s" : ""}
            </p>

            <button
              onClick={() => setShowAddModuleModal(true)}
              className="flex items-center gap-2 bg-[#008EE2] hover:bg-[#0079C2] text-white px-4 py-2 rounded-md text-sm font-medium transition-all shadow-sm"
            >
              <Plus className="w-4 h-4" strokeWidth={2.5} />
              Module
            </button>
          </div>

          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
            modifiers={[restrictToVertical]}
          >
            <SortableContext
              items={modules.map((m) => modId(m.title))}
              strategy={verticalListSortingStrategy}
            >
              {modules.map((mod) => (
                <DraggableModuleShell
                  key={mod.title}
                  id={modId(mod.title)}
                  title={mod.title}
                  items={mod.items}
                  fadeOut={fadingModules.has(mod.title)}
                  onAddItem={handleAddItemToModule}
                  onEditItem={handleEditItemInModule}
                  onEditItemFull={handleEditItemInModuleFull}
                  onDeleteItem={handleDeleteItemInModule}
                  onIndentItem={handleIndentItem}
                  onOutdentItem={handleOutdentItem}
                  onToggleSectionCollapsed={handleToggleSectionCollapsed}
                  onEditModule={handleEditModule}
                  onDeleteModule={handleDeleteModule}
                  getItemId={(label) => itemId(mod.title, label)}
                  getContainerId={() => containerId(mod.title)}
                  dropIndex={
                    dropIndicator.moduleTitle === mod.title
                      ? dropIndicator.index
                      : null
                  }
                  moduleIsHighlighted={highlightModuleTitle === mod.title}
                  onOpenPageItem={handleOpenPageItem}
                  onOpenFileItem={handleOpenFileItem}
                  courseId={courseId}
                />
              ))}
            </SortableContext>

            <DragOverlay dropAnimation={null} adjustScale={false}>
              {activeMeta?.type === "module" && (
                <div className="rounded-xl bg-white/95 backdrop-blur-sm shadow-[0_10px_28px_rgba(0,0,0,0.28)] ring-2 ring-blue-300/40 p-4 w-[680px]">
                  <div className="text-sm font-semibold text-[#2D3B45] mb-1">
                    {activeMeta.title}
                  </div>
                  <div className="text-xs text-gray-500">
                    {activeMeta.count} item{activeMeta.count === 1 ? "" : "s"}
                  </div>
                </div>
              )}

              {activeMeta?.type === "item" && (
                <div className="px-6 py-3 rounded-md bg-white/95 backdrop-blur-sm shadow-[0_8px_20px_rgba(0,0,0,0.25)] ring-1 ring-blue-200">
                  <span className="text-gray-700 text-[15px] select-none">
                    {activeMeta.label}
                  </span>
                </div>
              )}
            </DragOverlay>
          </DndContext>
        </div>

        {showAddModuleModal && (
          <AddModuleModal
            onClose={() => setShowAddModuleModal(false)}
            onAdd={handleAddModule}
          />
        )}
      </div>
    </div>
  );
}
