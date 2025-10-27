import { Routes, Route, Outlet } from "react-router-dom";
import GlobalNav from "./components/GlobalNav";
import DashboardPage from "./pages/DashboardPage";
import CourseLayout from "./layouts/CourseLayout";
import CourseHomePage from "./pages/CourseHomePage";

function MainLayout() {
  return (
    <div className="flex min-h-screen bg-canvas-grayLight text-gray-900">
      <GlobalNav />
      <main className="flex-1 min-w-0">
        <Outlet />
      </main>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      {/* Persistent GlobalNav layout wrapper */}
      <Route element={<MainLayout />}>
        {/* Dashboard */}
        <Route path="/" element={<DashboardPage />} />

        {/* Course route */}
      <Route
        path="/courses/:courseId"
        element={
          <CourseLayout>
            <CourseHomePage />
          </CourseLayout>
        }
      />
      </Route>
    </Routes>
  );
}


