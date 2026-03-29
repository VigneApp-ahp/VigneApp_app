import { Sun, Moon } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import logo from "@/assets/logo02.svg";

export default function Header() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-3 border-b border-white/20"
      style={{
        background: "rgba(15, 15, 20, 0.25)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
      }}
    >
      <div className="w-9 h-9">
        <img
          src={logo}
          alt="VigneApp logo"
          className="w-full h-full object-contain"
        />
      </div>

      <span
        className="logo-font absolute left-1/2 -translate-x-1/2 font-semibold text-sm tracking-wide"
        style={{ color: isDark ? "white" : "#000a18" }}
      >
        VigneApp
      </span>

      <button
        onClick={toggleTheme}
        className="w-9 h-9 rounded-full flex items-center justify-center border border-white/20 transition-all duration-300 hover:scale-110 hover:border-white/40"
        style={{
          background: "rgba(255, 255, 255, 0.08)",
          backdropFilter: "blur(10px)",
          WebkitBackdropFilter: "blur(10px)",
        }}
      >
        {theme === "dark" ? (
          <Sun size={16} strokeWidth={1.5} style={{ color: "white" }} />
        ) : (
          <Moon size={16} strokeWidth={1.5} style={{ color: "#000a18" }} />
        )}
      </button>
    </header>
  );
}
