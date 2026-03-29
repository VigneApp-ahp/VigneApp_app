import { useEffect, useState } from 'react'
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore'
import { db } from '@/config/firebase'
import { Plus, ChevronDown, Pencil, Trash2, X, Check, FlaskConical } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

// ─── Types ───────────────────────────────────────────────────────────────────

interface PrelevementParcelle {
  parcelleId: string
  nom: string
  degres: number | ''
}

interface Prelevement {
  id: string
  numero: number
  date: string
  parcelles: PrelevementParcelle[]
}

interface Vendange {
  id: string
  annee: number
  dateDebut: string
  dateFin: string
  appellation: string
  nbCueilleurs: number
  salaireCueilleurs: number
  nbDebardeurs: number
  salaireDebardeurs: number
  note: string
  prelevements: Prelevement[]
}

// ─── Style glassmorphism ──────────────────────────────────────────────────────

const glassCard = {
  background: 'rgba(255,255,255,0.15)',
  backdropFilter: 'blur(16px)',
  WebkitBackdropFilter: 'blur(16px)',
  border: '1px solid rgba(255,255,255,0.3)',
}

const glassModal = {
  background: 'rgba(15,15,25,0.85)',
  backdropFilter: 'blur(24px)',
  WebkitBackdropFilter: 'blur(24px)',
  border: '1px solid rgba(255,255,255,0.15)',
}

// ─── Calcul du coût total ─────────────────────────────────────────────────────

function calculerCout(v: Omit<Vendange, 'id' | 'prelevements'>): number {
  if (!v.dateDebut || !v.dateFin) return 0
  const debut = new Date(v.dateDebut)
  const fin = new Date(v.dateFin)
  const jours = Math.max(1, Math.round((fin.getTime() - debut.getTime()) / (1000 * 60 * 60 * 24)) + 1)
  const cueilleurs = (v.nbCueilleurs || 0) * (v.salaireCueilleurs || 0) * 8 * jours
  const debardeurs = (v.nbDebardeurs || 0) * (v.salaireDebardeurs || 0) * 8 * jours
  return cueilleurs + debardeurs
}

// ─── Formulaire Vendange ──────────────────────────────────────────────────────

const defaultVendange = {
  annee: new Date().getFullYear(),
  dateDebut: '',
  dateFin: '',
  appellation: '',
  nbCueilleurs: 0,
  salaireCueilleurs: 0,
  nbDebardeurs: 0,
  salaireDebardeurs: 0,
  note: '',
}

function VendangeForm({
  initial,
  onSave,
  onCancel,
}: {
  initial: typeof defaultVendange
  onSave: (data: typeof defaultVendange) => void
  onCancel: () => void
}) {
  const [form, setForm] = useState(initial)
  const set = (field: string, value: string | number) =>
    setForm(prev => ({ ...prev, [field]: value }))

  const cout = calculerCout(form as Omit<Vendange, 'id' | 'prelevements'>)

  return (
    <div className="rounded-2xl p-4 border border-[#e3c47d]/40 space-y-3" style={glassCard}>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-xs">Année</Label>
          <Input type="number" value={form.annee}
            onChange={e => set('annee', parseInt(e.target.value))} className="h-8 text-sm" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Appellation (kg/ha)</Label>
          <Input value={form.appellation} placeholder="Ex: 9000 Kg/Ha"
            onChange={e => set('appellation', e.target.value)} className="h-8 text-sm" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Date début</Label>
          <Input type="date" value={form.dateDebut}
            onChange={e => set('dateDebut', e.target.value)} className="h-8 text-sm" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Date fin</Label>
          <Input type="date" value={form.dateFin}
            onChange={e => set('dateFin', e.target.value)} className="h-8 text-sm" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Nb Cueilleurs</Label>
          <Input type="number" value={form.nbCueilleurs}
            onChange={e => set('nbCueilleurs', parseInt(e.target.value))} className="h-8 text-sm" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Salaire cueilleur (€/h)</Label>
          <Input type="number" step="0.01" value={form.salaireCueilleurs}
            onChange={e => set('salaireCueilleurs', parseFloat(e.target.value))} className="h-8 text-sm" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Nb Débardeurs</Label>
          <Input type="number" value={form.nbDebardeurs}
            onChange={e => set('nbDebardeurs', parseInt(e.target.value))} className="h-8 text-sm" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Salaire débardeur (€/h)</Label>
          <Input type="number" step="0.01" value={form.salaireDebardeurs}
            onChange={e => set('salaireDebardeurs', parseFloat(e.target.value))} className="h-8 text-sm" />
        </div>
      </div>

      {/* Coût calculé */}
      <div className="rounded-xl px-3 py-2 flex items-center justify-between"
        style={{ background: 'rgba(227,196,125,0.1)', border: '1px solid rgba(227,196,125,0.3)' }}>
        <span className="text-xs text-muted-foreground">Coût total estimé (salaires)</span>
        <span className="text-sm font-bold" style={{ color: '#e3c47d' }}>
          {cout.toFixed(2)} €
        </span>
      </div>

      {/* Note */}
      <div className="space-y-1">
        <Label className="text-xs">Notes</Label>
        <textarea
          value={form.note}
          onChange={e => set('note', e.target.value)}
          placeholder="Observations, conditions météo..."
          rows={3}
          className="w-full rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 resize-none"
        />
      </div>

      <div className="flex gap-2 pt-1">
        <Button size="sm" className="flex-1" onClick={() => onSave(form)}>
          <Check size={14} className="mr-1" /> Enregistrer
        </Button>
        <Button size="sm" variant="outline" className="flex-1" onClick={onCancel}>
          <X size={14} className="mr-1" /> Annuler
        </Button>
      </div>
    </div>
  )
}

