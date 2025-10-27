import CourseCard from "../components/CourseCard";
import { mockCourses } from "../data/mockData";

export default function DashboardPage() {
  return (
    <div className="flex flex-col flex-1 overflow-auto bg-white p-8">
      <h1 className="text-2xl font-semibold text-gray-800 mb-6">Dashboard</h1>
      <div className="flex flex-wrap gap-6">
        {mockCourses.map((c) => (
          <CourseCard key={c.id} course={c} />
        ))}

        <div className="border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center text-center text-gray-500 w-[260px] h-[150px] cursor-pointer hover:bg-gray-50">
          <div>
            <div className="text-xl">＋</div>
            <div className="text-sm font-medium">Create New Course</div>
          </div>
        </div>
      </div>
    </div>
  );
}
