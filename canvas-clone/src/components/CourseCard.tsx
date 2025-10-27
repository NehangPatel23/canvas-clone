import { Link } from "react-router-dom";

export default function CourseCard({ course }: { course: any }) {
  return (
    <Link
      to={`/courses/${course.id}`}
      className="group border border-gray-200 rounded-xl shadow-sm hover:shadow-lg transition-all bg-white overflow-hidden w-[320px] hover:-translate-y-1"
    >
      {/* top banner */}
      <div
        className="p-5 text-white"
        style={{ backgroundColor: course.color }}
      >
        <div className="text-base font-semibold">{course.short_name}</div>
        <div className="text-[12px] opacity-90">{course.term}</div>
      </div>

      {/* content */}
      <div className="p-6 text-gray-800">
        <div className="text-lg font-medium leading-snug mb-1">
          {course.title}
        </div>
        <div className="text-[13px] text-gray-500">{course.code}</div>
        <div className="text-[12px] text-gray-400 mt-3">
          Updated {course.updated_at}
        </div>
      </div>
    </Link>
  );
}
