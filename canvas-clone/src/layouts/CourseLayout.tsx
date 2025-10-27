import { Outlet } from "react-router-dom";
import CourseSidebar from "../components/CourseSidebar";

export default function CourseLayout() {
  return (
    <div className="flex h-screen overflow-hidden bg-canvas-grayLight">
      {/* Left: Course sidebar */}
      <CourseSidebar />

      {/* Right: Main course content area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Outlet />
      </div>
    </div>
  );
}
