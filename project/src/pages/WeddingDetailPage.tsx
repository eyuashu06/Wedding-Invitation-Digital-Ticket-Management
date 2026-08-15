import { useEffect, useRef, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Calendar, Clock, MapPin, Phone, Shirt, Plus, Trash2, Pencil, Save, X,
  ChevronRight, Heart, Users, Mail, QrCode, ExternalLink, BookOpen,
  Image, Upload, Loader2,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Field, Input, Textarea } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import { Gallery } from "@/components/Gallery";
import { InvitationCard } from "@/components/InvitationCard";
import { formatDate, formatTime } from "@/lib/utils";
import { TEMPLATES, type Wedding, type ScheduleItem } from "@/lib/types";

export function WeddingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [wedding, setWedding] = useState<Wedding | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingSchedule, setEditingSchedule] = useState(false);
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [editingStory, setEditingStory] = useState(false);
  const [story, setStory] = useState("");
  const [uploadingCover, setUploadingCover] = useState(false);
  const coverRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function load() {
      if (!id) return;
      const { data } = await supabase.from("weddings").select("*").eq("id", id).maybeSingle();
      if (data) {
        setWedding(data as Wedding);
        setSchedule((data.schedule as ScheduleItem[]) ?? []);
        setStory(data.story ?? "");
      }
      setLoading(false);
    }
    load();
  }, [id]);

  async function updateWedding(patch: Partial<Wedding>) {
    if (!wedding) return;
    await supabase.from("weddings").update({ ...patch, updated_at: new Date().toISOString() }).eq("id", wedding.id);
    setWedding({ ...wedding, ...patch });
  }

  async function saveSchedule() {
    await updateWedding({ schedule: schedule as unknown as Wedding["schedule"] });
    setEditingSchedule(false);
  }

  async function saveStory() {
    await updateWedding({ story });
    setEditingStory(false);
  }

  async function handleCoverUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !user || !wedding) return;
    setUploadingCover(true);
    const ext = file.name.split(".").pop();
    const path = `${user.id}/${wedding.id}/cover.${ext}`;
    await supabase.storage.from("wedding-photos").upload(path, file, { upsert: true });
    const { data } = supabase.storage.from("wedding-photos").getPublicUrl(path);
    await updateWedding({ cover_photo_url: data.publicUrl });
    setUploadingCover(false);
    if (coverRef.current) coverRef.current.value = "";
  }

  if (loading) return <div className="skeleton h-96 rounded-2xl" />;
  if (!wedding) return (
    <div className="py-16 text-center">
      <p className="text-stone-500">Wedding not found.</p>
      <Link to="/weddings"><Button className="mt-4" variant="secondary">Back to Weddings</Button></Link>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-stone-400">
        <Link to="/weddings" className="hover:text-stone-600 dark:hover:text-stone-300">Weddings</Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-stone-600 dark:text-stone-300">{wedding.title || `${wedding.bride_name} & ${wedding.groom_name}`}</span>
      </div>

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold text-stone-900 dark:text-stone-100">{wedding.title || `${wedding.bride_name} & ${wedding.groom_name}`}</h1>
          <p className="mt-1 text-sm text-stone-500">{wedding.bride_name} & {wedding.groom_name}</p>
        </div>
        <Button variant="secondary" onClick={() => setShowPreview(true)}>
          <Mail className="h-4 w-4" /> Preview Invitation
        </Button>
      </div>

      {/* Cover Photo */}
      <Card className="overflow-hidden p-0">
        <div className="relative h-48 w-full overflow-hidden rounded-2xl bg-gradient-to-br from-stone-100 to-stone-200 dark:from-stone-800 dark:to-stone-900 sm:h-64">
          {wedding.cover_photo_url ? (
            <img src={wedding.cover_photo_url} alt="Cover" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center">
              <div className="text-center">
                <Image className="mx-auto h-10 w-10 text-stone-300 dark:text-stone-600" />
                <p className="mt-2 text-sm text-stone-400">No cover photo</p>
              </div>
            </div>
          )}
          <input ref={coverRef} type="file" accept="image/*" className="hidden" onChange={handleCoverUpload} />
          <button
            onClick={() => coverRef.current?.click()}
            disabled={uploadingCover}
            className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-xl bg-black/60 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-sm hover:bg-black/70 disabled:opacity-60"
          >
            {uploadingCover ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
            {uploadingCover ? "Uploading..." : "Change Cover"}
          </button>
        </div>
      </Card>

      {/* Event Details + Template */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <h3 className="font-serif text-lg font-semibold text-stone-900 dark:text-stone-100">Event Details</h3>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <DetailItem icon={Calendar} label="Date" value={formatDate(wedding.date)} />
            <DetailItem icon={Clock} label="Time" value={wedding.start_time ? `${formatTime(wedding.start_time)} – ${formatTime(wedding.end_time)}` : "TBD"} />
            <DetailItem icon={MapPin} label="Venue" value={wedding.venue_name || "TBD"} />
            <DetailItem icon={Shirt} label="Dress Code" value={wedding.dress_code || "Not specified"} />
            <DetailItem icon={Phone} label="Contact" value={(wedding.contact_phones ?? []).join(", ") || "N/A"} />
            <DetailItem icon={MapPin} label="Address" value={wedding.venue_address || "TBD"} />
          </div>
          {wedding.description && (
            <div className="mt-4 border-t border-stone-200 pt-4 dark:border-stone-800">
              <p className="text-sm text-stone-600 dark:text-stone-400">{wedding.description}</p>
            </div>
          )}
          {wedding.maps_url && (
            <a href={wedding.maps_url} target="_blank" rel="noopener noreferrer" className="mt-4 inline-block">
              <Button variant="secondary" size="sm"><ExternalLink className="h-3.5 w-3.5" /> View on Maps</Button>
            </a>
          )}
        </Card>

        {/* Template picker */}
        <Card>
          <h3 className="font-serif text-lg font-semibold text-stone-900 dark:text-stone-100">Invitation Template</h3>
          <p className="mt-1 text-sm text-stone-500">Choose a design for your invitations.</p>
          <div className="mt-4 grid grid-cols-2 gap-2">
            {TEMPLATES.map((t) => (
              <button
                key={t.id}
                onClick={() => updateWedding({ template_id: t.id })}
                title={t.description}
                className={`rounded-xl border-2 p-2.5 text-left transition-all ${
                  wedding.template_id === t.id
                    ? "border-gold-500 bg-gold-50 dark:bg-gold-900/20"
                    : "border-stone-200 hover:border-stone-300 dark:border-stone-700 dark:hover:border-stone-600"
                }`}
              >
                <div className={`mb-1.5 h-10 rounded-lg bg-gradient-to-br ${t.preview}`} />
                <p className="truncate text-xs font-medium text-stone-900 dark:text-stone-100">{t.name}</p>
              </button>
            ))}
          </div>
        </Card>
      </div>

      {/* Story / About Us */}
      <Card>
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-gold-500" />
            <h3 className="font-serif text-lg font-semibold text-stone-900 dark:text-stone-100">Our Story</h3>
          </div>
          {editingStory ? (
            <div className="flex gap-2">
              <Button size="sm" onClick={saveStory}><Save className="h-3.5 w-3.5" /> Save</Button>
              <Button size="sm" variant="secondary" onClick={() => { setEditingStory(false); setStory(wedding.story ?? ""); }}>
                <X className="h-3.5 w-3.5" /> Cancel
              </Button>
            </div>
          ) : (
            <Button size="sm" variant="secondary" onClick={() => setEditingStory(true)}>
              <Pencil className="h-3.5 w-3.5" /> {wedding.story ? "Edit" : "Add Story"}
            </Button>
          )}
        </div>
        {editingStory ? (
          <Textarea
            rows={5}
            value={story}
            onChange={(e) => setStory(e.target.value)}
            placeholder="Tell your love story — how you met, your journey together, and what this day means to you..."
          />
        ) : wedding.story ? (
          <p className="text-sm leading-relaxed text-stone-600 dark:text-stone-400">{wedding.story}</p>
        ) : (
          <p className="text-sm text-stone-400">No story added yet. Click "Add Story" to share your journey.</p>
        )}
      </Card>

      {/* Schedule */}
      <Card>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-serif text-lg font-semibold text-stone-900 dark:text-stone-100">Event Schedule</h3>
          {editingSchedule ? (
            <div className="flex gap-2">
              <Button size="sm" onClick={saveSchedule}><Save className="h-3.5 w-3.5" /> Save</Button>
              <Button size="sm" variant="secondary" onClick={() => setEditingSchedule(false)}><X className="h-3.5 w-3.5" /> Cancel</Button>
            </div>
          ) : (
            <Button size="sm" variant="secondary" onClick={() => setEditingSchedule(true)}>
              <Pencil className="h-3.5 w-3.5" /> Edit
            </Button>
          )}
        </div>
        {editingSchedule ? (
          <div className="space-y-3">
            {schedule.map((item, i) => (
              <div key={i} className="flex gap-2">
                <Input value={item.time} onChange={(e) => setSchedule((s) => s.map((x, idx) => idx === i ? { ...x, time: e.target.value } : x))} placeholder="4:00 PM" className="w-32" />
                <Input value={item.label} onChange={(e) => setSchedule((s) => s.map((x, idx) => idx === i ? { ...x, label: e.target.value } : x))} placeholder="Ceremony begins" className="flex-1" />
                <button onClick={() => setSchedule((s) => s.filter((_, idx) => idx !== i))} className="rounded-lg p-2 text-stone-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/30">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
            <Button size="sm" variant="secondary" onClick={() => setSchedule((s) => [...s, { time: "", label: "" }])}>
              <Plus className="h-3.5 w-3.5" /> Add Item
            </Button>
          </div>
        ) : schedule.length > 0 ? (
          <div className="space-y-3">
            {schedule.map((item, i) => (
              <div key={i} className="flex items-center gap-3 border-l-2 border-gold-300 pl-4 dark:border-gold-700">
                <span className="w-24 text-sm font-medium text-gold-700 dark:text-gold-400">{item.time}</span>
                <span className="text-sm text-stone-600 dark:text-stone-400">{item.label}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-stone-400">No schedule items yet. Click Edit to add some.</p>
        )}
      </Card>

      {/* Gallery */}
      <Card>
        <div className="mb-4 flex items-center gap-2">
          <Image className="h-5 w-5 text-gold-500" />
          <h3 className="font-serif text-lg font-semibold text-stone-900 dark:text-stone-100">Photo Gallery</h3>
        </div>
        <Gallery weddingId={wedding.id} editable />
      </Card>

      {/* Quick links */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Link to="/guests" className="block">
          <Card className="flex items-center gap-3 transition-shadow hover:shadow-md">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"><Users className="h-5 w-5" /></div>
            <div><p className="font-medium text-stone-900 dark:text-stone-100">Manage Guests</p><p className="text-xs text-stone-500">Add, import, categorize</p></div>
          </Card>
        </Link>
        <Link to="/invitations" className="block">
          <Card className="flex items-center gap-3 transition-shadow hover:shadow-md">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gold-50 text-gold-600 dark:bg-gold-900/30 dark:text-gold-400"><Mail className="h-5 w-5" /></div>
            <div><p className="font-medium text-stone-900 dark:text-stone-100">Invitations</p><p className="text-xs text-stone-500">Send & track invites</p></div>
          </Card>
        </Link>
        <Link to="/check-in" className="block">
          <Card className="flex items-center gap-3 transition-shadow hover:shadow-md">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400"><QrCode className="h-5 w-5" /></div>
            <div><p className="font-medium text-stone-900 dark:text-stone-100">Check-In</p><p className="text-xs text-stone-500">Scan guest QR codes</p></div>
          </Card>
        </Link>
      </div>

      {/* Preview modal */}
      {showPreview && (
        <Modal open onClose={() => setShowPreview(false)} title="Invitation Preview" size="lg">
          <InvitationCard wedding={wedding} guestName="Guest Name" ticketId="PREVIEW-TICKET" showStory />
        </Modal>
      )}
    </div>
  );
}

function DetailItem({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-lg bg-stone-100 text-stone-500 dark:bg-stone-800 dark:text-stone-400">
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <p className="text-xs font-medium text-stone-400">{label}</p>
        <p className="text-sm text-stone-900 dark:text-stone-100">{value}</p>
      </div>
    </div>
  );
}