// ─── Modal Prélèvement ────────────────────────────────────────────────────────

function PrelevementModal({
  vendangeId,
  vendangeAnnee,
  prelevements,
  parcelles,
  onClose,
}: {
  vendangeId: string
  vendangeAnnee: number
  prelevements: Prelevement[]
  parcelles: { id: string; nom: string }[]
  onClose: () => void
}) {
  const [showForm, setShowForm] = useState(false)
  const [date, setDate] = useState('')
  const [degrees, setDegrees] = useState<Record<string, number | ''>>({})

  const handleAdd = async () => {
    if (!date) return
    const numero = prelevements.length + 1
    const newPrel: Omit<Prelevement, 'id'> = {
      numero,
      date,
      parcelles: parcelles.map(p => ({
        parcelleId: p.id,
        nom: p.nom,
        degres: degrees[p.id] ?? '',
      })),
    }
    const vendRef = doc(db, 'vendanges', vendangeId)
    const updated = [...prelevements, { ...newPrel, id: crypto.randomUUID() }]
    await updateDoc(vendRef, { prelevements: updated })
    setShowForm(false)
    setDate('')
    setDegrees({})
  }

  const handleDelete = async (prelId: string) => {
    if (!confirm('Supprimer ce prélèvement ?')) return
    const updated = prelevements
      .filter(p => p.id !== prelId)
      .map((p, i) => ({ ...p, numero: i + 1 }))
    await updateDoc(doc(db, 'vendanges', vendangeId), { prelevements: updated })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 pb-28"
      style={{ background: 'rgba(0,0,0,0.6)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="w-full max-w-md rounded-2xl p-4 space-y-4 max-h-[75vh] overflow-y-auto" style={glassModal}>

        {/* Header modal */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-foreground text-sm">Prélèvements {vendangeAnnee}</h2>
            <p className="text-xs text-muted-foreground">{prelevements.length} prélèvement(s)</p>
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={() => setShowForm(true)}
              className="rounded-xl text-xs h-7" style={{ background: '#e3c47d', color: '#000a18' }}>
              <Plus size={12} className="mr-1" /> Ajouter
            </Button>
            <button onClick={onClose}
              className="w-7 h-7 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground"
              style={{ background: 'rgba(255,255,255,0.1)' }}>
              <X size={14} />
            </button>
          </div>
        </div>

        {/* Formulaire nouveau prélèvement */}
        {showForm && (
          <div className="rounded-xl p-3 space-y-3 border border-[#e3c47d]/30"
            style={{ background: 'rgba(255,255,255,0.05)' }}>
            <div className="space-y-1">
              <Label className="text-xs">Date du prélèvement</Label>
              <Input type="date" value={date} onChange={e => setDate(e.target.value)} className="h-8 text-sm" />
            </div>
            <p className="text-xs font-medium text-muted-foreground">Degrés par parcelle</p>
            <div className="space-y-2">
              {parcelles.map(p => (
                <div key={p.id} className="flex items-center gap-2">
                  <span className="text-xs text-foreground flex-1 truncate">{p.nom}</span>
                  <div className="flex items-center gap-1">
                    <Input
                      type="number"
                      step="0.1"
                      placeholder="°"
                      value={degrees[p.id] ?? ''}
                      onChange={e => setDegrees(prev => ({
                        ...prev,
                        [p.id]: e.target.value === '' ? '' : parseFloat(e.target.value)
                      }))}
                      className="h-7 w-20 text-sm text-center"
                    />
                    <span className="text-xs text-muted-foreground">°</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Button size="sm" className="flex-1 h-7 text-xs" onClick={handleAdd}>
                <Check size={12} className="mr-1" /> Enregistrer
              </Button>
              <Button size="sm" variant="outline" className="flex-1 h-7 text-xs"
                onClick={() => { setShowForm(false); setDate(''); setDegrees({}) }}>
                <X size={12} className="mr-1" /> Annuler
              </Button>
            </div>
          </div>
        )}

        {/* Liste des prélèvements */}
        {prelevements.length === 0 && !showForm && (
          <p className="text-center text-sm text-muted-foreground py-4">
            Aucun prélèvement enregistré
          </p>
        )}

        {[...prelevements].sort((a, b) => a.numero - b.numero).map(prel => (
          <div key={prel.id} className="rounded-xl p-3 space-y-2"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-foreground">
                  Prélèvement n°{prel.numero}
                </span>
                <span className="text-xs text-muted-foreground ml-2">
                  {new Date(prel.date).toLocaleDateString('fr-FR')}
                </span>
              </div>
              <button onClick={() => handleDelete(prel.id)}
                className="text-rose-400 hover:text-rose-300 p-1">
                <Trash2 size={13} />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-1">
              {prel.parcelles.filter(p => p.degres !== '').map(p => (
                <div key={p.parcelleId} className="flex items-center justify-between rounded-lg px-2 py-1"
                  style={{ background: 'rgba(227,196,125,0.1)' }}>
                  <span className="text-[10px] text-muted-foreground truncate max-w-[80px]">{p.nom}</span>
                  <span className="text-[10px] font-bold" style={{ color: '#e3c47d' }}>{p.degres}°</span>
                </div>
              ))}
              {prel.parcelles.every(p => p.degres === '') && (
                <span className="text-[10px] text-muted-foreground col-span-2">Aucun degré saisi</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Carte Vendange (accordéon) ───────────────────────────────────────────────

function VendangeCard({
  vendange,
  parcelles,
  onEdit,
  onDelete,
}: {
  vendange: Vendange
  parcelles: { id: string; nom: string }[]
  onEdit: () => void
  onDelete: () => void
}) {
  const [open, setOpen] = useState(false)
  const [showPrelevements, setShowPrelevements] = useState(false)

  const cout = calculerCout(vendange)

  const debut = vendange.dateDebut ? new Date(vendange.dateDebut).toLocaleDateString('fr-FR') : '—'
  const fin = vendange.dateFin ? new Date(vendange.dateFin).toLocaleDateString('fr-FR') : '—'

  let nbJours = 0
  if (vendange.dateDebut && vendange.dateFin) {
    const d = new Date(vendange.dateDebut)
    const f = new Date(vendange.dateFin)
    nbJours = Math.max(1, Math.round((f.getTime() - d.getTime()) / (1000 * 60 * 60 * 24)) + 1)
  }

  return (
    <>
      <div className="rounded-2xl border border-white/10 overflow-hidden" style={glassCard}>
        {/* En-tête cliquable */}
        <button className="w-full flex items-center justify-between px-4 py-3 text-left"
          onClick={() => setOpen(prev => !prev)}>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl flex flex-col items-center justify-center"
              style={{ background: 'rgba(227,196,125,0.15)', border: '1px solid rgba(227,196,125,0.3)' }}>
              <span className="text-lg font-bold leading-none" style={{ color: '#e3c47d' }}>
                {vendange.annee}
              </span>
            </div>
            <div>
              <p className="font-semibold text-foreground text-sm">{vendange.annee}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                {debut} → {fin}
                {nbJours > 0 && <span className="ml-1">· {nbJours}j</span>}
              </p>
              <p className="text-[10px] font-semibold mt-0.5" style={{ color: '#e3c47d' }}>
                {cout.toFixed(2)} €
              </p>
            </div>
          </div>
          <ChevronDown size={16}
            className={`text-muted-foreground transition-transform duration-300 ${open ? 'rotate-180' : ''}`} />
        </button>

        {/* Contenu dépliable */}
        <div className={`transition-all duration-300 overflow-hidden ${open ? 'max-h-[600px]' : 'max-h-0'}`}>
          <div className="px-4 pb-4 space-y-3 border-t border-white/10 pt-3">

            {/* Infos générales */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="space-y-1">
                <p className="text-muted-foreground">Appellation</p>
                <p className="text-foreground font-medium">{vendange.appellation || '—'}</p>
              </div>
              <div className="space-y-1">
                <p className="text-muted-foreground">Durée</p>
                <p className="text-foreground font-medium">{nbJours > 0 ? `${nbJours} jour(s)` : '—'}</p>
              </div>
              <div className="space-y-1">
                <p className="text-muted-foreground">Cueilleurs</p>
                <p className="text-foreground font-medium">
                  {vendange.nbCueilleurs} × {vendange.salaireCueilleurs} €/h
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-muted-foreground">Débardeurs</p>
                <p className="text-foreground font-medium">
                  {vendange.nbDebardeurs} × {vendange.salaireDebardeurs} €/h
                </p>
              </div>
            </div>

            {/* Coût total */}
            <div className="rounded-xl px-3 py-2 flex items-center justify-between"
              style={{ background: 'rgba(227,196,125,0.1)', border: '1px solid rgba(227,196,125,0.3)' }}>
              <span className="text-xs text-muted-foreground">Coût total salaires</span>
              <span className="text-sm font-bold" style={{ color: '#e3c47d' }}>{cout.toFixed(2)} €</span>
            </div>

            {/* Note */}
            {vendange.note && (
              <div className="rounded-xl px-3 py-2 space-y-1"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                <p className="text-[10px] text-muted-foreground">Notes</p>
                <p className="text-xs text-foreground">{vendange.note}</p>
              </div>
            )}

            {/* Prélèvements */}
            <button
              onClick={() => setShowPrelevements(true)}
              className="w-full flex items-center justify-between rounded-xl px-3 py-2 transition-all hover:opacity-80"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <div className="flex items-center gap-2">
                <FlaskConical size={14} className="text-muted-foreground" />
                <span className="text-xs text-foreground">Prélèvements</span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full"
                style={{ background: 'rgba(227,196,125,0.2)', color: '#e3c47d' }}>
                {vendange.prelevements?.length || 0}
              </span>
            </button>

            {/* Actions */}
            <div className="flex gap-2">
              <Button size="sm" variant="outline" className="flex-1 h-8 text-xs rounded-xl" onClick={onEdit}>
                <Pencil size={12} className="mr-1" /> Modifier
              </Button>
              <Button size="sm" variant="outline"
                className="flex-1 h-8 text-xs rounded-xl text-rose-400 border-rose-500/30 hover:bg-rose-500/10"
                onClick={onDelete}>
                <Trash2 size={12} className="mr-1" /> Supprimer
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal prélèvements */}
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
  )
}

// ─── Page principale ──────────────────────────────────────────────────────────

export default function Vendanges() {
  const [vendanges, setVendanges] = useState<Vendange[]>([])
  const [parcelles, setParcelles] = useState<{ id: string; nom: string }[]>([])
  const [showAdd, setShowAdd] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  useEffect(() => {
    const unsubV = onSnapshot(collection(db, 'vendanges'), snap => {
      setVendanges(snap.docs.map(d => ({ id: d.id, ...d.data() })) as Vendange[])
    })
    const unsubP = onSnapshot(collection(db, 'parcelles'), snap => {
      setParcelles(snap.docs.map(d => ({ id: d.id, nom: (d.data() as { nom: string }).nom })))
    })
    return () => { unsubV(); unsubP() }
  }, [])

  const handleAdd = async (data: typeof defaultVendange) => {
    await addDoc(collection(db, 'vendanges'), { ...data, prelevements: [] })
    setShowAdd(false)
  }

  const handleEdit = async (id: string, data: typeof defaultVendange) => {
    await updateDoc(doc(db, 'vendanges', id), { ...data })
    setEditingId(null)
  }

  const handleDelete = async (id: string) => {
    if (confirm('Supprimer cette vendange ?')) {
      await deleteDoc(doc(db, 'vendanges', id))
    }
  }

  const sorted = [...vendanges].sort((a, b) => b.annee - a.annee)

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pt-2">
        <div>
          <h1 className="text-xl font-bold text-foreground">Vendanges</h1>
          <p className="text-muted-foreground text-sm">{vendanges.length} année(s)</p>
        </div>
        <Button size="sm"
          onClick={() => { setShowAdd(true); setEditingId(null) }}
          className="rounded-xl" style={{ background: '#e3c47d', color: '#000a18' }}>
          <Plus size={16} className="mr-1" /> Ajouter
        </Button>
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
          <div className="rounded-2xl p-8 border border-white/10 flex flex-col items-center gap-2" style={glassCard}>
            <p className="text-muted-foreground text-sm">Aucune vendange enregistrée</p>
            <p className="text-muted-foreground text-xs">Appuie sur "Ajouter" pour commencer</p>
          </div>
        )}

        {sorted.map(v => (
          <div key={v.id}>
            {editingId === v.id ? (
              <VendangeForm
                initial={v}
                onSave={data => handleEdit(v.id, data)}
                onCancel={() => setEditingId(null)}
              />
            ) : (
              <VendangeCard
                vendange={v}
                parcelles={parcelles}
                onEdit={() => { setEditingId(v.id); setShowAdd(false) }}
                onDelete={() => handleDelete(v.id)}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
