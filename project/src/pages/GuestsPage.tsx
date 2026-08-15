import { useEffect, useState, useMemo, type ChangeEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, Plus, Search, Upload, Pencil, Trash2, FileSpreadsheet, Download, CheckSquare, Square, X } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { Field, Input, Textarea, Select } from "@/components/ui/Field";
import { useToast } from "@/components/ui/Toast";
import { CATEGORY_LABELS, CATEGORY_COLORS, STATUS_LABELS, STATUS_COLORS, type Guest, type GuestCategory, type AttendanceStatus, type Wedding } from "@/lib/types";
import { generateTicketId } from "@/lib/utils";

export function GuestsPage() {
  const { user } = useAuth();
  const toast = useToast();
  const [weddings, setWeddings] = useState<Wedding[]>([]);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Guest | null>(null);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [weddingFilter, setWeddingFilter] = useState("all");
  const [showImport, setShowImport] = useState(false);

  // Bulk Selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkCategory, setBulkCategory] = useState<string>("");
  const [bulkStatus, setBulkStatus] = useState<string>("");
  const [bulkLoading, setBulkLoading] = useState(false);

  useEffect(() => { loadData(); }, [user]);

  async function loadData() {
    if (!user) return;
    const { data: w } = await supabase.from("weddings").select("*").eq("organizer_id", user.id).order("created_at", { ascending: false });
    setWeddings(w ?? []);
    if (w && w.length > 0) {
      const ids = w.map((x) => x.id);
      const { data: g } = await supabase.from("guests").select("*").in("wedding_id", ids).order("created_at", { ascending: false });
      setGuests(g ?? []);
    }
    setLoading(false);
  }

  const filtered = useMemo(() => {
    return guests.filter((g) => {
      if (categoryFilter !== "all" && g.category !== categoryFilter) return false;
      if (weddingFilter !== "all" && g.wedding_id !== weddingFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          (g.full_name ?? "").toLowerCase().includes(q) ||
          (g.email ?? "").toLowerCase().includes(q) ||
          (g.phone ?? "").includes(q)
        );
      }
      return true;
    });
  }, [guests, search, categoryFilter, weddingFilter]);

  const weddingName = (id: string) => weddings.find((w) => w.id === id)?.title ?? "Unknown";

  // Selection handlers
  const allSelected = filtered.length > 0 && selectedIds.size === filtered.length;
  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map((g) => g.id)));
    }
  };

  const toggleSelectRow = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  // Single Delete
  async function handleDelete(id: string) {
    if (!confirm("Remove this guest?")) return;
    const { error } = await supabase.from("guests").delete().eq("id", id);
    if (error) {
      toast.error("Failed to remove guest", error.message);
    } else {
      toast.success("Guest removed");
      setGuests((g) => g.filter((x) => x.id !== id));
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  }

  // Bulk Operations
  async function handleBulkDelete() {
    if (!confirm(`Delete ${selectedIds.size} selected guest(s)?`)) return;
    setBulkLoading(true);
    const ids = Array.from(selectedIds);
    const { error } = await supabase.from("guests").delete().in("id", ids);
    setBulkLoading(false);
    if (error) {
      toast.error("Bulk delete failed", error.message);
    } else {
      toast.success(`Removed ${ids.length} guest(s)`);
      setGuests((prev) => prev.filter((g) => !selectedIds.has(g.id)));
      setSelectedIds(new Set());
    }
  }

  async function handleBulkCategoryUpdate(cat: GuestCategory) {
    if (!cat) return;
    setBulkLoading(true);
    const ids = Array.from(selectedIds);
    const { error } = await supabase.from("guests").update({ category: cat }).in("id", ids);
    setBulkLoading(false);
    if (error) {
      toast.error("Bulk category update failed", error.message);
    } else {
      toast.success(`Updated category for ${ids.length} guest(s)`);
      setGuests((prev) => prev.map((g) => selectedIds.has(g.id) ? { ...g, category: cat } : g));
      setBulkCategory("");
    }
  }

  async function handleBulkStatusUpdate(st: AttendanceStatus) {
    if (!st) return;
    setBulkLoading(true);
    const ids = Array.from(selectedIds);
    const { error } = await supabase.from("guests").update({ attendance_status: st }).in("id", ids);
    setBulkLoading(false);
    if (error) {
      toast.error("Bulk status update failed", error.message);
    } else {
      toast.success(`Updated status for ${ids.length} guest(s)`);
      setGuests((prev) => prev.map((g) => selectedIds.has(g.id) ? { ...g, attendance_status: st } : g));
      setBulkStatus("");
    }
  }

  // Export CSV
  function handleExportCsv() {
    if (filtered.length === 0) return;
    const headers = ["Full Name", "Wedding", "Email", "Phone", "Category", "Status", "Accompanying", "Ticket ID", "Notes"];
    const rows = filtered.map((g) => [
      `"${(g.full_name ?? "").replace(/"/g, '""')}"`,
      `"${(weddingName(g.wedding_id) ?? "").replace(/"/g, '""')}"`,
      `"${(g.email ?? "").replace(/"/g, '""')}"`,
      `"${(g.phone ?? "").replace(/"/g, '""')}"`,
      `"${g.category}"`,
      `"${g.attendance_status}"`,
      g.accompanying_persons || 0,
      `"${g.ticket_id}"`,
      `"${(g.notes ?? "").replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `wedding-guests-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Guest list exported to CSV");
  }

  if (loading) {
    return <div className="space-y-4">
      <div className="skeleton h-8 w-48 rounded-lg" />
      <div className="skeleton h-16 rounded-2xl" />
      <div className="skeleton h-96 rounded-2xl" />
    </div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold text-stone-900 dark:text-stone-100">Guests</h1>
          <p className="mt-1 text-sm text-stone-500">{guests.length} total guests across {weddings.length} weddings.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={handleExportCsv} disabled={filtered.length === 0}>
            <Download className="h-4 w-4" /> Export CSV
          </Button>
          <Button variant="secondary" onClick={() => setShowImport(true)} disabled={weddings.length === 0}>
            <Upload className="h-4 w-4" /> Import CSV
          </Button>
          <Button onClick={() => { setEditing(null); setShowForm(true); }} disabled={weddings.length === 0}>
            <Plus className="h-4 w-4" /> Add Guest
          </Button>
        </div>
      </div>

      {weddings.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-16 text-center">
          <Users className="h-12 w-12 text-stone-300 dark:text-stone-600" />
          <p className="mt-4 text-lg font-medium text-stone-600 dark:text-stone-300">No weddings yet</p>
          <p className="mt-1 text-sm text-stone-400">Create a wedding first before adding guests.</p>
        </Card>
      ) : (
        <>
          <Card className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name, email, or phone..." className="pl-10" />
            </div>
            <Select value={weddingFilter} onChange={(e) => setWeddingFilter(e.target.value)} className="sm:w-48">
              <option value="all">All Weddings</option>
              {weddings.map((w) => <option key={w.id} value={w.id}>{w.title || `${w.bride_name} & ${w.groom_name}`}</option>)}
            </Select>
            <Select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="sm:w-40">
              <option value="all">All Categories</option>
              {Object.entries(CATEGORY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </Select>
          </Card>

          {/* Bulk Action Bar */}
          <AnimatePresence>
            {selectedIds.size > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-gold-200 bg-gold-50/90 p-4 backdrop-blur dark:border-gold-800 dark:bg-gold-900/30"
              >
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gold-600 font-mono text-xs font-bold text-white">
                    {selectedIds.size}
                  </span>
                  <span className="text-sm font-medium text-stone-800 dark:text-stone-200">Selected</span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Select
                    value={bulkCategory}
                    onChange={(e) => {
                      setBulkCategory(e.target.value);
                      if (e.target.value) handleBulkCategoryUpdate(e.target.value as GuestCategory);
                    }}
                    disabled={bulkLoading}
                    className="h-9 py-1 text-xs sm:w-36"
                  >
                    <option value="">Set Category...</option>
                    {Object.entries(CATEGORY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </Select>

                  <Select
                    value={bulkStatus}
                    onChange={(e) => {
                      setBulkStatus(e.target.value);
                      if (e.target.value) handleBulkStatusUpdate(e.target.value as AttendanceStatus);
                    }}
                    disabled={bulkLoading}
                    className="h-9 py-1 text-xs sm:w-36"
                  >
                    <option value="">Set Status...</option>
                    {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </Select>

                  <Button variant="danger" size="sm" onClick={handleBulkDelete} disabled={bulkLoading}>
                    <Trash2 className="h-3.5 w-3.5" /> Bulk Delete
                  </Button>
                  <button
                    onClick={() => setSelectedIds(new Set())}
                    className="rounded-lg p-1.5 text-stone-400 hover:bg-stone-200/50 dark:hover:bg-stone-800"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {filtered.length === 0 ? (
            <Card className="py-12 text-center">
              <p className="text-sm text-stone-400">No guests found. Try adjusting your filters or add a new guest.</p>
            </Card>
          ) : (
            <Card className="overflow-hidden p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-stone-200 bg-stone-50 dark:border-stone-800 dark:bg-stone-800/50">
                      <th className="w-10 px-4 py-3 text-center">
                        <button onClick={toggleSelectAll} className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200">
                          {allSelected ? <CheckSquare className="h-4 w-4 text-gold-600 dark:text-gold-400" /> : <Square className="h-4 w-4" />}
                        </button>
                      </th>
                      <th className="px-4 py-3 text-left font-medium text-stone-500">Name</th>
                      <th className="hidden px-4 py-3 text-left font-medium text-stone-500 md:table-cell">Wedding</th>
                      <th className="hidden px-4 py-3 text-left font-medium text-stone-500 lg:table-cell">Contact</th>
                      <th className="px-4 py-3 text-left font-medium text-stone-500">Category</th>
                      <th className="px-4 py-3 text-left font-medium text-stone-500">Status</th>
                      <th className="px-4 py-3 text-right font-medium text-stone-500">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((g, i) => {
                      const isSelected = selectedIds.has(g.id);
                      return (
                        <motion.tr
                          key={g.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: Math.min(i * 0.02, 0.3) }}
                          className={`border-b border-stone-100 transition-colors dark:border-stone-800/50 ${
                            isSelected ? "bg-gold-50/50 dark:bg-gold-900/20" : "hover:bg-stone-50 dark:hover:bg-stone-800/30"
                          }`}
                        >
                          <td className="px-4 py-3 text-center">
                            <button onClick={() => toggleSelectRow(g.id)} className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200">
                              {isSelected ? <CheckSquare className="h-4 w-4 text-gold-600 dark:text-gold-400" /> : <Square className="h-4 w-4" />}
                            </button>
                          </td>
                          <td className="px-4 py-3">
                            <p className="font-medium text-stone-900 dark:text-stone-100">{g.full_name}</p>
                            {g.accompanying_persons > 0 && <p className="text-xs text-stone-400">+{g.accompanying_persons} accompanying</p>}
                          </td>
                          <td className="hidden px-4 py-3 text-stone-500 md:table-cell">{weddingName(g.wedding_id)}</td>
                          <td className="hidden px-4 py-3 text-stone-500 lg:table-cell">
                            <p>{g.email}</p><p className="text-xs">{g.phone}</p>
                          </td>
                          <td className="px-4 py-3"><Badge className={CATEGORY_COLORS[g.category]}>{CATEGORY_LABELS[g.category]}</Badge></td>
                          <td className="px-4 py-3"><Badge className={STATUS_COLORS[g.attendance_status]}>{STATUS_LABELS[g.attendance_status]}</Badge></td>
                          <td className="px-4 py-3">
                            <div className="flex justify-end gap-1">
                              <button onClick={() => { setEditing(g); setShowForm(true); }} className="rounded-lg p-1.5 text-stone-400 hover:bg-stone-100 hover:text-stone-600 dark:hover:bg-stone-800"><Pencil className="h-4 w-4" /></button>
                              <button onClick={() => handleDelete(g.id)} className="rounded-lg p-1.5 text-stone-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/30"><Trash2 className="h-4 w-4" /></button>
                            </div>
                          </td>
                        </motion.tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </>
      )}

      {showForm && (
        <GuestFormModal guest={editing} weddings={weddings} onClose={() => setShowForm(false)} onSaved={() => { setShowForm(false); loadData(); }} />
      )}

      {showImport && (
        <ImportModal weddings={weddings} onClose={() => setShowImport(false)} onImported={() => { setShowImport(false); loadData(); }} />
      )}
    </div>
  );
}

function GuestFormModal({ guest, weddings, onClose, onSaved }: { guest: Guest | null; weddings: Wedding[]; onClose: () => void; onSaved: () => void }) {
  const toast = useToast();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    full_name: guest?.full_name ?? "",
    email: guest?.email ?? "",
    phone: guest?.phone ?? "",
    category: guest?.category ?? "others",
    accompanying_persons: guest?.accompanying_persons ?? 0,
    notes: guest?.notes ?? "",
    wedding_id: guest?.wedding_id ?? weddings[0]?.id ?? "",
  });

  const update = (key: string, val: string | number) => setForm((f) => ({ ...f, [key]: val }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const payload = {
      full_name: form.full_name, email: form.email, phone: form.phone,
      category: form.category, accompanying_persons: Number(form.accompanying_persons),
      notes: form.notes, wedding_id: form.wedding_id,
    };
    let error;
    if (guest) {
      ({ error } = await supabase.from("guests").update(payload).eq("id", guest.id));
    } else {
      ({ error } = await supabase.from("guests").insert({ ...payload, ticket_id: generateTicketId() }));
    }
    setSaving(false);
    if (error) {
      toast.error("Failed to save guest", error.message);
    } else {
      toast.success(guest ? "Guest updated successfully" : "Guest created successfully");
      onSaved();
    }
  }

  return (
    <Modal open onClose={onClose} title={guest ? "Edit Guest" : "Add Guest"} size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Full Name"><Input required value={form.full_name} onChange={(e) => update("full_name", e.target.value)} placeholder="John Smith" /></Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Email"><Input type="email" value={form.email} onChange={(e) => update("email", e.target.value)} placeholder="john@example.com" /></Field>
          <Field label="Phone"><Input value={form.phone} onChange={(e) => update("phone", e.target.value)} placeholder="+1 555-0100" /></Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Category">
            <Select value={form.category} onChange={(e) => update("category", e.target.value)}>
              {Object.entries(CATEGORY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </Select>
          </Field>
          <Field label="Accompanying Persons"><Input type="number" min={0} value={form.accompanying_persons} onChange={(e) => update("accompanying_persons", e.target.value)} /></Field>
        </div>
        <Field label="Wedding">
          <Select value={form.wedding_id} onChange={(e) => update("wedding_id", e.target.value)}>
            {weddings.map((w) => <option key={w.id} value={w.id}>{w.title || `${w.bride_name} & ${w.groom_name}`}</option>)}
          </Select>
        </Field>
        <Field label="Notes"><Textarea rows={2} value={form.notes} onChange={(e) => update("notes", e.target.value)} placeholder="Dietary restrictions, special needs..." /></Field>
        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={saving}>{saving ? "Saving..." : "Save Guest"}</Button>
        </div>
      </form>
    </Modal>
  );
}

function ImportModal({ weddings, onClose, onImported }: { weddings: Wedding[]; onClose: () => void; onImported: () => void }) {
  const toast = useToast();
  const [csvText, setCsvText] = useState("");
  const [weddingId, setWeddingId] = useState(weddings[0]?.id ?? "");
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const handleFile = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setCsvText(reader.result as string);
    reader.readAsText(file);
  };

  const handleImport = async () => {
    if (!csvText || !weddingId) return;
    setImporting(true);
    const lines = csvText.trim().split("\n");
    const headers = lines[0].toLowerCase().split(",").map((h) => h.trim());
    const rows = lines.slice(1);

    const guests = rows.map((line) => {
      const values = line.split(",").map((v) => v.trim());
      const obj: Record<string, string> = {};
      headers.forEach((h, i) => { obj[h] = values[i] ?? ""; });
      return {
        wedding_id: weddingId,
        full_name: obj.full_name || obj.name || "",
        email: obj.email || "",
        phone: obj.phone || obj.phone_number || "",
        category: (obj.category || "others").toLowerCase() as GuestCategory,
        accompanying_persons: parseInt(obj.accompanying_persons || obj.accompanying || "0", 10) || 0,
        notes: obj.notes || "",
        ticket_id: generateTicketId(),
      };
    }).filter((g) => g.full_name);

    const { data, error } = await supabase.from("guests").insert(guests).select();
    setImporting(false);
    if (error) {
      setResult(`Error: ${error.message}`);
      toast.error("Import failed", error.message);
    } else {
      const count = data?.length ?? guests.length;
      setResult(`Successfully imported ${count} guests.`);
      toast.success(`Imported ${count} guests`);
      setTimeout(onImported, 1200);
    }
  };

  return (
    <Modal open onClose={onClose} title="Import Guests from CSV" size="md">
      <div className="space-y-4">
        <Field label="Select Wedding">
          <Select value={weddingId} onChange={(e) => setWeddingId(e.target.value)}>
            {weddings.map((w) => <option key={w.id} value={w.id}>{w.title || `${w.bride_name} & ${w.groom_name}`}</option>)}
          </Select>
        </Field>
        <div className="rounded-xl border-2 border-dashed border-stone-300 p-6 dark:border-stone-700">
          <FileSpreadsheet className="mx-auto h-10 w-10 text-stone-400" />
          <p className="mt-3 text-center text-sm text-stone-500">Upload a CSV file or paste data below</p>
          <input type="file" accept=".csv" onChange={handleFile} className="mt-3 block w-full text-sm text-stone-500 file:mr-3 file:rounded-lg file:border-0 file:bg-gold-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-gold-700 hover:file:bg-gold-100 dark:file:bg-gold-900/30 dark:file:text-gold-300" />
        </div>
        <Field label="Or paste CSV data" hint="Headers: full_name, email, phone, category, accompanying_persons, notes">
          <Textarea rows={5} value={csvText} onChange={(e) => setCsvText(e.target.value)} placeholder="full_name,email,phone,category&#10;John Smith,john@example.com,+1 555-0100,family" />
        </Field>
        {result && <div className="rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-stone-700 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-300">{result}</div>}
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={handleImport} disabled={importing || !csvText || !weddingId}>{importing ? "Importing..." : "Import Guests"}</Button>
        </div>
      </div>
    </Modal>
  );
}
