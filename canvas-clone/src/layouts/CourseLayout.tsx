import CourseSidebar from "../components/CourseSidebar";

export default function CourseLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-canvas-grayLight">
      <CourseSidebar />
      <main className="flex-1 px-12 py-10">{children}</main>
    </div>
  );
}
