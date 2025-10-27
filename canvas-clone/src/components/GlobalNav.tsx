import { Link, useLocation } from "react-router-dom";
import { Home, BookOpen, Calendar, Mail } from "lucide-react";

export default function GlobalNav() {
  const location = useLocation();

  const navItems = [
    { label: "Dashboard", icon: Home, path: "/" },
    { label: "Courses", icon: BookOpen, path: "/courses" },
    { label: "Calendar", icon: Calendar },
    { label: "Inbox", icon: Mail },
  ];

  return (
    <nav className="bg-[#2D3B45] text-white flex flex-col items-center py-8 w-[104px] shrink-0">
      {/* User bubble */}
      <div className="w-11 h-11 rounded-full bg-[#3A4C59] flex items-center justify-center text-sm font-semibold mb-10 border border-gray-600">
        NP
      </div>

      {/* Nav items */}
      {navItems.map(({ label, icon: Icon, path }) => {
        const isActive = path && location.pathname === path;

        return (
          <Link
            key={label}
            to={path || "#"}
            className={`group relative flex flex-col items-center py-4 text-[13px] font-medium w-full transition-all ${
              isActive ? "text-[#008EE2]" : "text-gray-300 hover:text-white"
            }`}
          >
            {/* Active blue bar */}
            <div
              className={`absolute left-0 top-0 h-full w-[3px] rounded-r-md transition-all ${
                isActive
                  ? "bg-[#008EE2] opacity-100"
                  : "opacity-0 group-hover:opacity-40 group-hover:bg-[#008EE2]"
              }`}
            />

            {/* Icon */}
            <div
              className={`w-11 h-11 rounded-md flex items-center justify-center mb-2 transition-colors ${
                isActive ? "bg-[#FFFFFF1A]" : "bg-[#3A4C59] group-hover:bg-[#465B6A]"
              }`}
            >
              <Icon className="w-6 h-6" strokeWidth={1.9} />
            </div>

            {/* Label */}
            <span className="leading-none">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
