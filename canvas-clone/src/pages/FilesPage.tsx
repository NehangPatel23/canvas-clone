import CourseHeader from "../components/CourseHeader";

export default function FilesPage() {
  return (
    <div className="flex flex-col w-full bg-canvas-grayLight h-full">
      <CourseHeader />

      <div className="flex-1 px-16 py-10 overflow-y-auto bg-white">
        <div className="max-w-4xl">
          <h2 className="text-2xl font-semibold text-canvas-grayDark mb-6">
            Files
          </h2>
          <p className="text-gray-600 leading-relaxed mb-6">
            This section will hold all uploaded files for this course. You’ll be
            able to preview, download, and organize them later.
          </p>

          <div className="h-px bg-gray-200 my-8"></div>

          <p className="text-gray-500 text-sm">
            You can upload lecture slides, datasets, PDFs, and other materials
            here for your students.
          </p>
        </div>
      </div>
    </div>
  );
}
