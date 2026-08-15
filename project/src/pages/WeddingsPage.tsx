import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Heart, Plus, Calendar, MapPin, Users, Pencil, Trash2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Field, Input, Textarea } from "@/components/ui/Field";
import { formatDate } from "@/lib/utils";
import type { Wedding } from "@/lib/types";

export function WeddingsPage() {
  const { user } = useAuth();
  const [weddings, setWeddings] = useState<Wedding[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Wedding | null>(null);
  const [guestCounts, setGuestCounts] = useState<Record<string, number>>({});

  useEffect(() => { loadWeddings(); }, [user]);

  async function loadWeddings() {
    if (!user) return;
    const { data } = await supabase.from("weddings").select("*").eq("organizer_id", user.id).order("created_at", { ascending: false });
    setWeddings(data ?? []);
    if (data && data.length > 0) {
      const counts: Record<string, number> = {};
      for (const w of data) {
        const { count } = await supabase.from("guests").select("*", { count: "exact", head: true }).eq("wedding_id", w.id);
        counts[w.id] = count ?? 0;
      }
      setGuestCounts(counts);
    }
    setLoading(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this wedding and all its guests? This cannot be undone.")) return;
    await supabase.from("weddings").delete().eq("id", id);
    loadWeddings();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold text-stone-900 dark:text-stone-100">Weddings</h1>
          <p className="mt-1 text-sm text-stone-500">Create and manage your wedding events.</p>
        </div>
        <Button onClick={() => { setEditing(null); setShowForm(true); }}>
          <Plus className="h-4 w-4" /> New Wedding
        </Button>
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => <div key={i} className="skeleton h-52 rounded-2xl" />)}
        </div>
      ) : weddings.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-16 text-center">
          <Heart className="h-12 w-12 text-stone-300 dark:text-stone-600" />
          <p className="mt-4 text-lg font-medium text-stone-600 dark:text-stone-300">No weddings yet</p>
          <p className="mt-1 text-sm text-stone-400">Create your first wedding event to get started.</p>
          <Button className="mt-6" onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4" /> Create Wedding
          </Button>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {weddings.map((w, i) => (
            <motion.div key={w.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <Card className="group flex h-full flex-col transition-shadow hover:shadow-md">
                <div className="mb-4 flex items-start justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gold-50 text-gold-600 dark:bg-gold-900/30 dark:text-gold-400">
                    <Heart className="h-6 w-6" fill="currentColor" />
                  </div>
                  <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                    <button onClick={() => { setEditing(w); setShowForm(true); }} className="rounded-lg p-2 text-stone-400 hover:bg-stone-100 hover:text-stone-600 dark:hover:bg-stone-800">
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button onClick={() => handleDelete(w.id)} className="rounded-lg p-2 text-stone-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/30">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <Link to={`/weddings/${w.id}`} className="flex-1">
                  <h3 className="font-serif text-lg font-semibold text-stone-900 dark:text-stone-100">{w.title || `${w.bride_name} & ${w.groom_name}`}</h3>
                  <p className="mt-1 text-sm text-stone-500">{w.bride_name} & {w.groom_name}</p>
                  <div className="mt-4 space-y-2 text-sm text-stone-500">
                    <div className="flex items-center gap-2"><Calendar className="h-4 w-4 shrink-0" />{formatDate(w.date)}</div>
                    {w.venue_name && <div className="flex items-center gap-2"><MapPin className="h-4 w-4 shrink-0" />{w.venue_name}</div>}
                    <div className="flex items-center gap-2"><Users className="h-4 w-4 shrink-0" />{guestCounts[w.id] ?? 0} guests</div>
                  </div>
                </Link>
                <Link to={`/weddings/${w.id}`} className="mt-4">
                  <Button variant="secondary" size="sm" className="w-full">View Details</Button>
                </Link>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {showForm && (
        <WeddingFormModal wedding={editing} onClose={() => setShowForm(false)} onSaved={() => { setShowForm(false); loadWeddings(); }} />
      )}
    </div>
  );
}

function WeddingFormModal({ wedding, onClose, onSaved }: { wedding: Wedding | null; onClose: () => void; onSaved: () => void }) {
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    bride_name: wedding?.bride_name ?? "",
    groom_name: wedding?.groom_name ?? "",
    title: wedding?.title ?? "",
    description: wedding?.description ?? "",
    story: wedding?.story ?? "",
    date: wedding?.date ?? "",
    start_time: wedding?.start_time ?? "",
    end_time: wedding?.end_time ?? "",
    venue_name: wedding?.venue_name ?? "",
    venue_address: wedding?.venue_address ?? "",
    maps_url: wedding?.maps_url ?? "",
    dress_code: wedding?.dress_code ?? "",
    contact_phones: (wedding?.contact_phones ?? []).join(", "),
  });

  const update = (key: string, val: string) => setForm((f) => ({ ...f, [key]: val }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setSaving(true);

    const payload = {
      organizer_id: user.id,
      bride_name: form.bride_name,
      groom_name: form.groom_name,
      title: form.title || `${form.bride_name} & ${form.groom_name}`,
      description: form.description,
      story: form.story,
      date: form.date || null,
      start_time: form.start_time || null,
      end_time: form.end_time || null,
      venue_name: form.venue_name,
      venue_address: form.venue_address,
      maps_url: form.maps_url,
      dress_code: form.dress_code,
      contact_phones: form.contact_phones.split(",").map((p) => p.trim()).filter(Boolean),
      updated_at: new Date().toISOString(),
    };

    if (wedding) {
      await supabase.from("weddings").update(payload).eq("id", wedding.id);
    } else {
      await supabase.from("weddings").insert(payload);
    }

    setSaving(false);
    onSaved();
  }

  return (
    <Modal open onClose={onClose} title={wedding ? "Edit Wedding" : "New Wedding"} size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Bride's Full Name"><Input required value={form.bride_name} onChange={(e) => update("bride_name", e.target.value)} placeholder="Jane Marie" /></Field>
          <Field label="Groom's Full Name"><Input required value={form.groom_name} onChange={(e) => update("groom_name", e.target.value)} placeholder="John Edward" /></Field>
        </div>
        <Field label="Wedding Title" hint="Leave blank to auto-generate from names"><Input value={form.title} onChange={(e) => update("title", e.target.value)} placeholder="Jane & John's Wedding" /></Field>
        <Field label="Description"><Textarea rows={2} value={form.description} onChange={(e) => update("description", e.target.value)} placeholder="A celebration of love..." /></Field>
        <Field label="Our Story" hint="Optional — share how you met and your journey together"><Textarea rows={3} value={form.story} onChange={(e) => update("story", e.target.value)} placeholder="We met in the summer of..." /></Field>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Wedding Date"><Input type="date" value={form.date} onChange={(e) => update("date", e.target.value)} /></Field>
          <Field label="Start Time"><Input type="time" value={form.start_time} onChange={(e) => update("start_time", e.target.value)} /></Field>
          <Field label="End Time"><Input type="time" value={form.end_time} onChange={(e) => update("end_time", e.target.value)} /></Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Venue Name"><Input value={form.venue_name} onChange={(e) => update("venue_name", e.target.value)} placeholder="Grand Ballroom Hotel" /></Field>
          <Field label="Venue Address"><Input value={form.venue_address} onChange={(e) => update("venue_address", e.target.value)} placeholder="123 Main St, City" /></Field>
        </div>
        <Field label="Google Maps URL"><Input value={form.maps_url} onChange={(e) => update("maps_url", e.target.value)} placeholder="https://maps.google.com/..." /></Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Contact Phones" hint="Comma-separated"><Input value={form.contact_phones} onChange={(e) => update("contact_phones", e.target.value)} placeholder="+1 555-0100, +1 555-0200" /></Field>
          <Field label="Dress Code"><Input value={form.dress_code} onChange={(e) => update("dress_code", e.target.value)} placeholder="Black tie / Formal" /></Field>
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={saving}>{saving ? "Saving..." : "Save Wedding"}</Button>
        </div>
      </form>
    </Modal>
  );
}
