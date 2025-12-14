import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import CourseHeader from "../components/CourseHeader";
import {
  UploadCloud,
  File as FileIcon,
  Trash2,
  Download,
  Pencil,
  Folder,
  Plus,
} from "lucide-react";

import ConfirmDeleteModal from "../components/ConfirmDeleteModal";
import RenameFileModal from "../components/RenameFileModal";
import CanvasModal from "../components/CanvasModal";

import {
  type StoredFileMeta,
  formatBytes,
  idbDeleteBlob,
  idbGetBlob,
  idbPutBlob,
  loadFilesMeta,
  saveFilesMeta,
  uid,
  addModuleRefToFile,
  renameFileMetaInCourse,
} from "../utils/files";

import {
  loadModulesFromStorage,
  saveModulesToStorage,
  type ModuleT,
  type Item,
} from "../utils/modules";

export default function FilesPage() {
  const navigate = useNavigate();
  const { courseId } = useParams();

  const [files, setFiles] = useState<StoredFileMeta[]>([]);
  const [modules, setModules] = useState<ModuleT[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [busyIds, setBusyIds] = useState<Set<string>>(new Set());

  const [deleteTarget, setDeleteTarget] = useState<StoredFileMeta | null>(null);
  const [renameTarget, setRenameTarget] = useState<StoredFileMeta | null>(null);

  // Add-to-module modal
  const [addTarget, setAddTarget] = useState<StoredFileMeta | null>(null);
  const [selectedModuleTitle, setSelectedModuleTitle] = useState<string>("");

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!courseId) return;

    const refresh = () => setFiles(loadFilesMeta(courseId));
    refresh();

    const ms = loadModulesFromStorage();
    setModules(ms);
    if (ms.length > 0) setSelectedModuleTitle(ms[0].title);

    window.addEventListener("canvasClone:filesChanged", refresh);
    return () =>
      window.removeEventListener("canvasClone:filesChanged", refresh);
  }, [courseId]);

  const sortedFiles = useMemo(() => {
    return [...files].sort((a, b) => b.uploadedAt - a.uploadedAt);
  }, [files]);

  const persistFiles = (courseIdStr: string, next: StoredFileMeta[]) => {
    setFiles(next);
    saveFilesMeta(courseIdStr, next);
  };

  const persistModules = (next: ModuleT[]) => {
    setModules(next);
    saveModulesToStorage(next);
  };

  const markBusy = (id: string, on: boolean) => {
    setBusyIds((prev) => {
      const next = new Set(prev);
      if (on) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  async function handleUpload(fileList: FileList | File[]) {
    const cid = courseId;
    if (!cid) return;

    const incoming = Array.from(fileList);
    if (incoming.length === 0) return;

    const newMetas: StoredFileMeta[] = [];

    for (const f of incoming) {
      const id = uid();
      markBusy(id, true);

      const meta: StoredFileMeta = {
        id,
        name: f.name,
        size: f.size,
        mime: f.type || "application/octet-stream",
        uploadedAt: Date.now(),
        moduleTitles: [],
      };

      try {
        await idbPutBlob(`${cid}:${id}`, f);
        newMetas.push(meta);
      } catch (err) {
        console.error("Upload failed", err);
      } finally {
        markBusy(id, false);
      }
    }

    if (newMetas.length > 0) {
      setFiles((prev) => {
        const next = [...prev, ...newMetas];
        saveFilesMeta(cid, next);
        return next;
      });
    }
  }

  async function downloadFile(meta: StoredFileMeta) {
    const cid = courseId;
    if (!cid) return;

    markBusy(meta.id, true);
    try {
      const blob = await idbGetBlob(`${cid}:${meta.id}`);
      if (!blob) return;

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = meta.name;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } finally {
      markBusy(meta.id, false);
    }
  }

  async function deleteFile(meta: StoredFileMeta) {
    const cid = courseId;
    if (!cid) return;

    markBusy(meta.id, true);
    try {
      await idbDeleteBlob(`${cid}:${meta.id}`);
      persistFiles(
        cid,
        files.filter((f) => f.id !== meta.id)
      );
    } finally {
      markBusy(meta.id, false);
    }
  }

  function renameFile(meta: StoredFileMeta, newName: string) {
    const cid = courseId;
    if (!cid) return;

    const trimmed = newName.trim();
    if (!trimmed) return;

    // Canonical rename in Files meta (preserves extension if user omits it)
    renameFileMetaInCourse({
      courseId: cid,
      fileId: meta.id,
      displayName: trimmed,
    });

    // Local UI sync
    const next = loadFilesMeta(cid);
    setFiles(next);
  }

  function openAddToModule(meta: StoredFileMeta) {
    setAddTarget(meta);

    const preferred =
      meta.moduleTitles?.[0] &&
      modules.some((m) => m.title === meta.moduleTitles[0])
        ? meta.moduleTitles[0]
        : modules[0]?.title ?? "";

    setSelectedModuleTitle(preferred);
  }

  function addFileToModule(meta: StoredFileMeta, moduleTitle: string) {
    const cid = courseId;
    if (!cid) return;
    if (!moduleTitle) return;

    const newItem: Item = {
      type: "file",
      label: meta.name,
      fileId: meta.id,
      fileName: meta.name,
    } as any;

    const nextModules = modules.map((m) =>
      m.title === moduleTitle ? { ...m, items: [...m.items, newItem] } : m
    );
    persistModules(nextModules);

    // ✅ update file refs immediately
    addModuleRefToFile(cid, meta.id, moduleTitle);
  }

  const onDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await handleUpload(e.dataTransfer.files);
      e.dataTransfer.clearData();
    }
  };

  const onBrowse = () => fileInputRef.current?.click();

  if (!courseId) {
    return (
      <div className="flex flex-col w-full bg-canvas-grayLight min-h-screen">
        <CourseHeader />
        <div className="px-16 py-10">
          <div className="max-w-4xl text-gray-700">Missing courseId.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full bg-canvas-grayLight min-h-screen">
      <CourseHeader />

      <div className="flex-1 px-16 py-10 overflow-y-auto bg-white">
        <div className="max-w-4xl">
          <div className="flex items-start justify-between gap-4 mb-6">
            <div>
              <h2 className="text-2xl font-semibold text-canvas-grayDark">
                Files
              </h2>
              <p className="text-gray-600 leading-relaxed mt-1">
                Upload and manage course files. Files are stored locally
                (IndexedDB) for this prototype.
              </p>
            </div>

            <button
              type="button"
              onClick={onBrowse}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-[#008EE2] text-white text-sm font-medium hover:bg-[#0079C2] shadow-sm"
            >
              <UploadCloud className="w-4 h-4" />
              Upload
            </button>

            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={async (e) => {
                if (e.target.files) await handleUpload(e.target.files);
                e.target.value = "";
              }}
            />
          </div>

          <div
            onDragEnter={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsDragging(true);
            }}
            onDragOver={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsDragging(true);
            }}
            onDragLeave={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsDragging(false);
            }}
            onDrop={onDrop}
            className={`rounded-xl border ${
              isDragging
                ? "border-[#008EE2] bg-blue-50"
                : "border-dashed border-gray-300 bg-gray-50"
            } px-6 py-6 transition-colors`}
          >
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-lg bg-white border border-gray-200 flex items-center justify-center">
                <UploadCloud className="w-5 h-5 text-gray-600" />
              </div>
              <div className="min-w-0">
                <div className="text-sm font-semibold text-[#2D3B45]">
                  Drag & drop files here
                </div>
                <div className="text-xs text-gray-600">
                  Or{" "}
                  <button
                    type="button"
                    onClick={onBrowse}
                    className="text-[#008EE2] hover:underline font-medium"
                  >
                    browse
                  </button>{" "}
                  to upload.
                </div>
              </div>
            </div>
          </div>

          <div className="h-px bg-gray-200 my-6" />

          {sortedFiles.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 px-6 py-8">
              <p className="text-gray-700 font-medium">No files uploaded yet</p>
              <p className="text-gray-600 text-sm mt-1">
                Upload PDFs, images, docs, etc.
              </p>
            </div>
          ) : (
            <div className="rounded-xl border border-gray-200 overflow-hidden">
              {/* ✅ FIXED HEADER: minmax(0,...) + min-w-0 */}
              <div className="bg-gray-50 px-5 py-3 text-xs font-semibold text-gray-600 grid grid-cols-[minmax(0,1fr)_minmax(0,260px)_120px_240px] items-center gap-4">
                <span className="min-w-0">File</span>
                <span className="min-w-0">Modules</span>
                <span className="min-w-0">Size</span>
                <span className="text-right min-w-0">Actions</span>
              </div>

              <div className="divide-y divide-gray-200">
                {sortedFiles.map((f) => {
                  const busy = busyIds.has(f.id);
                  const modulesText =
                    f.moduleTitles && f.moduleTitles.length > 0
                      ? f.moduleTitles.join(", ")
                      : "—";

                  return (
                    <div
                      key={f.id}
                      /* ✅ FIXED ROW: minmax(0,...) + proper overflow constraints */
                      className="px-5 py-4 hover:bg-gray-50 transition-colors grid grid-cols-[minmax(0,1fr)_minmax(0,260px)_120px_240px] items-center gap-4"
                    >
                      {/* File column */}
                      <div className="flex items-center gap-3 min-w-0 overflow-hidden">
                        <FileIcon className="w-4 h-4 text-gray-500 flex-shrink-0" />
                        <div className="min-w-0 overflow-hidden">
                          <button
                            type="button"
                            onClick={() =>
                              navigate(`/courses/${courseId}/files/${f.id}`)
                            }
                            className="text-left text-sm font-semibold text-[#2D3B45] truncate hover:underline block max-w-full"
                            title="Open preview"
                          >
                            {f.name}
                          </button>
                          <div className="text-xs text-gray-500 truncate">
                            {new Date(f.uploadedAt).toLocaleString()}
                          </div>
                        </div>
                      </div>

                      {/* Modules column */}
                      <div className="flex items-center gap-2 text-sm text-gray-600 min-w-0 overflow-hidden">
                        <Folder className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <span className="truncate block min-w-0">
                          {modulesText}
                        </span>
                      </div>

                      {/* Size column */}
                      <div className="text-sm text-gray-600 min-w-0">
                        {formatBytes(f.size)}
                      </div>

                      {/* Actions column */}
                      <div className="flex justify-end gap-2 min-w-0">
                        <button
                          type="button"
                          onClick={() => openAddToModule(f)}
                          disabled={busy || modules.length === 0}
                          className="inline-flex items-center gap-2 px-3 py-2 rounded-md border border-gray-300 bg-white hover:bg-gray-100 text-sm text-[#2D3B45] disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Add to module"
                        >
                          <Plus className="w-4 h-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => downloadFile(f)}
                          disabled={busy}
                          className="inline-flex items-center gap-2 px-3 py-2 rounded-md border border-gray-300 bg-white hover:bg-gray-100 text-sm text-[#2D3B45] disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Download"
                        >
                          <Download className="w-4 h-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => setRenameTarget(f)}
                          disabled={busy}
                          className="inline-flex items-center gap-2 px-3 py-2 rounded-md border border-gray-300 bg-white hover:bg-gray-100 text-sm text-[#2D3B45] disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Rename"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => setDeleteTarget(f)}
                          disabled={busy}
                          className="inline-flex items-center gap-2 px-3 py-2 rounded-md border border-gray-300 bg-white hover:bg-red-50 text-sm text-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add to module modal */}
      {addTarget && (
        <CanvasModal
          title="Add file to module"
          onClose={() => setAddTarget(null)}
          size="md"
        >
          <div className="space-y-4">
            <div className="text-sm text-gray-700">
              File: <span className="font-semibold">{addTarget.name}</span>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#2D3B45] mb-1">
                Module
              </label>
              <select
                value={selectedModuleTitle}
                onChange={(e) => setSelectedModuleTitle(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-[#2D3B45] focus:ring-1 focus:ring-[#008EE2] focus:border-[#008EE2] outline-none"
              >
                {modules.map((m) => (
                  <option key={m.title} value={m.title}>
                    {m.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setAddTarget(null)}
                className="px-4 py-2 text-sm font-medium rounded-md border border-gray-300 text-[#2D3B45] bg-white hover:bg-gray-100 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (!addTarget) return;
                  addFileToModule(addTarget, selectedModuleTitle);
                  setAddTarget(null);
                }}
                disabled={!selectedModuleTitle}
                className="px-4 py-2 text-sm font-medium rounded-md bg-[#008EE2] text-white hover:bg-[#0079C2] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                Add
              </button>
            </div>
          </div>
        </CanvasModal>
      )}

      <ConfirmDeleteModal
        isOpen={!!deleteTarget}
        title="Delete file?"
        description={
          deleteTarget
            ? `This will permanently remove "${deleteTarget.name}" from this course. This cannot be undone.`
            : ""
        }
        confirmText="Delete"
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (!deleteTarget) return;
          deleteFile(deleteTarget);
        }}
      />

      <RenameFileModal
        isOpen={!!renameTarget}
        initialName={renameTarget?.name ?? ""}
        onClose={() => setRenameTarget(null)}
        onRename={(newName) => {
          if (!renameTarget) return;
          renameFile(renameTarget, newName);
        }}
      />
    </div>
  );
}
