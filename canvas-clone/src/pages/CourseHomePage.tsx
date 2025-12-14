import { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import CourseHeader from "../components/CourseHeader";
import { mockCourses } from "../data/mockData";

import { loadModulesFromStorage, extractPageItems } from "../utils/modules";
import { loadFilesMeta, formatBytes } from "../utils/files";

export default function CourseHomePage() {
  const navigate = useNavigate();
  const { courseId } = useParams();

  const course = mockCourses.find((c) => String(c.id) === courseId);

  const modules = useMemo(() => loadModulesFromStorage(), []);
  const pages = useMemo(() => extractPageItems(modules), [modules]);

  const files = useMemo(() => {
    if (!courseId) return [];
    return loadFilesMeta(courseId);
  }, [courseId]);

  const recentFiles = useMemo(() => {
    return [...files].sort((a, b) => b.uploadedAt - a.uploadedAt).slice(0, 5);
  }, [files]);

  const totalModuleItems = useMemo(() => {
    return modules.reduce((sum, m) => sum + (m.items?.length ?? 0), 0);
  }, [modules]);

  if (!course) return <div className="p-10">Course not found.</div>;

  return (
    <div className="flex flex-col w-full bg-canvas-grayLight h-full">
      <CourseHeader />

      <div className="flex-1 px-16 py-10 overflow-y-auto bg-white">
        <div className="max-w-5xl">
          <h2 className="text-xl font-semibold text-canvas-grayDark">
            Welcome to {course.title}
          </h2>
          <p className="text-gray-600 leading-relaxed mt-2">
            Quick access to your course content. Jump into Modules, manage
            Pages, or upload Files.
          </p>

          <div className="h-px bg-gray-200 my-8" />

          {/* Overview cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="text-sm text-gray-500">Modules</div>
              <div className="mt-1 text-2xl font-semibold text-[#2D3B45]">
                {modules.length}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {totalModuleItems} item{totalModuleItems === 1 ? "" : "s"} total
              </div>
              <button
                onClick={() => navigate(`/courses/${courseId}/modules`)}
                className="mt-4 w-full px-4 py-2 text-sm font-medium rounded-md bg-[#008EE2] text-white hover:bg-[#0079C2]"
              >
                Open Modules
              </button>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="text-sm text-gray-500">Pages</div>
              <div className="mt-1 text-2xl font-semibold text-[#2D3B45]">
                {pages.length}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Pages currently referenced in modules
              </div>
              <button
                onClick={() => navigate(`/courses/${courseId}/pages`)}
                className="mt-4 w-full px-4 py-2 text-sm font-medium rounded-md bg-[#008EE2] text-white hover:bg-[#0079C2]"
              >
                Open Pages
              </button>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="text-sm text-gray-500">Files</div>
              <div className="mt-1 text-2xl font-semibold text-[#2D3B45]">
                {files.length}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Stored locally in IndexedDB for this prototype
              </div>
              <button
                onClick={() => navigate(`/courses/${courseId}/files`)}
                className="mt-4 w-full px-4 py-2 text-sm font-medium rounded-md bg-[#008EE2] text-white hover:bg-[#0079C2]"
              >
                Open Files
              </button>
            </div>
          </div>

          {/* Recent files */}
          <div className="mt-8">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-[#2D3B45]">
                Recent files
              </h3>
              <button
                onClick={() => navigate(`/courses/${courseId}/files`)}
                className="text-sm font-medium text-[#008EE2] hover:underline"
              >
                View all
              </button>
            </div>

            <div className="mt-3 rounded-xl border border-gray-200 overflow-hidden">
              {recentFiles.length === 0 ? (
                <div className="px-5 py-6 text-sm text-gray-600 bg-gray-50">
                  No files uploaded yet.
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {recentFiles.map((f) => (
                    <button
                      key={f.id}
                      onClick={() =>
                        navigate(`/courses/${courseId}/files/${f.id}`)
                      }
                      className="w-full text-left px-5 py-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-[#2D3B45] truncate">
                            {f.name}
                          </div>
                          <div className="text-xs text-gray-500">
                            {new Date(f.uploadedAt).toLocaleString()}
                          </div>
                        </div>
                        <div className="text-xs text-gray-600 flex-shrink-0">
                          {formatBytes(f.size)}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="mt-10 text-xs text-gray-500">
            Tip: If you want this page to live-update when Files/Modules change
            elsewhere, we can add the same event-based refresh pattern you used
            for files (and a similar one for modules).
          </div>
        </div>
      </div>
    </div>
  );
}
