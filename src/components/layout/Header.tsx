import { Sun, Moon, Grape } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";

export default function Header() {
  const { theme, toggleTheme } = useTheme();

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-3 border-b border-white/10"
      style={{
        background: "rgba(15, 15, 20, 0.6)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
      }}
    >
      {/* Logo */}
      <div className="flex items-center gap-2">
        <div className="bg-violet-600/20 border border-violet-500/30 rounded-xl p-1.5">
          <Grape size={18} className="text-violet-400" />
        </div>
        <span className="logo-font text-foreground text-sm">VigneApp</span>
      </div>

      {/* Bouton thème */}
      <button
        onClick={toggleTheme}
        className="w-9 h-9 rounded-full flex items-center justify-center border border-white/10 transition-all duration-300 hover:scale-110 hover:border-violet-500/40"
        style={{
          background: "rgba(255, 255, 255, 0.05)",
          backdropFilter: "blur(10px)",
          WebkitBackdropFilter: "blur(10px)",
        }}
      >
        {theme === "dark" ? (
          <Sun size={16} className="text-yellow-400" />
        ) : (
          <Moon size={16} className="text-violet-400" />
        )}
      </button>
    </header>
  );
}
