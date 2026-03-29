import { useEffect, useState } from "react";
import {
  collection,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { db } from "@/config/firebase";
import { Plus, Pencil, Trash2, X, Check, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

interface Parcelle {
  id: string;
  nom: string;
  cepage: string;
  annee: number;
  refCadastre: string;
  nombreAres: number;
  nombreRoutes: number;
  nombrePieds: number;
  piedsManquants: number;
}

const glassCard = {
  background: "rgba(255,255,255,0.17)",
  backdropFilter: "blur(16px)",
  WebkitBackdropFilter: "blur(16px)",
  border: "1px solid rgba(255,255,255,0.3)",
};

const defaultForm = {
  nom: "",
  cepage: "",
  annee: new Date().getFullYear(),
  refCadastre: "",
  nombreAres: 0,
  nombreRoutes: 0,
  nombrePieds: 0,
  piedsManquants: 0,
};

function CircularLoss({
  total,
  manquants,
}: {
  total: number;
  manquants: number;
}) {
  const pct = total > 0 ? Math.min((manquants / total) * 100, 100) : 0;
  const radius = 20;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (pct / 100) * circumference;
  const color = pct < 5 ? "#10b981" : pct < 15 ? "#f59e0b" : "#ef4444";

  return (
    <div className="flex flex-col items-center gap-0.5">
      <svg width="52" height="52" viewBox="0 0 52 52">
        <circle
          cx="26"
          cy="26"
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.1)"
          strokeWidth="5"
        />
        <circle
          cx="26"
          cy="26"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="5"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          transform="rotate(-90 26 26)"
          style={{ transition: "stroke-dashoffset 0.5s ease" }}
        />
        <text
          x="26"
          y="26"
          textAnchor="middle"
          dominantBaseline="central"
          fontSize="9"
          fontWeight="bold"
          fill={color}
        >
          {pct.toFixed(0)}%
        </text>
      </svg>
      <span className="text-[9px] text-muted-foreground">perte</span>
    </div>
  );
}

function ParcelleForm({
  initial,
  onSave,
  onCancel,
}: {
  initial: Omit<Parcelle, "id">;
  onSave: (data: Omit<Parcelle, "id">) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState(initial);
  const set = (field: string, value: string | number) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  return (
    <div
      className="rounded-2xl p-4 border border-violet-500/30 space-y-3"
      style={glassCard}
    >
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-xs">Nom</Label>
          <Input
            value={form.nom}
            onChange={(e) => set("nom", e.target.value)}
            placeholder="Ex: La Vigne Haute"
            className="h-8 text-sm"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Cépage</Label>
          <Input
            value={form.cepage}
            onChange={(e) => set("cepage", e.target.value)}
            placeholder="Ex: Pinot Noir"
            className="h-8 text-sm"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Année plantation</Label>
          <Input
            type="number"
            value={form.annee}
            onChange={(e) => set("annee", parseInt(e.target.value))}
            className="h-8 text-sm"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Réf. Cadastre</Label>
          <Input
            value={form.refCadastre}
            onChange={(e) => set("refCadastre", e.target.value)}
            placeholder="Ex: A1234"
            className="h-8 text-sm"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Nombre d'ares</Label>
          <Input
            type="number"
            value={form.nombreAres}
            onChange={(e) => set("nombreAres", parseFloat(e.target.value))}
            className="h-8 text-sm"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Nombre de routes</Label>
          <Input
            type="number"
            value={form.nombreRoutes}
            onChange={(e) => set("nombreRoutes", parseInt(e.target.value))}
            className="h-8 text-sm"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Pieds total</Label>
          <Input
            type="number"
            value={form.nombrePieds}
            onChange={(e) => set("nombrePieds", parseInt(e.target.value))}
            className="h-8 text-sm"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Pieds manquants</Label>
          <Input
            type="number"
            value={form.piedsManquants}
            onChange={(e) => set("piedsManquants", parseInt(e.target.value))}
            className="h-8 text-sm"
          />
        </div>
      </div>
      <div className="flex gap-2 pt-1">
        <Button size="sm" className="flex-1" onClick={() => onSave(form)}>
          <Check size={14} className="mr-1" /> Enregistrer
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="flex-1"
          onClick={onCancel}
        >
          <X size={14} className="mr-1" /> Annuler
        </Button>
      </div>
    </div>
  );
}

function ParcelleCard({
  parcelle,
  onEdit,
  onDelete,
}: {
  parcelle: Parcelle;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div
      className="rounded-2xl border border-white/10 overflow-hidden"
      style={glassCard}
    >
      {/* En-tête cliquable */}
      <button
        className="w-full flex items-center justify-between px-4 py-3 text-left"
        onClick={() => setOpen((prev) => !prev)}
      >
        <div className="flex items-center gap-3">
          <CircularLoss
            total={parcelle.nombrePieds}
            manquants={parcelle.piedsManquants}
          />
          <div>
            <p className="font-semibold text-foreground text-sm">
              {parcelle.nom}
            </p>
            <div className="flex items-center gap-2 mt-0.5">
              <Badge
                variant="secondary"
                className="text-[10px] px-2 py-0.5 rounded-full"
              >
                {parcelle.cepage}
              </Badge>
              <span className="text-[10px] text-muted-foreground">
                {parcelle.nombreAres} ares
              </span>
            </div>
          </div>
        </div>
        <ChevronDown
          size={16}
          className={`text-muted-foreground transition-transform duration-300 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {/* Contenu dépliable */}
      <div
        className={`transition-all duration-300 overflow-hidden ${open ? "max-h-96" : "max-h-0"}`}
      >
        <div className="px-4 pb-4 space-y-3 border-t border-white/10 pt-3">
          {/* Infos détaillées */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="space-y-1">
              <p className="text-muted-foreground">Année plantation</p>
              <p className="text-foreground font-medium">{parcelle.annee}</p>
            </div>
            <div className="space-y-1">
              <p className="text-muted-foreground">Réf. Cadastre</p>
              <p className="text-foreground font-medium">
                {parcelle.refCadastre}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-muted-foreground">Nombre de routes</p>
              <p className="text-foreground font-medium">
                {parcelle.nombreRoutes}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-muted-foreground">Surface</p>
              <p className="text-foreground font-medium">
                {parcelle.nombreAres} ares
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-muted-foreground">Pieds total</p>
              <p className="text-foreground font-medium">
                {parcelle.nombrePieds}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-muted-foreground">Pieds manquants</p>
              <p className="text-foreground font-medium">
                {parcelle.piedsManquants}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              className="flex-1 h-8 text-xs rounded-xl"
              onClick={onEdit}
            >
              <Pencil size={12} className="mr-1" /> Modifier
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="flex-1 h-8 text-xs rounded-xl text-rose-400 border-rose-500/30 hover:bg-rose-500/10"
              onClick={onDelete}
            >
              <Trash2 size={12} className="mr-1" /> Supprimer
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Parcelles() {
  const [parcelles, setParcelles] = useState<Parcelle[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "parcelles"), (snap) => {
      setParcelles(
        snap.docs.map((d) => ({ id: d.id, ...d.data() })) as Parcelle[],
      );
    });
    return () => unsub();
  }, []);

  const handleAdd = async (data: Omit<Parcelle, "id">) => {
    await addDoc(collection(db, "parcelles"), data);
    setShowAdd(false);
  };

  const handleEdit = async (id: string, data: Omit<Parcelle, "id">) => {
    await updateDoc(doc(db, "parcelles", id), { ...data });
    setEditingId(null);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Supprimer cette parcelle ?")) {
      await deleteDoc(doc(db, "parcelles", id));
    }
  };

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pt-2">
        <div>
          <h1 className="text-xl font-bold text-foreground">Parcelles</h1>
          <p className="text-muted-foreground text-sm">
            {parcelles.length} parcelle(s)
          </p>
        </div>
        <Button
          size="sm"
          onClick={() => {
            setShowAdd(true);
            setEditingId(null);
          }}
          className="rounded-xl text-white"
          style={{ background: "#e3c47d", color: "#8c3348" }}
        >
          <Plus size={16} />
        </Button>
      </div>

      {/* Formulaire ajout */}
      {showAdd && (
        <ParcelleForm
          initial={defaultForm}
          onSave={handleAdd}
          onCancel={() => setShowAdd(false)}
        />
      )}

      {/* Liste */}
      <div className="space-y-2">
        {parcelles.length === 0 && !showAdd && (
          <div
            className="rounded-2xl p-8 border border-white/10 flex flex-col items-center gap-2"
            style={glassCard}
          >
            <p className="text-muted-foreground text-sm">
              Aucune parcelle enregistrée
            </p>
            <p className="text-muted-foreground text-xs">
              Appuie sur "Ajouter" pour commencer
            </p>
          </div>
        )}

        {parcelles.map((parcelle) => (
          <div key={parcelle.id}>
            {editingId === parcelle.id ? (
              <ParcelleForm
                initial={parcelle}
                onSave={(data) => handleEdit(parcelle.id, data)}
                onCancel={() => setEditingId(null)}
              />
            ) : (
              <ParcelleCard
                parcelle={parcelle}
                onEdit={() => {
                  setEditingId(parcelle.id);
                  setShowAdd(false);
                }}
                onDelete={() => handleDelete(parcelle.id)}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
