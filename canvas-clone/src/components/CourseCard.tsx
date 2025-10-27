import { Link } from "react-router-dom";

export default function CourseCard({ course }: { course: any }) {
  return (
    <Link
      to={`/courses/${course.id}`}
      className="border border-gray-200 rounded-lg shadow hover:shadow-md transition bg-white overflow-hidden w-[260px]"
    >
      <div className="p-4 text-white" style={{ backgroundColor: course.color }}>
        <div className="text-sm font-semibold">{course.short_name}</div>
        <div className="text-[11px] opacity-90">{course.term}</div>
      </div>
      <div className="p-4 text-gray-800 text-sm">
        <div className="font-medium">{course.title}</div>
        <div className="text-[12px] text-gray-500 mt-1">{course.code}</div>
        <div className="text-[11px] text-gray-400 mt-3">
          Updated {course.updated_at}
        </div>
      </div>
    </Link>
  );
}
