import { NavLink } from "react-router-dom";
import { LayoutDashboard, Map, Grape, Euro, FileText } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";

const navItems = [
  { to: "/parcelles", icon: Map, label: "Parcelles" },
  { to: "/vendanges", icon: Grape, label: "Vendanges" },
  { to: "/", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/finance", icon: Euro, label: "Finance" },
  { to: "/documents", icon: FileText, label: "Docs" },
];

export default function BottomBar() {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-between px-2 py-2 border-t border-white/20"
      style={{
        background: "rgba(15, 15, 20, 0.10)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
      }}
    >
      {navItems.map(({ to, icon: Icon, label }) => (
        <NavLink key={to} to={to} end={to === "/"}>
          {({ isActive }) => (
            <div
              className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-xl transition-all duration-200`}
              style={{
                color: isActive
                  ? "#e3c47d"
                  : isDark
                    ? "rgba(255,255,255,0.6)"
                    : "#000a18",
              }}
            >
              <div
                className={`transition-all duration-300 ${isActive ? "scale-125" : "scale-100"}`}
              >
                <Icon size={18} strokeWidth={isActive ? 2.5 : 1.8} />
              </div>
              <span
                className={`text-[10px] font-medium transition-all duration-300 ${isActive ? "opacity-100" : "opacity-70"}`}
              >
                {label}
              </span>
            </div>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
