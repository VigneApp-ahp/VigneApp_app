import { useEffect, useState, useRef } from "react";
import {
  collection,
  onSnapshot,
  addDoc,
  // updateDoc,
  deleteDoc,
  doc,
  setDoc,
  // getDoc,
} from "firebase/firestore";
import { db } from "@/config/firebase";
import {
  Plus,
  // Pencil,
  Trash2,
  X,
  Check,
  // FileText,
  Upload,
  ChevronDown,
  Receipt,
  ExternalLink,
} from "lucide-react";
import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";

// ─── Cloudinary ───────────────────────────────────────────────────────────────

const CLOUD_NAME = "dmj4wyxcw";
const UPLOAD_PRESET = "vigneapp_uploads";

async function uploadToCloudinary(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", UPLOAD_PRESET);
  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`,
    { method: "POST", body: formData },
  );
  const data = await res.json();
  if (!data.secure_url) throw new Error("Upload échoué");
  return data.secure_url;
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface DonneeBancaire {
  id: string; // "bryan" | "william" | "jordan"
  prenom: string;
  numeroCompte: string;
  bic: string;
  iban: string;
  ribUrl: string; // URL Cloudinary
}

interface Depense {
  id: string;
  nom: string;
  sujet: string;
  prix: number;
  factureUrl: string;
}

interface AnneeCompta {
  id: string; // l'année en string ex: "2025"
  annee: number;
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const glassCardDark = {
  background: "rgba(255,255,255,0.10)",
  backdropFilter: "blur(16px)",
  WebkitBackdropFilter: "blur(16px)",
  border: "1px solid rgba(255,255,255,0.18)",
};

const glassCardLight = {
  background: "rgba(255,255,255,0.10)",
  backdropFilter: "blur(16px)",
  WebkitBackdropFilter: "blur(16px)",
  border: "1px solid rgba(0,0,0,0.10)",
  boxShadow: "0 2px 16px rgba(0,0,0,0.07)",
};

const glassModal = {
  background: "rgba(20,18,30,0.10)",
  backdropFilter: "blur(24px)",
  WebkitBackdropFilter: "blur(24px)",
  border: "1px solid rgba(255,255,255,0.15)",
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

// ─── Tableau Données Bancaires ────────────────────────────────────────────────

const MEMBRES = ["bryan", "william", "jordan"];
const PRENOMS: Record<string, string> = {
  bryan: "Bryan",
  william: "William",
  jordan: "Jordan",
};

function CartesBancaires({ dark }: { dark: boolean }) {
  const cardStyle = dark ? glassCardDark : glassCardLight;
  const [donnees, setDonnees] = useState<Record<string, DonneeBancaire>>({});
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const darkText = dark ? "#e3c47d" : "#000a18";
  const ribColor = dark ? "rgba(227,196,125,0.6)" : "rgba(0,10,24,0.5)";
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "bancaire"), (snap) => {
      const map: Record<string, DonneeBancaire> = {};
      snap.docs.forEach((d) => {
        map[d.id] = { id: d.id, ...d.data() } as DonneeBancaire;
      });
      setDonnees(map);
    });
    return () => unsub();
  }, []);

  return (
    <div className="space-y-3">
      {MEMBRES.map((id) => (
        <button
          key={id}
          onClick={() => setSelectedId(id)}
          className="w-full p-4 rounded-2xl text-left transition hover:opacity-85"
          style={{
            ...cardStyle,
            border: dark
              ? "1px solid rgba(255,255,255,0.15)"
              : "1px solid rgba(0,0,0,0.08)",
            background: dark
              ? "rgba(255,255,255,0.08)"
              : "rgba(255,255,255,0.20)",
          }}
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold" style={{ color: darkText }}>
              {PRENOMS[id]}
            </span>

            <span className="text-xs font-medium" style={{ color: ribColor }}>
              RIB
            </span>
          </div>
        </button>
      ))}

      {selectedId && (
        <RibModal
          id={selectedId}
          data={donnees[selectedId]}
          onClose={() => setSelectedId(null)}
        />
      )}
    </div>
  );
}

function RibModal({
  id,
  data,
  onClose,
}: {
  id: string;
  data?: DonneeBancaire;
  onClose: () => void;
}) {
  const [form, setForm] = useState({
    prenom: data?.prenom || PRENOMS[id],
    numeroCompte: data?.numeroCompte || "",
    bic: data?.bic || "",
    iban: data?.iban || "",
    ribUrl: data?.ribUrl || "",
  });

  const dark = document.documentElement.classList.contains("dark");
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const textColor = dark ? "#f0ece0" : "#000a18";
  const copyToClipboard = async (text: string) => {
    if (!text) return;
    await navigator.clipboard.writeText(text);
    alert("Copié !");
  };

  const handleSave = async () => {
    await setDoc(doc(db, "bancaire", id), form);
    onClose();
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const url = await uploadToCloudinary(file);
      setForm((p) => ({ ...p, ribUrl: url }));
    } finally {
      setUploading(false);
    }
  };

  function Field({
    label,
    value,
    onChange,
  }: {
    label: string;
    value: string;
    onChange: (v: string) => void;
  }) {
    return (
      <div className="flex flex-col gap-1">
        <span className="text-xs opacity-70">{label}</span>

        <div className="flex items-center gap-2">
          <Input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="h-10"
          />

          <button
            onClick={() => copyToClipboard(value)}
            className="px-2 h-10 rounded-lg border text-xs hover:opacity-80"
          >
            Copier
          </button>
        </div>
      </div>
    );
  }
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center p-4 pb-24"
      style={{ background: "rgba(0,0,0,0.7)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full max-w-md rounded-2xl p-5 space-y-5"
        style={
          dark
            ? glassModal
            : {
                background: "rgba(255,255,255,0.85)",
                backdropFilter: "blur(20px)",
                WebkitBackdropFilter: "blur(20px)",
                border: "1px solid rgba(0,0,0,0.08)",
                boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
              }
        }
      >
        <div className="flex justify-between items-center">
          <h2 className="text-base font-semibold" style={{ color: textColor }}>
            {PRENOMS[id]} RIB
          </h2>
          <button onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <div className="space-y-4">
          <Field
            label="Prénom / Nom"
            value={form.prenom}
            onChange={(v) => setForm((p) => ({ ...p, prenom: v }))}
          />

          <Field
            label="N° de compte"
            value={form.numeroCompte}
            onChange={(v) => setForm((p) => ({ ...p, numeroCompte: v }))}
          />

          <Field
            label="BIC"
            value={form.bic}
            onChange={(v) => setForm((p) => ({ ...p, bic: v }))}
          />

          <Field
            label="IBAN"
            value={form.iban}
            onChange={(v) => setForm((p) => ({ ...p, iban: v }))}
          />
        </div>

        <div className="flex items-center gap-2">
          <input
            ref={fileRef}
            type="file"
            className="hidden"
            onChange={handleUpload}
          />

          <button
            onClick={() => fileRef.current?.click()}
            className="text-xs px-3 py-2 rounded-lg border"
          >
            {uploading ? "Upload..." : "Importer RIB"}
          </button>

          {form.ribUrl && (
            <a href={form.ribUrl} target="_blank">
              Voir
            </a>
          )}
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleSave}
            className="flex-1 bg-[#e3c47d] text-black rounded-xl h-9"
          >
            Enregistrer
          </button>

          <button onClick={onClose} className="flex-1 border rounded-xl h-9">
            Annuler
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Modal Dépense ────────────────────────────────────────────────────────────

function DepenseModal({
  annee,
  onClose,
  onSaved,
}: {
  annee: number;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({ nom: "", sujet: "", prix: "" });
  const [factureUrl, setFactureUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFactureUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadToCloudinary(file);
      setFactureUrl(url);
    } catch {
      alert("Erreur lors de l'upload de la facture");
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!form.nom || !form.sujet || !form.prix) return;
    setSaving(true);
    try {
      await addDoc(collection(db, `compta_${annee}`), {
        nom: form.nom,
        sujet: form.sujet,
        prix: parseFloat(form.prix) || 0,
        factureUrl,
        createdAt: Date.now(),
      });
      onSaved();
      onClose();
    } finally {
      setSaving(false);
    }
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
        className="w-full max-w-md rounded-2xl p-4 space-y-4"
        style={glassModal}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-sm" style={{ color: "#f0ece0" }}>
              Ajouter une dépense
            </h2>
            <p className="text-xs" style={{ color: "rgba(240,236,224,0.5)" }}>
              Année {annee}
            </p>
          </div>
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

        {/* Champs */}
        <div className="space-y-3">
          <div className="space-y-1">
            <label
              className="text-xs"
              style={{ color: "rgba(240,236,224,0.6)" }}
            >
              Nom
            </label>
            <Input
              placeholder="Ex: Bryan"
              value={form.nom}
              onChange={(e) => setForm((p) => ({ ...p, nom: e.target.value }))}
              className="h-8 text-sm bg-transparent border-white/20 text-white placeholder:text-white/30"
            />
          </div>
          <div className="space-y-1">
            <label
              className="text-xs"
              style={{ color: "rgba(240,236,224,0.6)" }}
            >
              Sujet
            </label>
            <Input
              placeholder="Ex: Pelote à lier"
              value={form.sujet}
              onChange={(e) =>
                setForm((p) => ({ ...p, sujet: e.target.value }))
              }
              className="h-8 text-sm bg-transparent border-white/20 text-white placeholder:text-white/30"
            />
          </div>
          <div className="space-y-1">
            <label
              className="text-xs"
              style={{ color: "rgba(240,236,224,0.6)" }}
            >
              Prix (€)
            </label>
            <Input
              type="number"
              step="0.01"
              placeholder="0.00"
              value={form.prix}
              onChange={(e) => setForm((p) => ({ ...p, prix: e.target.value }))}
              className="h-8 text-sm bg-transparent border-white/20 text-white placeholder:text-white/30"
            />
          </div>

          {/* Import facture */}
          <div className="space-y-1">
            <label
              className="text-xs"
              style={{ color: "rgba(240,236,224,0.6)" }}
            >
              Facture (optionnel)
            </label>
            <input
              ref={fileRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              className="hidden"
              onChange={handleFactureUpload}
            />
            <div className="flex items-center gap-2">
              <button
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="flex items-center gap-1 h-8 px-3 rounded-xl text-xs font-medium border transition-opacity hover:opacity-80 disabled:opacity-40"
                style={{
                  borderColor: "rgba(255,255,255,0.2)",
                  color: "rgba(240,236,224,0.7)",
                  background: "rgba(255,255,255,0.07)",
                }}
              >
                <Upload size={12} />
                {uploading ? "Upload en cours..." : "Importer une facture"}
              </button>
              {factureUrl && (
                <a
                  href={factureUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[10px] flex items-center gap-1"
                  style={{ color: "#e3c47d" }}
                >
                  <ExternalLink size={10} /> Voir
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Boutons */}
        <div className="flex gap-2 pt-1">
          <button
            onClick={handleSave}
            disabled={saving || !form.nom || !form.sujet || !form.prix}
            className="flex-1 flex items-center justify-center gap-1 h-9 rounded-xl text-xs font-semibold transition-opacity hover:opacity-85 disabled:opacity-40"
            style={{ background: "#e3c47d", color: "#000a18" }}
          >
            <Check size={13} />
            {saving ? "Enregistrement..." : "Enregistrer"}
          </button>
          <button
            onClick={onClose}
            className="flex-1 flex items-center justify-center gap-1 h-9 rounded-xl text-xs font-semibold border transition-opacity hover:opacity-80"
            style={{
              borderColor: "rgba(255,255,255,0.2)",
              color: "rgba(240,236,224,0.8)",
              background: "rgba(255,255,255,0.07)",
            }}
          >
            <X size={13} /> Annuler
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Section Comptabilité ─────────────────────────────────────────────────────

function SectionCompta({ dark }: { dark: boolean }) {
  const cardStyle = dark ? glassCardDark : glassCardLight;
  const mutedColor = dark ? "rgba(255,255,255,0.45)" : "rgba(0,10,24,0.45)";
  const textColor = dark ? "rgba(255,255,255,0.9)" : "#000a18";
  const borderColor = dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.07)";
  const accentColor = dark ? "#e3c47d" : "#7a5c10";

  const [annees, setAnnees] = useState<AnneeCompta[]>([]);
  const [anneeSelectionnee, setAnneeSelectionnee] = useState<number | null>(
    null,
  );
  const [depenses, setDepenses] = useState<Depense[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  // Charger les années
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "compta_annees"), (snap) => {
      const list = snap.docs
        .map((d) => ({ id: d.id, annee: d.data().annee as number }))
        .sort((a, b) => b.annee - a.annee);
      setAnnees(list);
      // Sélectionner automatiquement la plus récente
      if (list.length > 0 && anneeSelectionnee === null) {
        setAnneeSelectionnee(list[0].annee);
      }
    });
    return () => unsub();
  }, []);

  // Charger les dépenses de l'année sélectionnée
  useEffect(() => {
    if (!anneeSelectionnee) return;
    const unsub = onSnapshot(
      collection(db, `compta_${anneeSelectionnee}`),
      (snap) => {
        setDepenses(
          snap.docs.map((d) => ({ id: d.id, ...d.data() })) as Depense[],
        );
      },
    );
    return () => unsub();
  }, [anneeSelectionnee]);

  const handleAjouterAnnee = async () => {
    const anneeStr = prompt("Quelle année ajouter ?");
    if (!anneeStr) return;
    const annee = parseInt(anneeStr);
    if (isNaN(annee) || annee < 1900 || annee > 2100) {
      alert("Année invalide");
      return;
    }
    await setDoc(doc(db, "compta_annees", String(annee)), { annee });
    setAnneeSelectionnee(annee);
  };

  const handleDeleteDepense = async (depenseId: string) => {
    if (!anneeSelectionnee) return;
    if (!confirm("Supprimer cette dépense ?")) return;
    await deleteDoc(doc(db, `compta_${anneeSelectionnee}`, depenseId));
  };

  const total = depenses.reduce((s, d) => s + (d.prix || 0), 0);
  const parTrois = total / 3;

  return (
    <div className="space-y-3">
      {/* Header section */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Receipt size={15} style={{ color: "#e3c47d" }} />
          <h2 className="font-semibold text-sm" style={{ color: textColor }}>
            Comptabilité
          </h2>
        </div>
      </div>

      {/* Sélecteur d'année + bouton + */}
      <div className="flex items-center gap-2">
        {/* Dropdown années */}
        <div className="relative flex-1">
          <button
            onClick={() => setShowDropdown((p) => !p)}
            className="w-full flex items-center justify-between px-3 h-9 rounded-xl text-sm border transition-opacity hover:opacity-80"
            style={{
              borderColor: dark ? "rgba(255,255,255,0.18)" : "rgba(0,0,0,0.12)",
              background: dark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.04)",
              color: textColor,
            }}
          >
            <span>
              {anneeSelectionnee
                ? `Année ${anneeSelectionnee}`
                : "Aucune année"}
            </span>
            <ChevronDown size={14} style={{ color: mutedColor }} />
          </button>

          {showDropdown && annees.length > 0 && (
            <div
              className="absolute top-10 left-0 right-0 z-20 rounded-xl overflow-hidden shadow-lg"
              style={dark ? glassCardDark : glassCardLight}
            >
              {annees.map((a) => (
                <button
                  key={a.id}
                  onClick={() => {
                    setAnneeSelectionnee(a.annee);
                    setShowDropdown(false);
                  }}
                  className="w-full text-left px-3 py-2 text-sm transition-opacity hover:opacity-70"
                  style={{
                    color:
                      a.annee === anneeSelectionnee ? accentColor : textColor,
                    fontWeight: a.annee === anneeSelectionnee ? 600 : 400,
                  }}
                >
                  {a.annee}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Bouton + ajouter une année */}
        <button
          onClick={handleAjouterAnnee}
          className="w-9 h-9 rounded-full flex items-center justify-center shadow-md transition-opacity hover:opacity-80 flex-shrink-0"
          style={{ background: "#e3c47d", color: "#000a18" }}
        >
          <Plus size={18} strokeWidth={2.5} />
        </button>
      </div>

      {/* Tableau compta */}
      {anneeSelectionnee && (
        <div className="rounded-2xl overflow-hidden" style={cardStyle}>
          {/* Header tableau */}
          <div
            className="px-4 py-3 flex items-center justify-between"
            style={{ borderBottom: `1px solid ${borderColor}` }}
          >
            <div>
              <p className="font-bold text-base" style={{ color: accentColor }}>
                {anneeSelectionnee}
              </p>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span
                  className="text-sm font-semibold"
                  style={{ color: textColor }}
                >
                  {total.toFixed(2)} €
                </span>
                <span className="text-xs" style={{ color: mutedColor }}>
                  total dépenses
                </span>
              </div>
              <p className="text-[10px] mt-0.5" style={{ color: mutedColor }}>
                soit{" "}
                <span className="font-semibold" style={{ color: accentColor }}>
                  {parTrois.toFixed(2)} €
                </span>{" "}
                / personne
              </p>
            </div>

            {/* Bouton ajouter dépense */}
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-1 h-8 px-3 rounded-xl text-xs font-semibold transition-opacity hover:opacity-85"
              style={{ background: "#e3c47d", color: "#000a18" }}
            >
              <Plus size={13} /> Ajouter
            </button>
          </div>

          {/* Colonnes header */}
          <div
            className="grid px-4 py-2 text-[10px] font-semibold uppercase tracking-wide"
            style={{
              gridTemplateColumns: "1fr 1.5fr 80px 80px 36px",
              color: mutedColor,
              borderBottom: `1px solid ${borderColor}`,
            }}
          >
            <span>Nom</span>
            <span>Sujet</span>
            <span className="text-right">Prix</span>
            <span className="text-right">÷ 3</span>
            <span />
          </div>

          {/* Lignes dépenses */}
          {depenses.length === 0 ? (
            <div className="py-8 flex flex-col items-center gap-1">
              <p className="text-sm" style={{ color: mutedColor }}>
                Aucune dépense
              </p>
              <p className="text-xs" style={{ color: mutedColor }}>
                Appuie sur "+ Ajouter" pour commencer
              </p>
            </div>
          ) : (
            depenses.map((d, i) => {
              const isLast = i === depenses.length - 1;
              return (
                <div
                  key={d.id}
                  className="grid items-center px-4 py-2.5 group"
                  style={{
                    gridTemplateColumns: "1fr 1.5fr 80px 80px 36px",
                    borderBottom: isLast ? "none" : `1px solid ${borderColor}`,
                  }}
                >
                  <span
                    className="text-xs font-medium"
                    style={{ color: textColor }}
                  >
                    {d.nom}
                  </span>
                  <span
                    className="text-xs truncate pr-2"
                    style={{ color: mutedColor }}
                  >
                    {d.sujet}
                  </span>
                  <span
                    className="text-xs font-semibold text-right"
                    style={{ color: textColor }}
                  >
                    {(d.prix || 0).toFixed(2)} €
                  </span>
                  <span
                    className="text-xs text-right"
                    style={{ color: accentColor }}
                  >
                    {((d.prix || 0) / 3).toFixed(2)} €
                  </span>
                  <div className="flex items-center justify-end gap-0.5">
                    {d.factureUrl && (
                      <a
                        href={d.factureUrl}
                        target="_blank"
                        rel="noreferrer"
                        title="Voir la facture"
                        className="w-6 h-6 rounded-lg flex items-center justify-center transition-opacity hover:opacity-70"
                        style={{
                          background: "rgba(227,196,125,0.15)",
                          color: accentColor,
                        }}
                      >
                        <ExternalLink size={11} />
                      </a>
                    )}
                    <button
                      onClick={() => handleDeleteDepense(d.id)}
                      className="w-6 h-6 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{ color: "#ef4444" }}
                    >
                      <Trash2 size={11} />
                    </button>
                  </div>
                </div>
              );
            })
          )}

          {/* Footer total */}
          {depenses.length > 0 && (
            <div
              className="px-4 py-2.5 grid"
              style={{
                gridTemplateColumns: "1fr 1.5fr 80px 80px 36px",
                borderTop: `1px solid ${borderColor}`,
                background: dark
                  ? "rgba(227,196,125,0.05)"
                  : "rgba(227,196,125,0.08)",
              }}
            >
              <span
                className="col-span-2 text-[10px] font-semibold uppercase tracking-wide"
                style={{ color: mutedColor }}
              >
                Total
              </span>
              <span
                className="text-xs font-bold text-right"
                style={{ color: accentColor }}
              >
                {total.toFixed(2)} €
              </span>
              <span
                className="text-xs font-bold text-right"
                style={{ color: accentColor }}
              >
                {parTrois.toFixed(2)} €
              </span>
              <span />
            </div>
          )}
        </div>
      )}

      {/* État vide — aucune année */}
      {annees.length === 0 && (
        <div
          className="rounded-2xl p-8 flex flex-col items-center gap-2"
          style={cardStyle}
        >
          <p className="text-sm" style={{ color: mutedColor }}>
            Aucune année enregistrée
          </p>
          <p className="text-xs" style={{ color: mutedColor }}>
            Appuie sur + pour ajouter une année
          </p>
        </div>
      )}

      {/* Modal dépense */}
      {showModal && anneeSelectionnee && (
        <DepenseModal
          annee={anneeSelectionnee}
          onClose={() => setShowModal(false)}
          onSaved={() => {}}
        />
      )}
    </div>
  );
}

// ─── Page principale ──────────────────────────────────────────────────────────

export default function Finance() {
  const dark = useDarkMode();

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pt-2">
        <div>
          <h1 className="text-xl font-bold text-foreground">Finance</h1>
          <p className="text-muted-foreground text-sm">
            Données bancaires & comptabilité
          </p>
        </div>
      </div>

      {/* Cartes bancaire */}
      <CartesBancaires dark={dark} />

      {/* Séparateur */}
      <div
        style={{
          borderTop: dark
            ? "1px solid rgba(255,255,255,0.07)"
            : "1px solid rgba(0,0,0,0.06)",
        }}
      />

      {/* Section compta */}
      <SectionCompta dark={dark} />
    </div>
  );
}
