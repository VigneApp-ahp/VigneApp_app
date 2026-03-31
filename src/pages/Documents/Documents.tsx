import { useEffect, useRef, useState } from "react";
import {
  collection,
  onSnapshot,
  addDoc,
  deleteDoc,
  doc,
  updateDoc,
  query,
  where,
} from "firebase/firestore";
import { db } from "@/config/firebase";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import {
  Plus,
  X,
  Check,
  Trash2,
  Upload,
  ExternalLink,
  FileText,
  FolderPlus,
  Folder,
  Pencil,
  File,
  Image,
} from "lucide-react";
import { Input } from "@/components/ui/input";

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

interface Category {
  id: string;
  uid: string;
  name: string;
  color: string;
}

interface Document {
  id: string;
  uid: string;
  categoryId: string;
  name: string;
  description: string;
  fileUrl: string;
  fileType: string;
  createdAt: number;
}

// ─── Palette de couleurs pour les catégories ──────────────────────────────────

const CATEGORY_COLORS = [
  "#418c55",
  "#3f788c",
  "#06b6d4",
  "#BA68C8",
  "#ef4444",
  "#f59e0b",
  "#ec4899",
  "#10b981",
];

// ─── Utilitaires ──────────────────────────────────────────────────────────────

function getFileIcon(fileType: string) {
  if (fileType.startsWith("image/")) return Image;
  return File;
}

function getFileTypeLabel(fileType: string): string {
  if (fileType === "application/pdf") return "PDF";
  if (fileType.startsWith("image/"))
    return fileType.split("/")[1].toUpperCase();
  return "DOC";
}

// ─── Modal Nouvelle Catégorie ─────────────────────────────────────────────────

function CategoryModal({
  onClose,
  onSaved,
  uid,
  dark,
}: {
  onClose: () => void;
  onSaved: () => void;
  uid: string;
  dark: boolean;
}) {
  const [name, setName] = useState("");
  const [color, setColor] = useState(CATEGORY_COLORS[0]);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      await addDoc(collection(db, "documents_categories"), {
        uid,
        name: name.trim(),
        color,
      });
      onSaved();
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const textColor = dark ? "#e3c47d" : "#000a18";
  const mutedColor = dark ? "rgba(240,236,224,0.5)" : "rgba(0,10,24,0.45)";
  const modalBg = dark
    ? {
        background: "rgba(20,18,30,0.97)",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        border: "1px solid rgba(255,255,255,0.15)",
      }
    : {
        background: "rgba(255,255,255,0.92)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        border: "1px solid rgba(0,0,0,0.08)",
        boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
      };

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-end justify-center px-4 pb-24"
      style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full max-w-md rounded-2xl p-5 space-y-4"
        style={modalBg}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FolderPlus size={16} style={{ color: "#e3c47d" }} />
            <h2 className="text-sm font-semibold" style={{ color: textColor }}>
              Nouvelle catégorie
            </h2>
          </div>
          <button onClick={onClose}>
            <X size={16} style={{ color: mutedColor }} />
          </button>
        </div>

        {/* Nom */}
        <div className="space-y-1">
          <label className="text-xs" style={{ color: mutedColor }}>
            Nom de la catégorie
          </label>
          <Input
            placeholder="Ex: Identité, Assurances..."
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSave()}
            className="h-9 text-sm"
            style={
              dark
                ? {
                    background: "rgba(255,255,255,0.07)",
                    borderColor: "rgba(255,255,255,0.2)",
                    color: "#f0ece0",
                  }
                : {}
            }
          />
        </div>

        {/* Couleur */}
        <div className="space-y-2">
          <label className="text-xs" style={{ color: mutedColor }}>
            Couleur
          </label>
          <div className="flex gap-2 flex-wrap">
            {CATEGORY_COLORS.map((c) => (
              <button
                key={c}
                onClick={() => setColor(c)}
                className="w-7 h-7 rounded-full transition-transform hover:scale-110"
                style={{
                  background: c,
                  outline: color === c ? `3px solid ${c}` : "none",
                  outlineOffset: "2px",
                  opacity: color === c ? 1 : 0.55,
                }}
              />
            ))}
          </div>
        </div>

        {/* Aperçu */}
        <div
          className="flex items-center gap-2 px-3 py-2 rounded-xl"
          style={{
            background: `${color}18`,
            border: `1px solid ${color}40`,
          }}
        >
          <Folder size={14} style={{ color }} />
          <span className="text-xs font-medium" style={{ color }}>
            {name || "Aperçu de la catégorie"}
          </span>
        </div>

        {/* Boutons */}
        <div className="flex gap-2 pt-1">
          <button
            onClick={handleSave}
            disabled={saving || !name.trim()}
            className="flex-1 flex items-center justify-center gap-1 h-9 rounded-xl text-xs font-semibold transition-opacity hover:opacity-85 disabled:opacity-40"
            style={{ background: "#e3c47d", color: "#000a18" }}
          >
            <Check size={13} />
            {saving ? "Création..." : "Créer"}
          </button>
          <button
            onClick={onClose}
            className="flex-1 flex items-center justify-center gap-1 h-9 rounded-xl text-xs font-semibold border transition-opacity hover:opacity-80"
            style={
              dark
                ? {
                    borderColor: "rgba(255,255,255,0.2)",
                    color: "rgba(240,236,224,0.8)",
                    background: "rgba(255,255,255,0.07)",
                  }
                : { borderColor: "rgba(0,0,0,0.15)", color: "#000a18" }
            }
          >
            <X size={13} /> Annuler
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Modal Nouveau Document ───────────────────────────────────────────────────

