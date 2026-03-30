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
import {
  Plus,
  ChevronDown,
  Pencil,
  Trash2,
  X,
  Check,
  FlaskConical,
  FileDown,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// ─── Types ────────────────────────────────────────────────────────────────────

interface PrelevementParcelle {
  parcelleId: string;
  nom: string;
  degres: number | "";
}

interface Prelevement {
  id: string;
  numero: number;
  date: string;
  parcelles: PrelevementParcelle[];
}

interface Vendange {
  id: string;
  annee: number;
  dateDebut: string;
  dateFin: string;
  appellation: string;
  nbCueilleurs: number;
  salaireCueilleurs: number;
  nbDebardeurs: number;
  salaireDebardeurs: number;
  note: string;
  prelevements: Prelevement[];
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const glassCardDark = {
  background: "rgba(255,255,255,0.10)",
  backdropFilter: "blur(16px)",
  WebkitBackdropFilter: "blur(16px)",
  border: "1px solid rgba(255,255,255,0.18)",
};

const glassCardLight = {
  background: "rgba(255,255,255,0.40)",
  backdropFilter: "blur(16px)",
  WebkitBackdropFilter: "blur(16px)",
  border: "1px solid rgba(0,0,0,0.10)",
  boxShadow: "0 2px 16px rgba(0,0,0,0.07)",
};

const glassModal = {
  background: "rgba(20,18,30,0.97)",
  backdropFilter: "blur(24px)",
  WebkitBackdropFilter: "blur(24px)",
  border: "1px solid rgba(255,255,255,0.15)",
  color: "#f0ece0",
};

// ─── Hook dark mode ───────────────────────────────────────────────────────────

function useDarkMode() {
  const [dark, setDark] = useState(() =>
    document.documentElement.classList.contains("dark"),
  );
  useEffect(() => {
    const obs = new MutationObserver(() =>
      setDark(document.documentElement.classList.contains("dark")),
    );
    obs.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => obs.disconnect();
  }, []);
  return dark;
}

// ─── Boutons réutilisables avec style uniforme ────────────────────────────────

function BtnPrimary({
  onClick,
  children,
  className = "",
}: {
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center justify-center gap-1 h-9 px-4 rounded-xl text-xs font-semibold transition-opacity hover:opacity-85 ${className}`}
      style={{ background: "#e3c47d", color: "#000a18" }}
    >
      {children}
    </button>
  );
}

function BtnSecondary({
  onClick,
  children,
  danger = false,
  className = "",
}: {
  onClick: () => void;
  children: React.ReactNode;
  danger?: boolean;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center justify-center gap-1 h-9 px-4 rounded-xl text-xs font-semibold border transition-opacity hover:opacity-80 ${className}`}
      style={
        danger
          ? {
              color: "#ef4444",
              borderColor: "rgba(239,68,68,0.35)",
              background: "rgba(239,68,68,0.06)",
            }
          : {
              color: "inherit",
              borderColor: "rgba(128,128,128,0.3)",
              background: "rgba(128,128,128,0.08)",
            }
      }
    >
      {children}
    </button>
  );
}

// ─── Calcul coût ──────────────────────────────────────────────────────────────

function calculerCout(v: Omit<Vendange, "id" | "prelevements">): number {
  if (!v.dateDebut || !v.dateFin) return 0;
  const d = new Date(v.dateDebut),
    f = new Date(v.dateFin);
  const jours = Math.max(
    1,
    Math.round((f.getTime() - d.getTime()) / 86400000) + 1,
  );
  return (
    (v.nbCueilleurs || 0) * (v.salaireCueilleurs || 0) * 8 * jours +
    (v.nbDebardeurs || 0) * (v.salaireDebardeurs || 0) * 8 * jours
  );
}

// ─── Formulaire ───────────────────────────────────────────────────────────────

const defaultVendange = {
  annee: new Date().getFullYear(),
  dateDebut: "",
  dateFin: "",
  appellation: "",
  nbCueilleurs: 0,
  salaireCueilleurs: 0,
  nbDebardeurs: 0,
  salaireDebardeurs: 0,
  note: "",
};

function VendangeForm({
  initial,
  onSave,
  onCancel,
}: {
  initial: typeof defaultVendange;
  onSave: (d: typeof defaultVendange) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState(initial);
  const set = (field: string, value: string | number) =>
    setForm((prev) => ({ ...prev, [field]: value }));
  const cout = calculerCout(form as Omit<Vendange, "id" | "prelevements">);
  const dark = useDarkMode();
  const cardStyle = dark ? glassCardDark : glassCardLight;

  // Couleur du coût : jaune en dark, foncé en light
  const coutColor = dark ? "#e3c47d" : "#7a5c10";

  return (
    <div
      className="rounded-2xl p-4 space-y-3"
      style={{ ...cardStyle, border: "1px solid rgba(227,196,125,0.4)" }}
    >
      <div className="grid grid-cols-2 gap-3">
        {[
          ["Année", "annee", "number", ""],
          ["Appellation (kg/ha)", "appellation", "text", "Ex: 9000 Kg/Ha"],
          ["Date début", "dateDebut", "date", ""],
          ["Date fin", "dateFin", "date", ""],
          ["Nb Cueilleurs", "nbCueilleurs", "number", ""],
          ["Salaire cueilleur (€/h)", "salaireCueilleurs", "number", ""],
          ["Nb Débardeurs", "nbDebardeurs", "number", ""],
          ["Salaire débardeur (€/h)", "salaireDebardeurs", "number", ""],
        ].map(([label, field, type, placeholder]) => (
          <div key={field} className="space-y-1">
            <Label className="text-xs">{label}</Label>
            <Input
              type={type}
              placeholder={placeholder}
              value={(form as Record<string, string | number>)[field]}
              onChange={(e) =>
                set(
                  field,
                  type === "number"
                    ? parseFloat(e.target.value) || 0
                    : e.target.value,
                )
              }
              className="h-8 text-sm"
            />
          </div>
        ))}
      </div>

      {/* Coût estimé */}
      <div
        className="rounded-xl px-3 py-2 flex items-center justify-between"
        style={{
          background: "rgba(227,196,125,0.12)",
          border: "1px solid rgba(227,196,125,0.35)",
        }}
      >
        <span className="text-xs text-muted-foreground">
          Coût estimé (salaires)
        </span>
        <span className="text-sm font-bold" style={{ color: coutColor }}>
          {cout.toFixed(2)} €
        </span>
      </div>

      {/* Notes */}
      <div className="space-y-1">
        <Label className="text-xs">Notes</Label>
        <textarea
          value={form.note}
          onChange={(e) => set("note", e.target.value)}
          placeholder="Observations, conditions météo..."
          rows={3}
          className="w-full rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 resize-none"
        />
      </div>

      {/* Boutons */}
      <div className="flex gap-2 pt-1">
        <BtnPrimary onClick={() => onSave(form)} className="flex-1">
          <Check size={14} /> Enregistrer
        </BtnPrimary>
        <BtnSecondary onClick={onCancel} className="flex-1">
          <X size={14} /> Annuler
        </BtnSecondary>
      </div>
    </div>
  );
}

// ─── Modal Prélèvements ───────────────────────────────────────────────────────

function PrelevementModal({
  vendangeId,
  vendangeAnnee,
  prelevements,
  parcelles,
  onClose,
}: {
  vendangeId: string;
  vendangeAnnee: number;
  prelevements: Prelevement[];
  parcelles: { id: string; nom: string }[];
  onClose: () => void;
}) {
  const [showForm, setShowForm] = useState(false);
  const [date, setDate] = useState("");
  const [degrees, setDegrees] = useState<Record<string, number | "">>({});

  const handleAdd = async () => {
    if (!date) return;
    const newPrel: Prelevement = {
      id: crypto.randomUUID(),
      numero: prelevements.length + 1,
      date,
      parcelles: parcelles.map((p) => ({
        parcelleId: p.id,
        nom: p.nom,
        degres: degrees[p.id] ?? "",
      })),
    };
    await updateDoc(doc(db, "vendanges", vendangeId), {
      prelevements: [...prelevements, newPrel],
    });
    setShowForm(false);
    setDate("");
    setDegrees({});
  };

  const handleDelete = async (prelId: string) => {
    if (!confirm("Supprimer ce prélèvement ?")) return;
    const updated = prelevements
      .filter((p) => p.id !== prelId)
      .map((p, i) => ({ ...p, numero: i + 1 }));
    await updateDoc(doc(db, "vendanges", vendangeId), {
      prelevements: updated,
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center p-4 pb-28"
      style={{ background: "rgba(0,0,0,0.7)" }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="w-full max-w-md rounded-2xl p-4 space-y-4 max-h-[78vh] overflow-y-auto"
        style={glassModal}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-sm" style={{ color: "#f0ece0" }}>
              Prélèvements {vendangeAnnee}
            </h2>
            <p className="text-xs" style={{ color: "rgba(240,236,224,0.55)" }}>
              {prelevements.length} prélèvement(s)
            </p>
          </div>
          <div className="flex gap-2 items-center">
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-1 h-7 px-3 rounded-xl text-xs font-semibold transition-opacity hover:opacity-85"
              style={{ background: "#e3c47d", color: "#000a18" }}
            >
              <Plus size={12} /> Ajouter
            </button>
            <button
              onClick={onClose}
              className="w-7 h-7 rounded-full flex items-center justify-center"
              style={{
                background: "rgba(255,255,255,0.12)",
                color: "rgba(240,236,224,0.8)",
              }}
            >
              <X size={14} />
            </button>
          </div>
        </div>

        {/* Formulaire ajout prélèvement */}
        {showForm && (
          <div
            className="rounded-xl p-3 space-y-3"
            style={{
              background: "rgba(255,255,255,0.07)",
              border: "1px solid rgba(227,196,125,0.3)",
            }}
          >
            <div className="space-y-1">
              <label
                className="text-xs"
                style={{ color: "rgba(240,236,224,0.6)" }}
              >
                Date du prélèvement
              </label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="h-8 text-sm bg-transparent border-white/20 text-white"
              />
            </div>
            <p
              className="text-xs font-medium"
              style={{ color: "rgba(240,236,224,0.6)" }}
            >
              Degrés par parcelle
            </p>
            <div className="space-y-2">
              {parcelles.map((p) => (
                <div key={p.id} className="flex items-center gap-2">
                  <span
                    className="text-xs flex-1 truncate"
                    style={{ color: "#f0ece0" }}
                  >
                    {p.nom}
                  </span>
                  <Input
                    type="number"
                    step="0.1"
                    placeholder="°"
                    value={degrees[p.id] ?? ""}
                    onChange={(e) =>
                      setDegrees((prev) => ({
                        ...prev,
                        [p.id]:
                          e.target.value === ""
                            ? ""
                            : parseFloat(e.target.value),
                      }))
                    }
                    className="h-7 w-20 text-sm text-center bg-transparent border-white/20 text-white"
                  />
                  <span
                    className="text-xs"
                    style={{ color: "rgba(240,236,224,0.5)" }}
                  >
                    °
                  </span>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleAdd}
                className="flex-1 flex items-center justify-center gap-1 h-8 rounded-xl text-xs font-semibold transition-opacity hover:opacity-85"
                style={{ background: "#e3c47d", color: "#000a18" }}
              >
                <Check size={12} /> Enregistrer
              </button>
              <button
                onClick={() => {
                  setShowForm(false);
                  setDate("");
                  setDegrees({});
                }}
                className="flex-1 flex items-center justify-center gap-1 h-8 rounded-xl text-xs font-semibold border transition-opacity hover:opacity-80"
                style={{
                  color: "rgba(240,236,224,0.8)",
                  borderColor: "rgba(255,255,255,0.2)",
                  background: "rgba(255,255,255,0.07)",
                }}
              >
                <X size={12} /> Annuler
              </button>
            </div>
          </div>
        )}

        {/* Vide */}
        {prelevements.length === 0 && !showForm && (
          <p
            className="text-center text-sm py-6"
            style={{ color: "rgba(240,236,224,0.4)" }}
          >
            Aucun prélèvement enregistré
          </p>
        )}

        {/* Liste */}
        {[...prelevements]
          .sort((a, b) => a.numero - b.numero)
          .map((prel) => (
            <div
              key={prel.id}
              className="rounded-xl p-3 space-y-2"
              style={{
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.1)",
              }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <span
                    className="text-xs font-semibold"
                    style={{ color: "#f0ece0" }}
                  >
                    Prélèvement n°{prel.numero}
                  </span>
                  <span
                    className="text-xs ml-2"
                    style={{ color: "rgba(240,236,224,0.5)" }}
                  >
                    {new Date(prel.date).toLocaleDateString("fr-FR")}
                  </span>
                </div>
                <button
                  onClick={() => handleDelete(prel.id)}
                  className="p-1"
                  style={{ color: "#f87171" }}
                >
                  <Trash2 size={13} />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-1">
                {prel.parcelles
                  .filter((p) => p.degres !== "")
                  .map((p) => (
                    <div
                      key={p.parcelleId}
                      className="flex items-center justify-between rounded-lg px-2 py-1"
                      style={{ background: "rgba(227,196,125,0.12)" }}
                    >
                      <span
                        className="text-[10px] truncate max-w-[80px]"
                        style={{ color: "rgba(240,236,224,0.7)" }}
                      >
                        {p.nom}
                      </span>
                      <span
                        className="text-[10px] font-bold"
                        style={{ color: "#e3c47d" }}
                      >
                        {p.degres}°
                      </span>
                    </div>
                  ))}
                {prel.parcelles.every((p) => p.degres === "") && (
                  <span
                    className="text-[10px] col-span-2"
                    style={{ color: "rgba(240,236,224,0.4)" }}
                  >
                    Aucun degré saisi
                  </span>
                )}
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}
// ─── Export PDF ───────────────────────────────────────────────────────────────

function exportPDF(vendange: Vendange) {
  const fmt = (d: string) =>
    d ? new Date(d).toLocaleDateString("fr-FR") : "—";

  let nbJours = 0;
  if (vendange.dateDebut && vendange.dateFin) {
    const d = new Date(vendange.dateDebut),
      f = new Date(vendange.dateFin);
    nbJours = Math.max(
      1,
      Math.round((f.getTime() - d.getTime()) / 86400000) + 1,
    );
  }

  const cout =
    (vendange.nbCueilleurs || 0) *
      (vendange.salaireCueilleurs || 0) *
      8 *
      nbJours +
    (vendange.nbDebardeurs || 0) *
      (vendange.salaireDebardeurs || 0) *
      8 *
      nbJours;

  const prelevementsHTML =
    vendange.prelevements && vendange.prelevements.length > 0
      ? vendange.prelevements
          .sort((a, b) => a.numero - b.numero)
          .map((p) => {
            const parcelles = p.parcelles
              .filter((pp) => pp.degres !== "")
              .map(
                (pp) =>
                  `<span class="prel-item"><span class="prel-nom">${pp.nom}</span><span class="prel-deg">${pp.degres}°</span></span>`,
              )
              .join("");
            return `
              <div class="prel-card">
                <div class="prel-header">
                  <strong>Prélèvement n°${p.numero}</strong>
                  <span class="prel-date">${fmt(p.date)}</span>
                </div>
                <div class="prel-grid">${parcelles || '<span class="empty">Aucun degré saisi</span>'}</div>
              </div>`;
          })
          .join("")
      : '<p class="empty">Aucun prélèvement enregistré</p>';

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <title>Vendange ${vendange.annee}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;900&display=swap');

    * { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: 'Inter', sans-serif;
      background: #fff;
      color: #111;
      padding: 40px;
      max-width: 720px;
      margin: 0 auto;
    }

    /* ── En-tête ── */
    .header {
      display: flex;
      align-items: flex-end;
      justify-content: space-between;
      border-bottom: 3px solid #e3c47d;
      padding-bottom: 16px;
      margin-bottom: 28px;
    }
    .header-left h1 {
      font-size: 56px;
      font-weight: 900;
      color: #e3c47d;
      line-height: 1;
      letter-spacing: -2px;
    }
    .header-left p {
      font-size: 13px;
      color: #888;
      margin-top: 4px;
    }
    .header-right {
      text-align: right;
    }
    .header-right .cout {
      font-size: 22px;
      font-weight: 700;
      color: #7a5c10;
    }
    .header-right .cout-label {
      font-size: 11px;
      color: #aaa;
      margin-top: 2px;
    }

    /* ── Sections ── */
    .section-title {
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #aaa;
      margin-bottom: 10px;
      margin-top: 24px;
    }

    /* ── Grille infos ── */
    .info-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 12px;
    }
    .info-box {
      background: #f9f7f2;
      border: 1px solid #ede8d8;
      border-radius: 10px;
      padding: 10px 14px;
    }
    .info-box .label {
      font-size: 10px;
      color: #aaa;
      margin-bottom: 3px;
    }
    .info-box .value {
      font-size: 14px;
      font-weight: 600;
      color: #111;
    }

    /* ── Coût bloc ── */
    .cout-bloc {
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: #fdf8ec;
      border: 1px solid #e3c47d;
      border-radius: 10px;
      padding: 12px 18px;
      margin-top: 16px;
    }
    .cout-bloc .label { font-size: 12px; color: #999; }
    .cout-bloc .montant { font-size: 20px; font-weight: 700; color: #7a5c10; }

    /* ── Note ── */
    .note-box {
      background: #f9f7f2;
      border: 1px solid #ede8d8;
      border-radius: 10px;
      padding: 12px 16px;
      font-size: 13px;
      color: #444;
      line-height: 1.6;
      margin-top: 8px;
    }

    /* ── Prélèvements ── */
    .prel-card {
      border: 1px solid #e8e3d6;
      border-radius: 10px;
      padding: 12px 14px;
      margin-bottom: 8px;
      break-inside: avoid;
    }
    .prel-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 8px;
    }
    .prel-header strong { font-size: 13px; color: #222; }
    .prel-date { font-size: 11px; color: #aaa; }
    .prel-grid {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }
    .prel-item {
      display: flex;
      align-items: center;
      gap: 6px;
      background: #fdf8ec;
      border: 1px solid #e3c47d55;
      border-radius: 6px;
      padding: 3px 8px;
    }
    .prel-nom { font-size: 11px; color: #555; }
    .prel-deg { font-size: 12px; font-weight: 700; color: #7a5c10; }
    .empty { font-size: 12px; color: #ccc; }

    /* ── Pied de page ── */
    .footer {
      margin-top: 40px;
      padding-top: 14px;
      border-top: 1px solid #eee;
      font-size: 10px;
      color: #ccc;
      display: flex;
      justify-content: space-between;
    }

    @media print {
      body { padding: 24px; }
      @page { margin: 1.5cm; }
    }
  </style>
</head>
<body>

  <div class="header">
    <div class="header-left">
      <h1>${vendange.annee}</h1>
      <p>Récapitulatif de vendange · généré le ${new Date().toLocaleDateString("fr-FR")}</p>
    </div>
    <div class="header-right">
      <div class="cout">${cout.toFixed(2)} €</div>
      <div class="cout-label">coût total salaires</div>
    </div>
  </div>

  <div class="section-title">Informations générales</div>
  <div class="info-grid">
    <div class="info-box">
      <div class="label">Date début</div>
      <div class="value">${fmt(vendange.dateDebut)}</div>
    </div>
    <div class="info-box">
      <div class="label">Date fin</div>
      <div class="value">${fmt(vendange.dateFin)}</div>
    </div>
    <div class="info-box">
      <div class="label">Durée</div>
      <div class="value">${nbJours > 0 ? nbJours + " jour(s)" : "—"}</div>
    </div>
    <div class="info-box">
      <div class="label">Appellation</div>
      <div class="value">${vendange.appellation || "—"}</div>
    </div>
    <div class="info-box">
      <div class="label">Cueilleurs</div>
      <div class="value">${vendange.nbCueilleurs} × ${vendange.salaireCueilleurs} €/h</div>
    </div>
    <div class="info-box">
      <div class="label">Débardeurs</div>
      <div class="value">${vendange.nbDebardeurs} × ${vendange.salaireDebardeurs} €/h</div>
    </div>
  </div>

  <div class="cout-bloc">
    <span class="label">Coût total salaires (${nbJours}j × 8h)</span>
    <span class="montant">${cout.toFixed(2)} €</span>
  </div>

  ${
    vendange.note
      ? `<div class="section-title">Notes</div>
         <div class="note-box">${vendange.note}</div>`
      : ""
  }

  <div class="section-title">Prélèvements (${vendange.prelevements?.length || 0})</div>
  ${prelevementsHTML}

  <div class="footer">
    <span>VigneApp · Vendange ${vendange.annee}</span>
    <span>Exporté le ${new Date().toLocaleDateString("fr-FR")} à ${new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}</span>
  </div>

</body>
</html>`;

  const win = window.open("", "_blank");
  if (!win) return;
  win.document.write(html);
  win.document.close();
  win.focus();
  setTimeout(() => win.print(), 600);
}
// ─── Carte Vendange ───────────────────────────────────────────────────────────

function VendangeCard({
  vendange,
  parcelles,
  onEdit,
  onDelete,
}: {
  vendange: Vendange;
  parcelles: { id: string; nom: string }[];
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [showPrelevements, setShowPrelevements] = useState(false);
  const dark = useDarkMode();
  const cardStyle = dark ? glassCardDark : glassCardLight;

  const cout = calculerCout(vendange);
  const debut = vendange.dateDebut
    ? new Date(vendange.dateDebut).toLocaleDateString("fr-FR")
    : "—";
  const fin = vendange.dateFin
    ? new Date(vendange.dateFin).toLocaleDateString("fr-FR")
    : "—";
  let nbJours = 0;
  if (vendange.dateDebut && vendange.dateFin) {
    const d = new Date(vendange.dateDebut),
      f = new Date(vendange.dateFin);
    nbJours = Math.max(
      1,
      Math.round((f.getTime() - d.getTime()) / 86400000) + 1,
    );
  }

  // Couleurs adaptées au thème
  const accentColor = dark ? "#e3c47d" : "#7a5c10"; // jaune en dark, brun foncé en light
  const mutedColor = dark ? "rgba(255,255,255,0.45)" : "rgba(0,10,24,0.45)";
  const textColor = dark ? "rgba(255,255,255,0.9)" : "#000a18";

  return (
    <>
      <div className="rounded-2xl overflow-hidden" style={cardStyle}>
        {/* ── FERMÉ ── */}
        {!open && (
          <button
            className="w-full flex items-center justify-between px-5 py-5"
            onClick={() => setOpen(true)}
          >
            <div className="flex-1 flex flex-col items-center">
              <span
                className="text-5xl font-black tracking-tight leading-none"
                style={{
                  color: dark ? "rgba(255,255,255,0.18)" : "rgba(0,10,24,0.18)",
                }}
              >
                {vendange.annee}
              </span>
            </div>
            <ChevronDown
              size={16}
              style={{ color: mutedColor, flexShrink: 0 }}
            />
          </button>
        )}

        {/* ── OUVERT ── */}
        {open && (
          <div>
            {/* Header ouvert */}
            <button
              className="w-full flex items-center justify-between px-4 py-3"
              onClick={() => setOpen(false)}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{
                    background: "rgba(227,196,125,0.15)",
                    border: "1px solid rgba(227,196,125,0.3)",
                  }}
                >
                  <span
                    className="text-lg font-bold leading-none"
                    style={{ color: accentColor }}
                  >
                    {vendange.annee}
                  </span>
                </div>
                <div className="text-left">
                  <p className="text-[10px]" style={{ color: mutedColor }}>
                    {debut} → {fin}
                    {nbJours > 0 && ` · ${nbJours}j`}
                  </p>
                  {/* Coût en header : foncé en light, doré en dark */}
                  <p
                    className="text-[10px] font-semibold mt-0.5"
                    style={{ color: accentColor }}
                  >
                    {cout.toFixed(2)} €
                  </p>
                </div>
              </div>
              <ChevronDown
                size={16}
                className="rotate-180"
                style={{ color: mutedColor }}
              />
            </button>

            {/* Séparateur */}
            <div
              style={{
                borderTop: dark
                  ? "1px solid rgba(255,255,255,0.1)"
                  : "1px solid rgba(0,0,0,0.07)",
              }}
            />

            {/* Contenu */}
            <div className="px-4 pb-4 pt-3 space-y-3">
              {/* Infos */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                {[
                  ["Appellation", vendange.appellation || "—"],
                  ["Durée", nbJours > 0 ? `${nbJours} jour(s)` : "—"],
                  [
                    "Cueilleurs",
                    `${vendange.nbCueilleurs} × ${vendange.salaireCueilleurs} €/h`,
                  ],
                  [
                    "Débardeurs",
                    `${vendange.nbDebardeurs} × ${vendange.salaireDebardeurs} €/h`,
                  ],
                ].map(([label, value]) => (
                  <div key={label} className="space-y-0.5">
                    <p style={{ color: mutedColor }}>{label}</p>
                    <p className="font-medium" style={{ color: textColor }}>
                      {value}
                    </p>
                  </div>
                ))}
              </div>

              {/* Coût total */}
              <div
                className="rounded-xl px-3 py-2 flex items-center justify-between"
                style={{
                  background: "rgba(227,196,125,0.10)",
                  border: "1px solid rgba(227,196,125,0.30)",
                }}
              >
                <span className="text-xs" style={{ color: mutedColor }}>
                  Coût total salaires
                </span>
                <span
                  className="text-sm font-bold"
                  style={{ color: accentColor }}
                >
                  {cout.toFixed(2)} €
                </span>
              </div>

              {/* Note */}
              {vendange.note && (
                <div
                  className="rounded-xl px-3 py-2 space-y-1"
                  style={{
                    background: dark
                      ? "rgba(255,255,255,0.05)"
                      : "rgba(0,0,0,0.04)",
                    border: dark
                      ? "1px solid rgba(255,255,255,0.08)"
                      : "1px solid rgba(0,0,0,0.07)",
                  }}
                >
                  <p className="text-[10px]" style={{ color: mutedColor }}>
                    Notes
                  </p>
                  <p className="text-xs" style={{ color: textColor }}>
                    {vendange.note}
                  </p>
                </div>
              )}

              {/* Bouton Prélèvements */}
              <button
                onClick={() => setShowPrelevements(true)}
                className="w-full flex items-center justify-between rounded-xl px-3 py-2 transition-opacity hover:opacity-80"
                style={{
                  background: dark
                    ? "rgba(255,255,255,0.05)"
                    : "rgba(0,0,0,0.04)",
                  border: dark
                    ? "1px solid rgba(255,255,255,0.08)"
                    : "1px solid rgba(0,0,0,0.08)",
                }}
              >
                <div className="flex items-center gap-2">
                  <FlaskConical size={14} style={{ color: mutedColor }} />
                  <span className="text-xs" style={{ color: textColor }}>
                    Prélèvements
                  </span>
                </div>
                <span
                  className="text-[10px] px-2 py-0.5 rounded-full"
                  style={{
                    background: "rgba(227,196,125,0.2)",
                    color: accentColor,
                  }}
                >
                  {vendange.prelevements?.length || 0}
                </span>
              </button>

              {/* Actions */}
              {/* Actions */}
              <div className="flex gap-2">
                <BtnSecondary onClick={onEdit} className="flex-1">
                  <Pencil size={12} /> Modifier
                </BtnSecondary>
                <BtnSecondary onClick={onDelete} danger className="flex-1">
                  <Trash2 size={12} /> Supprimer
                </BtnSecondary>
              </div>

              {/* Export PDF */}
              <button
                onClick={() => exportPDF(vendange)}
                className="w-full flex items-center justify-center gap-2 h-9 rounded-xl text-xs font-semibold transition-opacity hover:opacity-80"
                style={{
                  background: dark
                    ? "rgba(227,196,125,0.12)"
                    : "rgba(122,92,16,0.08)",
                  border: `1px solid ${dark ? "rgba(227,196,125,0.35)" : "rgba(122,92,16,0.25)"}`,
                  color: dark ? "#e3c47d" : "#7a5c10",
                }}
              >
                <FileDown size={14} />
                Exporter en PDF
              </button>
            </div>
          </div>
        )}
      </div>

      {showPrelevements && (
        <PrelevementModal
          vendangeId={vendange.id}
          vendangeAnnee={vendange.annee}
          prelevements={vendange.prelevements || []}
          parcelles={parcelles}
          onClose={() => setShowPrelevements(false)}
        />
      )}
    </>
  );
}

// ─── Page principale ──────────────────────────────────────────────────────────

export default function Vendanges() {
  const [vendanges, setVendanges] = useState<Vendange[]>([]);
  const [parcelles, setParcelles] = useState<{ id: string; nom: string }[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    const unsubV = onSnapshot(collection(db, "vendanges"), (snap) =>
      setVendanges(
        snap.docs.map((d) => ({ id: d.id, ...d.data() })) as Vendange[],
      ),
    );
    const unsubP = onSnapshot(collection(db, "parcelles"), (snap) =>
      setParcelles(
        snap.docs.map((d) => ({
          id: d.id,
          nom: (d.data() as { nom: string }).nom,
        })),
      ),
    );
    return () => {
      unsubV();
      unsubP();
    };
  }, []);

  const handleAdd = async (data: typeof defaultVendange) => {
    await addDoc(collection(db, "vendanges"), { ...data, prelevements: [] });
    setShowAdd(false);
  };

  const handleEdit = async (id: string, data: typeof defaultVendange) => {
    await updateDoc(doc(db, "vendanges", id), { ...data });
    setEditingId(null);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Supprimer cette vendange ?"))
      await deleteDoc(doc(db, "vendanges", id));
  };

  const dark = useDarkMode();
  const sorted = [...vendanges].sort((a, b) => b.annee - a.annee);

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pt-2">
        <div>
          <h1 className="text-xl font-bold text-foreground">Vendanges</h1>
          <p className="text-muted-foreground text-sm">
            {vendanges.length} année(s)
          </p>
        </div>
        <button
          onClick={() => {
            setShowAdd(true);
            setEditingId(null);
          }}
          className="w-10 h-10 rounded-full flex items-center justify-center shadow-md transition-opacity hover:opacity-80"
          style={{ background: "#e3c47d", color: "#000a18" }}
        >
          <Plus size={20} strokeWidth={2.5} />
        </button>
      </div>

      {/* Formulaire ajout */}
      {showAdd && (
        <VendangeForm
          initial={defaultVendange}
          onSave={handleAdd}
          onCancel={() => setShowAdd(false)}
        />
      )}

      {/* Liste */}
      <div className="space-y-2">
        {sorted.length === 0 && !showAdd && (
          <div
            className="rounded-2xl p-8 flex flex-col items-center gap-2"
            style={dark ? glassCardDark : glassCardLight}
          >
            <p className="text-muted-foreground text-sm">
              Aucune vendange enregistrée
            </p>
            <p className="text-muted-foreground text-xs">
              Appuie sur + pour commencer
            </p>
          </div>
        )}

        {sorted.map((v) => (
          <div key={v.id}>
            {editingId === v.id ? (
              <VendangeForm
                initial={v}
                onSave={(data) => handleEdit(v.id, data)}
                onCancel={() => setEditingId(null)}
              />
            ) : (
              <VendangeCard
                vendange={v}
                parcelles={parcelles}
                onEdit={() => {
                  setEditingId(v.id);
                  setShowAdd(false);
                }}
                onDelete={() => handleDelete(v.id)}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
