import { Routes, Route } from "react-router-dom";
import GlobalNav from "./components/GlobalNav";
import DashboardPage from "./pages/DashboardPage";

export default function App() {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <div className="flex min-h-screen bg-white text-gray-900">
            <GlobalNav />
            <div className="flex-1">
              <DashboardPage />
            </div>
          </div>
        }
      />
      {/* More routes (courses/modules/pages) will go here later */}
    </Routes>
  );
}