function DocumentModal({
  categoryId,
  categories,
  uid,
  dark,
  onClose,
  onSaved,
}: {
  categoryId: string;
  categories: Category[];
  uid: string;
  dark: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [fileUrl, setFileUrl] = useState("");
  const [fileType, setFileType] = useState("");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState(categoryId);
  const fileRef = useRef<HTMLInputElement>(null);

  const textColor = dark ? "#e3c47d" : "#000a18";
  const mutedColor = dark ? "rgba(240,236,224,0.5)" : "rgba(0,10,24,0.45)";
  const modalBg = dark
    ? {
        background: "rgba(20,18,30,0.97)",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        border: "1px solid rgba(255,255,255,0.15)",
      }
    : {
        background: "rgba(255,255,255,0.92)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        border: "1px solid rgba(0,0,0,0.08)",
        boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
      };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadToCloudinary(file);
      setFileUrl(url);
      setFileType(file.type);
      if (!name) setName(file.name.replace(/\.[^/.]+$/, ""));
    } catch {
      alert("Erreur lors de l'upload");
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!name.trim() || !fileUrl) return;
    setSaving(true);
    try {
      await addDoc(collection(db, "documents_files"), {
        uid,
        categoryId: selectedCategoryId,
        name: name.trim(),
        description: description.trim(),
        fileUrl,
        fileType,
        createdAt: Date.now(),
      });
      onSaved();
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const selectedCat = categories.find((c) => c.id === selectedCategoryId);

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-end justify-center px-4 pb-24"
      style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full max-w-md rounded-2xl p-5 space-y-4"
        style={modalBg}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText size={16} style={{ color: "#e3c47d" }} />
            <h2 className="text-sm font-semibold" style={{ color: textColor }}>
              Ajouter un document
            </h2>
          </div>
          <button onClick={onClose}>
            <X size={16} style={{ color: mutedColor }} />
          </button>
        </div>

        {/* Catégorie */}
        <div className="space-y-1">
          <label className="text-xs" style={{ color: mutedColor }}>
            Catégorie
          </label>
          <div className="flex gap-2 flex-wrap">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategoryId(cat.id)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all"
                style={{
                  background:
                    selectedCategoryId === cat.id
                      ? `${cat.color}25`
                      : "rgba(128,128,128,0.08)",
                  border: `1px solid ${selectedCategoryId === cat.id ? cat.color + "60" : "rgba(128,128,128,0.2)"}`,
                  color: selectedCategoryId === cat.id ? cat.color : mutedColor,
                }}
              >
                <Folder size={11} />
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Upload fichier */}
        <div className="space-y-1">
          <label className="text-xs" style={{ color: mutedColor }}>
            Fichier *
          </label>
          <input
            ref={fileRef}
            type="file"
            className="hidden"
            onChange={handleUpload}
          />
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="w-full flex items-center justify-center gap-2 h-16 rounded-xl border-2 border-dashed text-xs transition-opacity hover:opacity-80 disabled:opacity-40"
            style={{
              borderColor: fileUrl
                ? (selectedCat?.color ?? "#e3c47d") + "60"
                : dark
                  ? "rgba(255,255,255,0.15)"
                  : "rgba(0,0,0,0.15)",
              background: fileUrl
                ? (selectedCat?.color ?? "#e3c47d") + "10"
                : "transparent",
              color: fileUrl ? (selectedCat?.color ?? "#e3c47d") : mutedColor,
            }}
          >
            {uploading ? (
              <span>Upload en cours...</span>
            ) : fileUrl ? (
              <div className="flex items-center gap-2">
                <Check size={14} />
                <span className="font-medium">Fichier importé</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Upload size={14} />
                <span>Importer un fichier (PDF, image…)</span>
              </div>
            )}
          </button>
        </div>

        {/* Nom */}
        <div className="space-y-1">
          <label className="text-xs" style={{ color: mutedColor }}>
            Nom du document *
          </label>
          <Input
            placeholder="Ex: Carte d'identité, Déclaration 2024..."
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="h-9 text-sm"
            style={
              dark
                ? {
                    background: "rgba(255,255,255,0.07)",
                    borderColor: "rgba(255,255,255,0.2)",
                    color: "#f0ece0",
                  }
                : {}
            }
          />
        </div>

        {/* Description */}
        <div className="space-y-1">
          <label className="text-xs" style={{ color: mutedColor }}>
            Description courte (optionnel)
          </label>
          <Input
            placeholder="Ex: Valide jusqu'en 2029..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="h-9 text-sm"
            style={
              dark
                ? {
                    background: "rgba(255,255,255,0.07)",
                    borderColor: "rgba(255,255,255,0.2)",
                    color: "#f0ece0",
                  }
                : {}
            }
          />
        </div>

        {/* Boutons */}
        <div className="flex gap-2 pt-1">
          <button
            onClick={handleSave}
            disabled={saving || !name.trim() || !fileUrl}
            className="flex-1 flex items-center justify-center gap-1 h-9 rounded-xl text-xs font-semibold transition-opacity hover:opacity-85 disabled:opacity-40"
            style={{ background: "#e3c47d", color: "#000a18" }}
          >
            <Check size={13} />
            {saving ? "Enregistrement..." : "Enregistrer"}
          </button>
          <button
            onClick={onClose}
            className="flex-1 flex items-center justify-center gap-1 h-9 rounded-xl text-xs font-semibold border transition-opacity hover:opacity-80"
            style={
              dark
                ? {
                    borderColor: "rgba(255,255,255,0.2)",
                    color: "rgba(240,236,224,0.8)",
                    background: "rgba(255,255,255,0.07)",
                  }
                : { borderColor: "rgba(0,0,0,0.15)", color: "#000a18" }
            }
          >
            <X size={13} /> Annuler
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Carte Document ───────────────────────────────────────────────────────────

function DocumentCard({
  document,
  category,
  dark,
  onDelete,
  onEdit,
}: {
  document: Document;
  category?: Category;
  dark: boolean;
  onDelete: () => void;
  onEdit: () => void;
}) {
  const textColor = dark ? "#e3c47d" : "#000a18";
  const mutedColor = dark ? "rgba(255,255,255,0.45)" : "rgba(0,10,24,0.45)";
  const cardBg = dark
    ? {
        background: "rgba(255,255,255,0.08)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        border: "1px solid rgba(255,255,255,0.12)",
      }
    : {
        background: "rgba(255,255,255,0.55)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        border: "1px solid rgba(0,0,0,0.09)",
        boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
      };

  const accentColor = category?.color ?? "#e3c47d";
  const FileIcon = getFileIcon(document.fileType);
  const typeLabel = getFileTypeLabel(document.fileType);

  return (
    <div
      className="rounded-2xl p-3 flex items-center gap-3 group transition-all hover:scale-[1.01]"
      style={cardBg}
    >
      {/* Icône type fichier */}
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{
          background: `${accentColor}20`,
          border: `1px solid ${accentColor}35`,
        }}
      >
        <FileIcon size={18} style={{ color: accentColor }} />
      </div>

      {/* Infos */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p
            className="text-sm font-semibold truncate"
            style={{ color: textColor }}
          >
            {document.name}
          </p>
          <span
            className="text-[9px] font-bold px-1.5 py-0.5 rounded-md flex-shrink-0"
            style={{ background: `${accentColor}20`, color: accentColor }}
          >
            {typeLabel}
          </span>
        </div>
        {document.description && (
          <p className="text-xs truncate mt-0.5" style={{ color: mutedColor }}>
            {document.description}
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={onEdit}
          className="w-7 h-7 rounded-lg flex items-center justify-center transition-opacity hover:opacity-70"
          style={{ background: "rgba(128,128,128,0.12)", color: mutedColor }}
        >
          <Pencil size={11} />
        </button>
        <button
          onClick={onDelete}
          className="w-7 h-7 rounded-lg flex items-center justify-center transition-opacity hover:opacity-70"
          style={{ background: "rgba(239,68,68,0.12)", color: "#ef4444" }}
        >
          <Trash2 size={11} />
        </button>
      </div>

      {/* Ouvrir */}
      <a
        href={document.fileUrl}
        target="_blank"
        rel="noreferrer"
        className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 transition-opacity hover:opacity-80"
        style={{ background: `${accentColor}20`, color: accentColor }}
        onClick={(e) => e.stopPropagation()}
      >
        <ExternalLink size={13} />
      </a>
    </div>
  );
}

// ─── Modal Édition Document ───────────────────────────────────────────────────

function EditDocumentModal({
  document,
  categories,
  dark,
  onClose,
  onSaved,
}: {
  document: Document;
  categories: Category[];
  dark: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(document.name);
  const [description, setDescription] = useState(document.description);
  const [categoryId, setCategoryId] = useState(document.categoryId);
  const [saving, setSaving] = useState(false);

  const textColor = dark ? "#e3c47d" : "#000a18";
  const mutedColor = dark ? "rgba(240,236,224,0.5)" : "rgba(0,10,24,0.45)";
  const modalBg = dark
    ? {
        background: "rgba(20,18,30,0.97)",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        border: "1px solid rgba(255,255,255,0.15)",
      }
    : {
        background: "rgba(255,255,255,0.92)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        border: "1px solid rgba(0,0,0,0.08)",
        boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
      };

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, "documents_files", document.id), {
        name: name.trim(),
        description: description.trim(),
        categoryId,
      });
      onSaved();
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-end justify-center px-4 pb-24"
      style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full max-w-md rounded-2xl p-5 space-y-4"
        style={modalBg}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold" style={{ color: textColor }}>
            Modifier le document
          </h2>
          <button onClick={onClose}>
            <X size={16} style={{ color: mutedColor }} />
          </button>
        </div>

        <div className="space-y-1">
          <label className="text-xs" style={{ color: mutedColor }}>
            Catégorie
          </label>
          <div className="flex gap-2 flex-wrap">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setCategoryId(cat.id)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all"
                style={{
                  background:
                    categoryId === cat.id
                      ? `${cat.color}25`
                      : "rgba(128,128,128,0.08)",
                  border: `1px solid ${categoryId === cat.id ? cat.color + "60" : "rgba(128,128,128,0.2)"}`,
                  color: categoryId === cat.id ? cat.color : mutedColor,
                }}
              >
                <Folder size={11} />
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs" style={{ color: mutedColor }}>
            Nom
          </label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="h-9 text-sm"
            style={
              dark
                ? {
                    background: "rgba(255,255,255,0.07)",
                    borderColor: "rgba(255,255,255,0.2)",
                    color: "#f0ece0",
                  }
                : {}
            }
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs" style={{ color: mutedColor }}>
            Description
          </label>
          <Input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="h-9 text-sm"
            style={
              dark
                ? {
                    background: "rgba(255,255,255,0.07)",
                    borderColor: "rgba(255,255,255,0.2)",
                    color: "#f0ece0",
                  }
                : {}
            }
          />
        </div>

        <div className="flex gap-2 pt-1">
          <button
            onClick={handleSave}
            disabled={saving || !name.trim()}
            className="flex-1 flex items-center justify-center gap-1 h-9 rounded-xl text-xs font-semibold transition-opacity hover:opacity-85 disabled:opacity-40"
            style={{ background: "#e3c47d", color: "#000a18" }}
          >
            <Check size={13} />
            {saving ? "Enregistrement..." : "Enregistrer"}
          </button>
          <button
            onClick={onClose}
            className="flex-1 flex items-center justify-center gap-1 h-9 rounded-xl text-xs font-semibold border transition-opacity hover:opacity-80"
            style={
              dark
                ? {
                    borderColor: "rgba(255,255,255,0.2)",
                    color: "rgba(240,236,224,0.8)",
                    background: "rgba(255,255,255,0.07)",
                  }
                : { borderColor: "rgba(0,0,0,0.15)", color: "#000a18" }
            }
          >
            <X size={13} /> Annuler
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Page principale ──────────────────────────────────────────────────────────

export default function Documents() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const dark = theme === "dark";

  const [categories, setCategories] = useState<Category[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [activeTab, setActiveTab] = useState<string>("all");
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showDocModal, setShowDocModal] = useState(false);
  const [editingDoc, setEditingDoc] = useState<Document | null>(null);

  const uid = user?.uid ?? "";

  const textColor = dark ? "#e3c47d" : "#000a18";
  const mutedColor = dark ? "rgba(255,255,255,0.45)" : "rgba(0,10,24,0.45)";

  // ── Chargement des catégories de l'utilisateur
  useEffect(() => {
    if (!uid) return;
    const q = query(
      collection(db, "documents_categories"),
      where("uid", "==", uid),
    );
    const unsub = onSnapshot(q, (snap) => {
      setCategories(
        snap.docs.map((d) => ({ id: d.id, ...d.data() })) as Category[],
      );
    });
    return () => unsub();
  }, [uid]);

  // ── Chargement des documents de l'utilisateur
  useEffect(() => {
    if (!uid) return;
    const q = query(collection(db, "documents_files"), where("uid", "==", uid));
    const unsub = onSnapshot(q, (snap) => {
      setDocuments(
        snap.docs.map((d) => ({ id: d.id, ...d.data() })) as Document[],
      );
    });
    return () => unsub();
  }, [uid]);

  const handleDeleteDoc = async (docId: string) => {
    if (!confirm("Supprimer ce document ?")) return;
    await deleteDoc(doc(db, "documents_files", docId));
  };

  const handleDeleteCategory = async (catId: string) => {
    const docsInCat = documents.filter((d) => d.categoryId === catId);
    if (docsInCat.length > 0) {
      alert(
        `Cette catégorie contient ${docsInCat.length} document(s). Supprimez-les d'abord.`,
      );
      return;
    }
    if (!confirm("Supprimer cette catégorie ?")) return;
    await deleteDoc(doc(db, "documents_categories", catId));
    if (activeTab === catId) setActiveTab("all");
  };

  // Documents filtrés selon l'onglet actif
  const filteredDocs =
    activeTab === "all"
      ? documents
      : documents.filter((d) => d.categoryId === activeTab);

  // Trier par date décroissante
  const sortedDocs = [...filteredDocs].sort(
    (a, b) => b.createdAt - a.createdAt,
  );

  // Catégorie active pour le modal de doc
  const activeCategoryId =
    activeTab === "all" ? (categories[0]?.id ?? "") : activeTab;

  // Compter docs par catégorie
  const countByCategory = (catId: string) =>
    documents.filter((d) => d.categoryId === catId).length;

  return (
    <div className="flex flex-col h-[calc(100vh-90px)]">
      {/* ── Header ── */}
      <div className="px-4 pt-4 pb-3 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold" style={{ color: textColor }}>
            Documents
          </h1>
          <p className="text-sm" style={{ color: mutedColor }}>
            {documents.length} document{documents.length !== 1 ? "s" : ""}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Bouton nouvelle catégorie */}
          <button
            onClick={() => setShowCategoryModal(true)}
            className="flex items-center gap-1.5 h-8 px-3 rounded-xl text-xs font-medium border transition-opacity hover:opacity-80"
            style={
              dark
                ? {
                    borderColor: "rgba(255,255,255,0.2)",
                    color: "rgba(255,255,255,0.7)",
                    background: "rgba(255,255,255,0.07)",
                  }
                : {
                    borderColor: "rgba(0,0,0,0.15)",
                    color: "#000a18",
                    background: "rgba(0,0,0,0.04)",
                  }
            }
          >
            <FolderPlus size={13} />
            Catégorie
          </button>

          {/* Bouton ajouter document */}
          {categories.length > 0 && (
            <button
              onClick={() => setShowDocModal(true)}
              className="w-9 h-9 rounded-full flex items-center justify-center shadow-md transition-opacity hover:opacity-80"
              style={{ background: "#e3c47d", color: "#000a18" }}
            >
              <Plus size={18} strokeWidth={2.5} />
            </button>
          )}
        </div>
      </div>

      {/* ── Onglets catégories ── */}
      {categories.length > 0 && (
        <div className="px-4 mb-3">
          <div
            className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide"
            style={{ scrollbarWidth: "none" }}
          >
            {/* Onglet "Tous" */}
            <button
              onClick={() => setActiveTab("all")}
              className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all"
              style={{
                background:
                  activeTab === "all"
                    ? dark
                      ? "rgba(255,255,255,0.15)"
                      : "rgba(0,0,0,0.1)"
                    : dark
                      ? "rgba(255,255,255,0.06)"
                      : "rgba(0,0,0,0.04)",
                border: `1px solid ${
                  activeTab === "all"
                    ? dark
                      ? "rgba(255,255,255,0.25)"
                      : "rgba(0,0,0,0.2)"
                    : dark
                      ? "rgba(255,255,255,0.1)"
                      : "rgba(0,0,0,0.08)"
                }`,
                color: activeTab === "all" ? textColor : mutedColor,
                fontWeight: activeTab === "all" ? 600 : 400,
              }}
            >
              Tous
              <span
                className="text-[10px] px-1.5 py-0.5 rounded-md"
                style={{
                  background:
                    activeTab === "all"
                      ? "rgba(128,128,128,0.2)"
                      : "rgba(128,128,128,0.1)",
                  color: activeTab === "all" ? textColor : mutedColor,
                }}
              >
                {documents.length}
              </span>
            </button>

            {/* Onglets par catégorie */}
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveTab(cat.id)}
                className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all"
                style={{
                  background:
                    activeTab === cat.id
                      ? `${cat.color}20`
                      : dark
                        ? "rgba(255,255,255,0.06)"
                        : "rgba(0,0,0,0.04)",
                  border: `1px solid ${activeTab === cat.id ? cat.color + "50" : dark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)"}`,
                  color: activeTab === cat.id ? cat.color : mutedColor,
                  fontWeight: activeTab === cat.id ? 600 : 400,
                }}
              >
                <Folder size={11} />
                {cat.name}
                <span
                  className="text-[10px] px-1.5 py-0.5 rounded-md"
                  style={{
                    background:
                      activeTab === cat.id
                        ? `${cat.color}25`
                        : "rgba(128,128,128,0.1)",
                    color: activeTab === cat.id ? cat.color : mutedColor,
                  }}
                >
                  {countByCategory(cat.id)}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Contenu principal ── */}
      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-2">
        {/* État vide — pas de catégories */}
        {categories.length === 0 && (
          <div
            className="rounded-2xl p-10 flex flex-col items-center gap-3 mt-4"
            style={
              dark
                ? {
                    background: "rgba(255,255,255,0.07)",
                    border: "1px solid rgba(255,255,255,0.1)",
                  }
                : {
                    background: "rgba(255,255,255,0.5)",
                    border: "1px solid rgba(0,0,0,0.08)",
                  }
            }
          >
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center"
              style={{
                background: "rgba(227,196,125,0.15)",
                border: "1px solid rgba(227,196,125,0.3)",
              }}
            >
              <Folder size={24} style={{ color: "#e3c47d" }} />
            </div>
            <div className="text-center space-y-1">
              <p className="text-sm font-semibold" style={{ color: textColor }}>
                Aucune catégorie
              </p>
              <p className="text-xs" style={{ color: mutedColor }}>
                Commence par créer une catégorie pour organiser tes documents
              </p>
            </div>
            <button
              onClick={() => setShowCategoryModal(true)}
              className="flex items-center gap-1.5 h-9 px-4 rounded-xl text-xs font-semibold transition-opacity hover:opacity-85 mt-1"
              style={{ background: "#e3c47d", color: "#000a18" }}
            >
              <FolderPlus size={13} /> Créer une catégorie
            </button>
          </div>
        )}

        {/* État vide — catégorie vide */}
        {categories.length > 0 && sortedDocs.length === 0 && (
          <div
            className="rounded-2xl p-8 flex flex-col items-center gap-3 mt-2"
            style={
              dark
                ? {
                    background: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.08)",
                  }
                : {
                    background: "rgba(255,255,255,0.45)",
                    border: "1px solid rgba(0,0,0,0.07)",
                  }
            }
          >
            <FileText size={22} style={{ color: mutedColor }} />
            <div className="text-center space-y-0.5">
              <p className="text-sm font-medium" style={{ color: textColor }}>
                Aucun document ici
              </p>
              <p className="text-xs" style={{ color: mutedColor }}>
                Appuie sur + pour importer un fichier
              </p>
            </div>
          </div>
        )}

        {/* Section par catégorie si onglet "Tous" */}
        {activeTab === "all" &&
          categories.length > 0 &&
          sortedDocs.length > 0 && (
            <div className="space-y-4">
              {categories.map((cat) => {
                const catDocs = sortedDocs.filter(
                  (d) => d.categoryId === cat.id,
                );
                if (catDocs.length === 0) return null;
                return (
                  <div key={cat.id} className="space-y-2">
                    {/* Header catégorie */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Folder size={13} style={{ color: cat.color }} />
                        <span
                          className="text-xs font-semibold"
                          style={{ color: cat.color }}
                        >
                          {cat.name}
                        </span>
                        <span
                          className="text-[10px]"
                          style={{ color: mutedColor }}
                        >
                          {catDocs.length} fichier
                          {catDocs.length !== 1 ? "s" : ""}
                        </span>
                      </div>
                      <button
                        onClick={() => handleDeleteCategory(cat.id)}
                        className="w-6 h-6 rounded-lg flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity"
                        style={{ color: "#ef4444" }}
                      >
                        <Trash2 size={10} />
                      </button>
                    </div>
                    {/* Documents de la catégorie */}
                    {catDocs.map((d) => (
                      <DocumentCard
                        key={d.id}
                        document={d}
                        category={cat}
                        dark={dark}
                        onDelete={() => handleDeleteDoc(d.id)}
                        onEdit={() => setEditingDoc(d)}
                      />
                    ))}
                  </div>
                );
              })}
            </div>
          )}

        {/* Vue filtrée par catégorie */}
        {activeTab !== "all" && sortedDocs.length > 0 && (
          <div className="space-y-2">
            {/* Header avec option supprimer catégorie */}
            {(() => {
              const cat = categories.find((c) => c.id === activeTab);
              if (!cat) return null;
              return (
                <div className="flex items-center justify-between pb-1">
                  <div className="flex items-center gap-2">
                    <Folder size={14} style={{ color: cat.color }} />
                    <span
                      className="text-sm font-semibold"
                      style={{ color: cat.color }}
                    >
                      {cat.name}
                    </span>
                  </div>
                  <button
                    onClick={() => handleDeleteCategory(cat.id)}
                    className="flex items-center gap-1 h-7 px-2.5 rounded-lg text-[10px] border transition-opacity hover:opacity-80"
                    style={{
                      borderColor: "rgba(239,68,68,0.3)",
                      color: "#ef4444",
                      background: "rgba(239,68,68,0.06)",
                    }}
                  >
                    <Trash2 size={10} /> Supprimer
                  </button>
                </div>
              );
            })()}

            {sortedDocs.map((d) => (
              <DocumentCard
                key={d.id}
                document={d}
                category={categories.find((c) => c.id === d.categoryId)}
                dark={dark}
                onDelete={() => handleDeleteDoc(d.id)}
                onEdit={() => setEditingDoc(d)}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Modals ── */}
      {showCategoryModal && (
        <CategoryModal
          uid={uid}
          dark={dark}
          onClose={() => setShowCategoryModal(false)}
          onSaved={() => {}}
        />
      )}

      {showDocModal && categories.length > 0 && (
        <DocumentModal
          categoryId={activeCategoryId}
          categories={categories}
          uid={uid}
          dark={dark}
          onClose={() => setShowDocModal(false)}
          onSaved={() => {}}
        />
      )}

      {editingDoc && (
        <EditDocumentModal
          document={editingDoc}
          categories={categories}
          dark={dark}
          onClose={() => setEditingDoc(null)}
          onSaved={() => setEditingDoc(null)}
        />
      )}
    </div>
  );
}
