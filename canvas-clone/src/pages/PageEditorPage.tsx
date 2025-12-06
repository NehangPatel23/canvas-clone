import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import CourseHeader from "../components/CourseHeader";

function unslugPageId(pageId?: string) {
  if (!pageId) return "Untitled Page";
  const decoded = decodeURIComponent(pageId);
  // "course-overview" → "Course Overview"
  return decoded
    .replace(/-/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function PageEditorPage() {
  const { courseId, pageId } = useParams();
  const navigate = useNavigate();

  const storageKey =
    courseId && pageId ? `canvasClone:page:${courseId}:${pageId}` : undefined;

  const [title, setTitle] = useState(() => unslugPageId(pageId));
  const [content, setContent] = useState("");

  // Load saved content (if any) on mount / when courseId/pageId change
  useEffect(() => {
    if (!storageKey) return;
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (!raw) return;
      const parsed = JSON.parse(raw) as { title?: string; content?: string };

      if (parsed.title) {
        setTitle(parsed.title);
      }
      if (typeof parsed.content === "string") {
        setContent(parsed.content);
      }
    } catch (err) {
      console.error("Failed to load page content from storage", err);
    }
  }, [storageKey]);

  const handleCancel = () => {
    if (courseId) {
      navigate(`/courses/${courseId}/modules`);
    } else {
      navigate(-1);
    }
  };

  const handleSave = () => {
    if (!storageKey || !courseId) {
      if (courseId) navigate(`/courses/${courseId}/modules`);
      else navigate(-1);
      return;
    }

    const payload = JSON.stringify({ title, content });

    try {
      window.localStorage.setItem(storageKey, payload);
    } catch (err) {
      console.error("Failed to save page content to storage", err);
    }

    navigate(`/courses/${courseId}/modules`);
  };

  return (
    <div className="flex flex-col w-full bg-canvas-grayLight min-h-screen">
      <CourseHeader />

      <div className="flex-1 px-16 py-8 overflow-y-auto">
        <div className="max-w-4xl mx-auto">
          {/* Page header / actions */}
          <div className="mb-4 flex items-center justify-between gap-4">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="flex-1 text-3xl font-semibold text-canvas-grayDark bg-transparent border-b border-transparent focus:border-gray-300 focus:outline-none pb-1"
            />

            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleCancel}
                className="px-3 py-1.5 text-sm font-medium rounded-md border border-gray-300 bg-white hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="px-4 py-1.5 text-sm font-medium rounded-md bg-[#008EE2] text-white hover:bg-[#0079C2]"
              >
                Save
              </button>
            </div>
          </div>

          {/* Editor body */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
            <div className="border-b border-gray-200 px-4 py-2 text-sm text-gray-500">
              Rich Content Editor (toolbar placeholder)
            </div>

            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full min-h-[400px] px-4 py-3 text-[15px] leading-relaxed text-gray-800 resize-vertical focus:outline-none"
              placeholder="Start typing your page content here..."
            />
          </div>
        </div>
      </div>
    </div>
  );
}
