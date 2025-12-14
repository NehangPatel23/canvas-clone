import { useState } from "react";
import { useParams } from "react-router-dom";
import { mockCourses } from "../data/mockData";

export default function CourseHeader() {
  const { courseId } = useParams();
  if (!courseId) return null;

  const course = mockCourses.find((c) => String(c.id) === courseId);
  const [isPublished, setIsPublished] = useState(true);

  if (!course) return null;

  return (
    <div className="bg-white border-b border-canvas-border px-10 py-6 flex items-center justify-between shadow-sm">
      <div>
        <h1 className="text-2xl font-semibold text-canvas-grayDark">
          {course.title}
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          {course.term} • {course.code}
        </p>
      </div>

      <div className="flex items-center gap-4">
        <button
          onClick={() => setIsPublished(!isPublished)}
          className={`px-4 py-1.5 text-sm font-medium rounded-md border transition-all ${
            isPublished
              ? "border-canvas-blue text-canvas-blue bg-white hover:bg-canvas-blue hover:text-white"
              : "border-canvas-green text-canvas-green bg-white hover:bg-canvas-green hover:text-white"
          }`}
        >
          {isPublished ? "Unpublish" : "Publish"}
        </button>

        {isPublished ? (
          <div className="flex items-center gap-2 text-sm font-medium text-canvas-green">
            <span className="w-2.5 h-2.5 rounded-full bg-canvas-green inline-block shadow-sm"></span>
            Published
          </div>
        ) : (
          <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
            <span className="w-2.5 h-2.5 rounded-full bg-gray-400 inline-block shadow-sm"></span>
            Unpublished
          </div>
        )}

        <div className="h-5 w-px bg-gray-300 mx-1"></div>

        <button className="px-4 py-1.5 text-sm font-medium rounded-md border border-gray-300 text-gray-700 bg-white hover:bg-gray-100 transition-all">
          Settings
        </button>

        <button className="px-4 py-1.5 text-sm font-medium rounded-md border border-gray-300 text-gray-700 bg-white hover:bg-gray-100 transition-all">
          Edit
        </button>
      </div>
    </div>
  );
}
