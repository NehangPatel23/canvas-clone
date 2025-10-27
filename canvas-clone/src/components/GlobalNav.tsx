import { Link } from "react-router-dom";

export default function GlobalNav() {
  return (
    <nav className="bg-gray-900 text-white flex flex-col items-center py-4 w-[85px] shrink-0">
      <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center text-sm font-semibold mb-6">
        NP
      </div>

      <Link
        to="/"
        className="flex flex-col items-center py-3 text-xs hover:text-blue-400"
      >
        <span>🏠</span>
        <span>Dashboard</span>
      </Link>

      <button className="flex flex-col items-center py-3 text-xs text-gray-400">
        <span>📚</span>
        <span>Courses</span>
      </button>
    </nav>
  );
}
