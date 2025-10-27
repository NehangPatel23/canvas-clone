import CourseHeader from "../components/CourseHeader";

export default function PagesPage() {
  return (
    <div className="flex flex-col w-full bg-canvas-grayLight h-full">
      <CourseHeader />

      <div className="flex-1 px-16 py-10 overflow-y-auto bg-white">
        <div className="max-w-4xl">
          <h2 className="text-2xl font-semibold text-canvas-grayDark mb-6">
            Pages
          </h2>
          <p className="text-gray-600 leading-relaxed mb-6">
            This is where your course pages will appear. You can create and edit
            rich text pages that serve as lectures, reference materials, or
            announcements.
          </p>

          <div className="h-px bg-gray-200 my-8"></div>

          <p className="text-gray-500 text-sm">
            Use this area to draft your course syllabus or share helpful
            materials with students.
          </p>
        </div>
      </div>
    </div>
  );
}
