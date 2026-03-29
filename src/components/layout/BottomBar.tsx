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

  const activeGradient = isDark
    ? "linear-gradient(135deg, #e3c47d, #edd8ae)"
    : "linear-gradient(135deg, #8c3348, #d48aa0)";

  const lightIconColor = "#8c3348";

  return (
    <nav
      className="fixed bottom-0 left-1/2 -translate-x-1/2 z-50 flex items-center gap-1 px-4 pt-4 pb-4 border border-white/20 shadow-xl rounded-t-[70px]"
      style={{
        width: "95%",
        maxWidth: "420px",
        background: isDark
          ? "rgba(15, 15, 20, 0.20)"
          : "rgba(255,255,255,0.16)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        boxShadow: "0 -8px 30px rgba(0,0,0,0.25)",
      }}
    >
      {navItems.map(({ to, icon: Icon, label }) => (
        <NavLink
          key={to}
          to={to}
          end={to === "/"}
          className="flex-1 flex justify-center relative"
        >
          {({ isActive }) => {
            // Déterminer taille du cadre
            const isDashboard = to === "/";
            const containerSize = isDashboard ? "w-11 h-11" : "w-9 h-9";

            return (
              <div className="relative flex flex-col items-center justify-center">
                <div
                  className={`relative flex items-center justify-center ${containerSize} rounded-lg transition-all duration-300
                    ${isActive ? "shadow-inner scale-110 -translate-y-1" : "scale-95 opacity-50 hover:scale-100 hover:opacity-80"}`}
                >
                  {/* Glow autour icône active */}
                  {isActive && (
                    <div
                      className="absolute inset-0 rounded-lg"
                      style={{
                        backgroundImage: activeGradient,
                        filter: "blur(8px)",
                        opacity: 0.3,
                        zIndex: 0,
                      }}
                    />
                  )}

                  {/* Icône */}
                  {isActive ? (
                    isDark ? (
                      <div
                        className="relative z-10 flex items-center justify-center w-full h-full"
                        style={{
                          backgroundImage: activeGradient,
                          WebkitBackgroundClip: "text",
                          WebkitTextFillColor: "transparent",
                          backgroundClip: "text",
                        }}
                      >
                        <Icon size={isDashboard ? 30 : 23} strokeWidth={2.5} />
                      </div>
                    ) : (
                      <Icon
                        size={isDashboard ? 30 : 23}
                        strokeWidth={2.5}
                        style={{ color: lightIconColor }}
                        className="relative z-10"
                      />
                    )
                  ) : (
                    <Icon
                      size={isDashboard ? 30 : 23}
                      strokeWidth={1.8}
                      style={{
                        color: isDark ? "rgba(255,255,255,0.6)" : "#000a18",
                      }}
                      className="transition-all duration-300 relative z-10"
                    />
                  )}

                  {/* Fond léger derrière icône active */}
                  {isActive && (
                    <div
                      className="absolute inset-0 rounded-lg z-0"
                      style={{ background: "rgba(255,255,255,0.08)" }}
                    />
                  )}
                </div>

                {/* Label */}
                {isActive && (
                  <span
                    className="absolute -bottom-4 text-[10px] opacity-90 bg-clip-text text-transparent whitespace-nowrap"
                    style={{ backgroundImage: activeGradient }}
                  >
                    {label}
                  </span>
                )}
              </div>
            );
          }}
        </NavLink>
      ))}
    </nav>
  );
}
