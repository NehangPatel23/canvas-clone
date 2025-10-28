import { SpeedInsights } from "@vercel/speed-insights/next"
import { Routes, Route, Outlet } from "react-router-dom";
import GlobalNav from "./components/GlobalNav";
import DashboardPage from "./pages/DashboardPage";
import CourseLayout from "./layouts/CourseLayout";
import CourseHomePage from "./pages/CourseHomePage";
import ModulesPage from "./pages/ModulesPage";
import PagesPage from "./pages/PagesPage";
import FilesPage from "./pages/FilesPage";

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
      <SpeedInsights />
      <Route element={<MainLayout />}>
        {/* Dashboard */}
        <Route path="/" element={<DashboardPage />} />

        {/* Courses */}
        <Route path="/courses/:courseId" element={<CourseLayout />}>
          <Route index element={<CourseHomePage />} />
          <Route path="modules" element={<ModulesPage />} />
          <Route path="pages" element={<PagesPage />} />
          <Route path="files" element={<FilesPage />} />
        </Route>
      </Route>
    </Routes>
  );
}
