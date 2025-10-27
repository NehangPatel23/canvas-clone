import { useParams, Link } from "react-router-dom";
import { mockCourses } from "../data/mockData";

export default function CourseHomePage() {
  const { courseId } = useParams();
  const course = mockCourses.find((c) => c.id === courseId);

  if (!course) return <div className="p-8">Course not found.</div>;

  return (
    <div className="p-10 flex flex-col lg:flex-row gap-10 min-h-screen bg-[#F7F8FA]">
      {/* Left column */}
      <div className="flex-1">
        <h1 className="text-3xl font-semibold text-[#2D3B45]">{course.title}</h1>
        <p className="text-sm text-gray-600 mt-1">
          {course.code} • {course.term}
        </p>
        <p className="text-xs text-gray-400 mt-1">
          Last updated {course.updated_at}
        </p>

        <div className="mt-8 space-y-5 text-[15px] text-gray-700 leading-relaxed">
          <p className="border-l-4 border-[#008EE2] pl-4">
            Welcome to <strong>{course.short_name}</strong>. Use the sidebar to access
            Modules, Pages, and Files. Your students will see this page first.
          </p>
          <p>
            You can later set this homepage to Modules, Syllabus, or a custom
            Page—just like in Canvas.
          </p>
        </div>
      </div>

      {/* Right column */}
      <aside className="w-full lg:w-[320px] flex-shrink-0">
        <div className="border border-gray-200 rounded-lg bg-white shadow-sm">
          <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
            <span className="font-semibold text-gray-800 text-sm">
              Course Status
            </span>
            <span
              className={
                "text-xs font-medium px-2 py-1 rounded " +
                (course.published
                  ? "bg-green-100 text-green-700 border border-green-300"
                  : "bg-gray-200 text-gray-700 border border-gray-300")
              }
            >
              {course.published ? "Published" : "Unpublished"}
            </span>
          </div>

          <div className="p-4 text-sm text-gray-700 space-y-2">
            {["modules", "pages", "files"].map((item) => (
              <div key={item} className="flex justify-between">
                <span className="capitalize">{item}</span>
                <Link
                  to={`/courses/${course.id}/${item}`}
                  className="text-[#008EE2] hover:underline"
                >
                  View
                </Link>
              </div>
            ))}
          </div>
        </div>
      </aside>
    </div>
  );
}
