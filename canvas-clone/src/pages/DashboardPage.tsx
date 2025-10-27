import CourseCard from "../components/CourseCard";
import { mockCourses } from "../data/mockData";
import { Plus } from "lucide-react";

export default function DashboardPage() {
  return (
    <div className="flex flex-col flex-1 min-h-screen px-12 py-10 bg-[#F7F8FA]">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-[#2D3B45] mb-1">Dashboard</h1>
        <p className="text-sm text-gray-500">
          View and manage your enrolled courses.
        </p>
      </div>

      {/* Courses grid */}
      <div className="grid grid-cols-[repeat(auto-fill,minmax(320px,1fr))] gap-10">
        {mockCourses.map((c) => (
          <CourseCard key={c.id} course={c} />
        ))}

        {/* Create new course card */}
        <div className="group border-2 border-dashed border-gray-300 rounded-xl flex flex-col justify-center items-center h-full min-h-[210px] text-gray-500 cursor-pointer bg-white hover:bg-gray-50 hover:border-[#008EE2] transition-all hover:-translate-y-1 hover:shadow-md">
          <div className="flex flex-col items-center">
            <div className="w-14 h-14 mb-4 flex items-center justify-center rounded-full bg-[#008EE20A] border border-[#008EE2] group-hover:bg-[#008EE210]">
              <Plus className="w-7 h-7 text-[#008EE2]" strokeWidth={2.5} />
            </div>
            <div className="text-base font-medium text-gray-700 group-hover:text-[#008EE2]">
              Create New Course
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
