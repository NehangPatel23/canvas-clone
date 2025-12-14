// Stores file metadata in localStorage and file blobs in IndexedDB.

export type StoredFileMeta = {
  id: string;
  name: string; // Display name shown in Files UI
  size: number;
  mime: string;
  uploadedAt: number; // Date.now()
  moduleTitles: string[]; // ✅ multi-module references
};

const DB_NAME = "canvasClone";
const DB_VERSION = 1;
const STORE_NAME = "files";

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);

    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };

    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function withStore<T>(
  mode: IDBTransactionMode,
  fn: (store: IDBObjectStore) => IDBRequest<T>
): Promise<T> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, mode);
    const store = tx.objectStore(STORE_NAME);

    const req = fn(store);

    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);

    tx.oncomplete = () => db.close();
    tx.onerror = () => {
      const err = tx.error ?? new Error("IndexedDB transaction failed");
      db.close();
      reject(err);
    };
  });
}

export async function idbPutBlob(key: string, blob: Blob): Promise<void> {
  await withStore("readwrite", (store) => store.put(blob, key));
}

export async function idbGetBlob(key: string): Promise<Blob | undefined> {
  const res = await withStore("readonly", (store) => store.get(key));
  return res as unknown as Blob | undefined;
}

export async function idbDeleteBlob(key: string): Promise<void> {
  await withStore("readwrite", (store) => store.delete(key));
}

// ---------- localStorage metadata ----------

export function filesMetaKey(courseId: string) {
  return `canvasClone:files:${courseId}`;
}

function notifyFilesChanged() {
  window.dispatchEvent(new CustomEvent("canvasClone:filesChanged"));
}

function normalizeMeta(m: any): StoredFileMeta {
  // Back-compat: older metas might have moduleTitle?: string
  const moduleTitles: string[] = Array.isArray(m.moduleTitles)
    ? m.moduleTitles.filter(Boolean)
    : typeof m.moduleTitle === "string" && m.moduleTitle.trim()
    ? [m.moduleTitle.trim()]
    : [];

  return {
    id: String(m.id),
    name: String(m.name ?? ""),
    size: Number(m.size ?? 0),
    mime: String(m.mime ?? "application/octet-stream"),
    uploadedAt: Number(m.uploadedAt ?? Date.now()),
    moduleTitles,
  };
}

