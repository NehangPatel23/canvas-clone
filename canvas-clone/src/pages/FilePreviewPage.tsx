import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Download, File as FileIcon } from "lucide-react";
import CourseHeader from "../components/CourseHeader";
import {
  idbGetBlob,
  loadFilesMeta,
  formatBytes,
  type StoredFileMeta,
} from "../utils/files";

type PreviewKind = "image" | "pdf" | "video" | "audio" | "unknown";

export default function FilePreviewPage() {
  const navigate = useNavigate();
  const { courseId, fileId } = useParams();

  const [meta, setMeta] = useState<StoredFileMeta | null>(null);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [blob, setBlob] = useState<Blob | null>(null);

  // If browser fails to play media, we can show a fallback message
  const [mediaError, setMediaError] = useState<string | null>(null);

  useEffect(() => {
    const cid = courseId;
    const fid = fileId;
    if (!cid || !fid) return;

    const metas = loadFilesMeta(cid);
    const m = metas.find((x) => x.id === fid) ?? null;
    setMeta(m);
  }, [courseId, fileId]);

  useEffect(() => {
    const cid = courseId;
    const fid = fileId;
    if (!cid || !fid) return;

    let alive = true;
    setMediaError(null);

    (async () => {
      const b = await idbGetBlob(`${cid}:${fid}`);
      if (!alive) return;

      setBlob(b ?? null);

      if (b) {
        const url = URL.createObjectURL(b);
        setBlobUrl(url);
      } else {
        setBlobUrl(null);
      }
    })();

    return () => {
      alive = false;
      setBlob(null);
      setBlobUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
    };
  }, [courseId, fileId]);

  const previewKind: PreviewKind = useMemo(() => {
    if (!meta) return "unknown";
    const mime = meta.mime ?? "";
    if (mime.startsWith("image/")) return "image";
    if (mime === "application/pdf") return "pdf";
    if (mime.startsWith("video/")) return "video";
    if (mime.startsWith("audio/")) return "audio";
    return "unknown";
  }, [meta]);

  const download = async () => {
    const cid = courseId;
    const fid = fileId;
    if (!cid || !fid) return;
    if (!blob) return;

    // Use existing blobUrl if present, otherwise create one for download
    const url = blobUrl ?? URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = meta?.name ?? "download";
    document.body.appendChild(a);
    a.click();
    a.remove();

    // If we created a temporary URL (blobUrl was null), revoke it
    if (!blobUrl) URL.revokeObjectURL(url);
  };

  if (!courseId || !fileId) {
    return (
      <div className="flex flex-col w-full bg-canvas-grayLight min-h-screen">
        <CourseHeader />
        <div className="px-16 py-10">
          <div className="max-w-4xl text-gray-700">
            Missing courseId or fileId.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full bg-canvas-grayLight min-h-screen">
      <CourseHeader />

      <div className="flex-1 px-16 py-10 overflow-y-auto bg-white">
        <div className="max-w-5xl">
          <div className="flex items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3 min-w-0">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-md border border-gray-300 bg-white hover:bg-gray-50 text-sm"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>

              <div className="min-w-0">
                <div className="flex items-center gap-2 min-w-0">
                  <FileIcon className="w-4 h-4 text-gray-500 flex-shrink-0" />
                  <h2 className="text-xl font-semibold text-[#2D3B45] truncate">
                    {meta?.name ?? "File"}
                  </h2>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {meta
                    ? `${formatBytes(meta.size)} • ${meta.mime}`
                    : "Loading…"}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={download}
              disabled={!blob}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-[#008EE2] text-white text-sm font-medium hover:bg-[#0079C2] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="w-4 h-4" />
              Download
            </button>
          </div>

          <div className="rounded-xl border border-gray-200 bg-gray-50 overflow-hidden">
            {!blobUrl ? (
              <div className="px-6 py-10 text-gray-700">
                File blob not found in IndexedDB. Try re-uploading this file.
              </div>
            ) : mediaError ? (
              <div className="px-6 py-10 text-gray-700">
                {mediaError} Use Download instead.
              </div>
            ) : previewKind === "image" ? (
              <div className="bg-white">
                <img
                  src={blobUrl}
                  alt={meta?.name ?? "file"}
                  className="w-full max-h-[75vh] object-contain"
                />
              </div>
            ) : previewKind === "pdf" ? (
              <iframe
                title="PDF Preview"
                src={blobUrl}
                className="w-full h-[75vh] bg-white"
              />
            ) : previewKind === "video" ? (
              <div className="bg-black">
                <video
                  controls
                  className="w-full h-[75vh]"
                  src={blobUrl}
                  onError={() =>
                    setMediaError(
                      "This video format is not supported for inline preview."
                    )
                  }
                />
              </div>
            ) : previewKind === "audio" ? (
              <div className="bg-white px-6 py-10">
                <audio
                  controls
                  className="w-full"
                  src={blobUrl}
                  onError={() =>
                    setMediaError(
                      "This audio format is not supported for inline preview."
                    )
                  }
                />
                <div className="text-xs text-gray-500 mt-3">
                  If playback fails, download the file and open it locally.
                </div>
              </div>
            ) : (
              <div className="px-6 py-10 text-gray-700">
                No inline preview available for this file type. Use Download.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
