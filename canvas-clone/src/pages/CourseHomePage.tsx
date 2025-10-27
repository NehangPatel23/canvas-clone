import CourseHeader from "../components/CourseHeader";
import { useParams } from "react-router-dom";
import { mockCourses } from "../data/mockData";

export default function CourseHomePage() {
  const { courseId } = useParams();
  const course = mockCourses.find((c) => String(c.id) === courseId);

  if (!course) return <div className="p-10">Course not found.</div>;

  return (
    <div className="flex flex-col w-full bg-canvas-grayLight h-full">
      <CourseHeader />

      {/* Page Content */}
      <div className="flex-1 px-16 py-10 overflow-y-auto bg-white">
        <div className="max-w-4xl">
          <h2 className="text-lg font-semibold text-canvas-grayDark mb-4">
            Welcome to {course.title}!
          </h2>
          <p className="text-gray-600 leading-relaxed mb-6">
            This is your course home page. Use the navigation on the left to
            explore modules, pages, and files. You can also publish or edit
            course content using the controls above.
          </p>

          <div className="h-px bg-gray-200 my-8"></div>

          <p className="text-gray-500 text-sm">
            You can customize this page by adding announcements, resources, or
            introductory content for students.
          </p>
        </div>
      </div>
    </div>
  );
}