export function loadFilesMeta(courseId: string): StoredFileMeta[] {
  try {
    const raw = window.localStorage.getItem(filesMetaKey(courseId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map(normalizeMeta);
  } catch {
    return [];
  }
}

export function saveFilesMeta(courseId: string, metas: StoredFileMeta[]) {
  window.localStorage.setItem(filesMetaKey(courseId), JSON.stringify(metas));
  notifyFilesChanged();
}

export function updateFileMeta(
  courseId: string,
  fileId: string,
  patch: Partial<StoredFileMeta>
) {
  const existing = loadFilesMeta(courseId);
  const next = existing.map((f) => (f.id === fileId ? { ...f, ...patch } : f));
  saveFilesMeta(courseId, next);
}

export function addModuleRefToFile(
  courseId: string,
  fileId: string,
  moduleTitle: string
) {
  const t = moduleTitle.trim();
  if (!t) return;

  const metas = loadFilesMeta(courseId);
  const next = metas.map((m) => {
    if (m.id !== fileId) return m;
    const set = new Set(m.moduleTitles ?? []);
    set.add(t);
    return { ...m, moduleTitles: Array.from(set) };
  });

  saveFilesMeta(courseId, next);
}

export function removeModuleRefFromFile(
  courseId: string,
  fileId: string,
  moduleTitle: string
) {
  const t = moduleTitle.trim();
  const metas = loadFilesMeta(courseId);
  const next = metas.map((m) => {
    if (m.id !== fileId) return m;
    const filtered = (m.moduleTitles ?? []).filter((x) => x !== t);
    return { ...m, moduleTitles: filtered };
  });

  saveFilesMeta(courseId, next);
}

export function replaceModuleTitleInAllFiles(
  courseId: string,
  oldTitle: string,
  newTitle: string
) {
  const o = oldTitle.trim();
  const n = newTitle.trim();
  if (!o || !n) return;

  const metas = loadFilesMeta(courseId);
  const next = metas.map((m) => {
    if (!m.moduleTitles?.includes(o)) return m;
    const set = new Set(m.moduleTitles);
    set.delete(o);
    set.add(n);
    return { ...m, moduleTitles: Array.from(set) };
  });

  saveFilesMeta(courseId, next);
}

/**
 * Non-destructive merge sync:
 * Updates ONLY moduleTitles based on latest module refs,
 * but never deletes files or other metadata.
 */
export function mergeModuleRefsIntoFilesMeta(
  courseId: string,
  refs: Map<string, Set<string>>
) {
  const metas = loadFilesMeta(courseId);
  const next = metas.map((m) => {
    const set = refs.get(m.id);
    if (!set) return { ...m, moduleTitles: m.moduleTitles ?? [] };
    return { ...m, moduleTitles: Array.from(set) };
  });
  saveFilesMeta(courseId, next);
}

export function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  const mb = kb / 1024;
  if (mb < 1024) return `${mb.toFixed(1)} MB`;
  const gb = mb / 1024;
  return `${gb.toFixed(2)} GB`;
}

export function uid() {
  return (
    (crypto as any).randomUUID?.() ??
    `f_${Math.random().toString(16).slice(2)}_${Date.now()}`
  );
}

function splitExt(filename: string) {
  const idx = filename.lastIndexOf(".");
  if (idx <= 0) return { base: filename, ext: "" };
  return { base: filename.slice(0, idx), ext: filename.slice(idx) };
}

function buildDisplayName(desired: string, originalFileName: string) {
  const d = desired.trim();
  if (!d) return originalFileName;

  // If user includes an extension, keep it.
  if (d.includes(".") && !d.endsWith(".")) return d;

  // Otherwise preserve original extension.
  const { ext } = splitExt(originalFileName);
  return `${d}${ext}`;
}

function buildDisplayNameFromExisting(desired: string, existingName: string) {
  const d = desired.trim();
  if (!d) return existingName;

  // If user includes an extension, keep it.
  if (d.includes(".") && !d.endsWith(".")) return d;

  // Otherwise preserve existing extension.
  const { ext } = splitExt(existingName);
  return `${d}${ext}`;
}

/**
 * Rename only the metadata name (no blob changes).
 * Preserves the existing extension if user doesn't provide one.
 */
export function renameFileMetaInCourse(args: {
  courseId: string;
  fileId: string;
  displayName: string;
}) {
  const metas = loadFilesMeta(args.courseId);
  const current = metas.find((m) => m.id === args.fileId);
  if (!current) return;

  const nextName = buildDisplayNameFromExisting(args.displayName, current.name);

  const next = metas.map((m) =>
    m.id === args.fileId ? { ...m, name: nextName } : m
  );
  saveFilesMeta(args.courseId, next);
}

/**
 * Upload file blob + sync metadata to Files section.
 * The displayed name in Files will be `displayName` (if provided), preserving extension.
 */
export async function addFileToCourse(args: {
  courseId: string;
  file: File;
  moduleTitle?: string;
  displayName?: string;
}): Promise<StoredFileMeta> {
  const id = uid();

  const moduleTitles =
    args.moduleTitle && args.moduleTitle.trim()
      ? [args.moduleTitle.trim()]
      : [];

  const meta: StoredFileMeta = {
    id,
    name: buildDisplayName(args.displayName ?? "", args.file.name),
    size: args.file.size,
    mime: args.file.type || "application/octet-stream",
    uploadedAt: Date.now(),
    moduleTitles,
  };

  await idbPutBlob(`${args.courseId}:${id}`, args.file);

  const existing = loadFilesMeta(args.courseId);
  saveFilesMeta(args.courseId, [...existing, meta]);

  return meta;
}

/**
 * Replace the underlying blob for an existing fileId in this course,
 * and update metadata size/mime/uploadedAt.
 * Name stays the same unless `displayName` is provided.
 */
export async function replaceFileBlobInCourse(args: {
  courseId: string;
  fileId: string;
  file: File;
  displayName?: string;
}) {
  const existing = loadFilesMeta(args.courseId);
  const current = existing.find((f) => f.id === args.fileId);
  if (!current) throw new Error("File not found");

  const nextName =
    args.displayName != null
      ? buildDisplayName(args.displayName, args.file.name)
      : current.name;

  await idbPutBlob(`${args.courseId}:${args.fileId}`, args.file);

  const next = existing.map((f) =>
    f.id === args.fileId
      ? {
          ...f,
          name: nextName,
          size: args.file.size,
          mime: args.file.type || "application/octet-stream",
          uploadedAt: Date.now(),
        }
      : f
  );

  saveFilesMeta(args.courseId, next);
}
