import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "@/config/firebase";
import { MapPin, BarChart2, Percent, Grape } from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface Parcelle {
  id: string;
  nom: string;
  cepage: string;
  nombreAres: number;
  nombrePieds: number;
  piedsManquants: number;
}

const CEPAGE_COLORS: Record<string, string> = {
  "Pinot Noir": "#BA68C8",
  "Pinot Meunier": "#06b6d4",
  "Pinot Gris": "#f59e0b",
  "Pinot blanc": "#ef4444",
  "Petit Meslier": "#ec4899",
  "L’Arbanne": "#7FB14A",
  Chardonnay: "#10b981",
};

const FALLBACK_COLORS = [
  "#BA68C8",
  "#06b6d4",
  "#f59e0b",
  "#ef4444",
  "#ec4899",
  "#7FB14A",
  "#10b981",
];

const glassCard = {
  background: "rgba(255,255,255,0.15)",
  backdropFilter: "blur(16px)",
  WebkitBackdropFilter: "blur(16px)",
  border: "1px solid rgba(255,255,255,0.3)",
  
};

export default function Dashboard() {
  const [parcelles, setParcelles] = useState<Parcelle[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "parcelles"), (snap) => {
      const data = snap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Parcelle[];
      setParcelles(data);
    });
    return () => unsub();
  }, []);

  const totalParcelles = parcelles.length;
  const totalAres = parseFloat(
    parcelles.reduce((acc, p) => acc + (p.nombreAres || 0), 0).toFixed(2),
  );
  const totalPieds = parcelles.reduce(
    (acc, p) => acc + (p.nombrePieds || 0),
    0,
  );
  const totalManquants = parcelles.reduce(
    (acc, p) => acc + (p.piedsManquants || 0),
    0,
  );
  const tauxPerte =
    totalPieds > 0 ? ((totalManquants / totalPieds) * 100).toFixed(1) : "0.0";

  const cepageMap: Record<string, number> = {};
  parcelles.forEach((p) => {
    if (p.cepage) {
      cepageMap[p.cepage] = (cepageMap[p.cepage] || 0) + (p.nombreAres || 0);
    }
  });
  const cepageData = Object.entries(cepageMap).map(([name, value]) => ({
    name,
    value: parseFloat(value.toFixed(2)),
  }));

  const getCepageColor = (name: string, index: number) => {
    return (
      CEPAGE_COLORS[name] || FALLBACK_COLORS[index % FALLBACK_COLORS.length]
    );
  };

  const stats = [
    {
      label: "Parcelles",
      value: totalParcelles,
      icon: MapPin,
      route: "/parcelles",
      color: "text-violet-400",
      bg: "bg-violet-500/10",
      border: "border-violet-500/20",
    },
    {
      label: "Total Ares",
      value: totalAres,
      icon: BarChart2,
      route: "/parcelles",
      color: "text-cyan-400",
      bg: "bg-cyan-500/10",
      border: "border-cyan-500/20",
    },
    {
      label: "Taux de perte",
      value: `${tauxPerte}%`,
      icon: Percent,
      route: "/finance",
      color: "text-rose-400",
      bg: "bg-rose-500/10",
      border: "border-rose-500/20",
    },
    {
      label: "Cépages",
      value: Object.keys(cepageMap).length,
      icon: Grape,
      route: "/vendanges",
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/20",
    },
  ];

  return (
    <div className="p-4 space-y-4">
      <div className="pt-2">
        <h1 className="text-xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground text-sm">
          Détails de l'exploitation
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {stats.map(({ label, value, icon: Icon, color, bg, border, route }) => (
          <div
            key={label}
            onClick={() => route && navigate(route)}
            className={`rounded-2xl p-4 border ${border} cursor-pointer hover:scale-[1.02] transition`}
            style={glassCard}
          >
            <div
              className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center mb-3`}
            >
              <Icon size={18} className={color} />
            </div>
            <p className="text-2xl font-bold text-foreground">{value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl p-4 border border-white/10" style={glassCard}>
        <h2 className="text-sm font-semibold text-foreground mb-1">
          Répartition des cépages
        </h2>
        <p className="text-xs text-muted-foreground mb-4">
          Par surface en ares
        </p>

        {cepageData.length > 0 ? (
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={cepageData}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={85}
                paddingAngle={4}
                dataKey="value"
              >
                {cepageData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={getCepageColor(entry.name, index)}
                  />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: "rgba(15,15,25,0.9)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "12px",
                  color: "#fff",
                  fontSize: "12px",
                }}
                formatter={(value) => [`${value} ares`, ""]}
              />
              <Legend
                iconType="circle"
                iconSize={8}
                wrapperStyle={{ fontSize: "11px", color: "#9ca3af" }}
              />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[220px] flex items-center justify-center">
            <p className="text-muted-foreground text-sm">
              Aucune parcelle enregistrée
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
