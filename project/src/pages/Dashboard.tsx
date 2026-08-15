import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Heart, Users, CheckCircle2, Clock, Mail, TrendingUp, Calendar, ArrowRight,
  Download, QrCode, ChevronDown, ChevronUp, Loader2,
} from "lucide-react";
import QRCode from "qrcode";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { InvitationCard } from "@/components/InvitationCard";
import { WhatsAppShareButton, TelegramShareButton, EmailShareButton, CopyLinkButton, NativeShareButton, exportCardAsPng } from "@/components/ShareButtons";
import { formatDate } from "@/lib/utils";
import { STATUS_COLORS, STATUS_LABELS, CATEGORY_COLORS, CATEGORY_LABELS } from "@/lib/types";
import type { Wedding, Guest, AppNotification } from "@/lib/types";

const RSVP_COLORS = {
  confirmed: "#16a34a",
  declined: "#dc2626",
  maybe: "#d97706",
  pending: "#78716c",
  checked_in: "#4f46e5",
};

/* ─────────────────────────────────────────────────
   RSVP Animated Donut Chart
───────────────────────────────────────────────── */

const RSVP_META: Record<string, { label: string; color: string; bg: string; text: string }> = {
  Confirmed:    { label: "Confirmed",  color: "#16a34a", bg: "bg-green-100 dark:bg-green-900/40",   text: "text-green-700 dark:text-green-300"   },
  Pending:      { label: "Pending",    color: "#78716c", bg: "bg-stone-100 dark:bg-stone-800",       text: "text-stone-600 dark:text-stone-300"   },
  Maybe:        { label: "Maybe",      color: "#d97706", bg: "bg-amber-100 dark:bg-amber-900/40",    text: "text-amber-700 dark:text-amber-300"   },
  Declined:     { label: "Declined",   color: "#dc2626", bg: "bg-red-100 dark:bg-red-900/40",        text: "text-red-700 dark:text-red-300"       },
  "Checked In": { label: "Checked In", color: "#4f46e5", bg: "bg-indigo-100 dark:bg-indigo-900/40", text: "text-indigo-700 dark:text-indigo-300"  },
};

function RsvpDonutChart({ data, total }: { data: { name: string; value: number; color: string }[]; total: number }) {
  const size = 200;
  const stroke = 28;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const cx = size / 2;
  const cy = size / 2;

  const arcs: { name: string; value: number; color: string; offset: number; dash: number }[] = [];
  let accumulated = 0;
  for (const d of data) {
    const pct = d.value / total;
    arcs.push({ ...d, offset: circ * (1 - accumulated), dash: circ * pct });
    accumulated += pct;
  }

  const [hovered, setHovered] = useState<string | null>(null);
  const hoveredItem = hovered ? data.find((d) => d.name === hovered) : null;

  return (
    <div className="mt-5 flex flex-col items-center gap-5 sm:flex-row sm:items-center sm:gap-8">
      {/* SVG Donut */}
      <div className="relative shrink-0">
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="currentColor" strokeWidth={stroke}
            className="text-stone-100 dark:text-stone-800" />
          {arcs.map((arc, i) => (
            <motion.circle
              key={arc.name}
              cx={cx} cy={cy} r={r}
              fill="none"
              stroke={arc.color}
              strokeWidth={hovered === arc.name ? stroke + 5 : stroke}
              strokeDasharray={`${arc.dash} ${circ}`}
              strokeDashoffset={arc.offset}
              strokeLinecap="round"
              initial={{ strokeDasharray: `0 ${circ}`, strokeDashoffset: arc.offset }}
              animate={{ strokeDasharray: `${arc.dash} ${circ}`, strokeDashoffset: arc.offset }}
              transition={{ duration: 0.8, delay: i * 0.1, ease: "easeOut" }}
              style={{
                filter: hovered === arc.name ? `drop-shadow(0 0 6px ${arc.color}80)` : "none",
                cursor: "pointer",
                transition: "stroke-width 0.2s, filter 0.2s",
              }}
              onMouseEnter={() => setHovered(arc.name)}
              onMouseLeave={() => setHovered(null)}
            />
          ))}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {hoveredItem ? (
            <>
              <motion.p key={hoveredItem.name + "-val"} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
                className="text-2xl font-bold text-stone-900 dark:text-stone-100">{hoveredItem.value}</motion.p>
              <motion.p key={hoveredItem.name + "-lbl"} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="text-xs font-medium text-stone-500">{hoveredItem.name}</motion.p>
            </>
          ) : (
            <>
              <p className="text-3xl font-bold text-stone-900 dark:text-stone-100">{total}</p>
              <p className="text-xs font-medium text-stone-500">total</p>
            </>
          )}
        </div>
      </div>

      {/* Legend pills */}
      <div className="flex w-full flex-col gap-2 sm:w-auto">
        {data.map((d) => {
          const meta = RSVP_META[d.name] ?? { bg: "bg-stone-100", text: "text-stone-700" };
          const pct = total > 0 ? Math.round((d.value / total) * 100) : 0;
          return (
            <motion.button
              key={d.name}
              whileHover={{ scale: 1.02 }}
              onMouseEnter={() => setHovered(d.name)}
              onMouseLeave={() => setHovered(null)}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-all ${
                hovered === d.name ? meta.bg : "bg-stone-50 dark:bg-stone-800/50"
              }`}
            >
              <span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: d.color }} />
              <span className={`flex-1 text-sm font-medium ${meta.text}`}>{d.name}</span>
              <span className="font-mono text-sm font-bold text-stone-700 dark:text-stone-200">{d.value}</span>
              <span className="w-9 text-right font-mono text-xs text-stone-400">{pct}%</span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────
   Guest Category Horizontal Bar Chart
───────────────────────────────────────────────── */

const CATEGORY_META: Record<string, { gradient: string; pill: string; text: string }> = {
  Family:     { gradient: "from-rose-400 to-rose-600",     pill: "bg-rose-100 dark:bg-rose-900/40",     text: "text-rose-700 dark:text-rose-300"    },
  Friends:    { gradient: "from-blue-400 to-blue-600",     pill: "bg-blue-100 dark:bg-blue-900/40",     text: "text-blue-700 dark:text-blue-300"    },
  Partners:   { gradient: "from-purple-400 to-purple-600", pill: "bg-purple-100 dark:bg-purple-900/40", text: "text-purple-700 dark:text-purple-300" },
  Colleagues: { gradient: "from-teal-400 to-teal-600",     pill: "bg-teal-100 dark:bg-teal-900/40",     text: "text-teal-700 dark:text-teal-300"    },
  Vip:        { gradient: "from-amber-400 to-yellow-500",  pill: "bg-amber-100 dark:bg-amber-900/40",   text: "text-amber-700 dark:text-amber-300"  },
  Others:     { gradient: "from-stone-400 to-stone-500",   pill: "bg-stone-100 dark:bg-stone-800",       text: "text-stone-600 dark:text-stone-300"  },
};

function GuestCategoryChart({ data, total }: { data: { name: string; count: number }[]; total: number }) {
  const max = Math.max(...data.map((d) => d.count));
  const [hovered, setHovered] = useState<string | null>(null);

  return (
    <div className="mt-5 space-y-3">
      {data.map((d, i) => {
        const pct = max > 0 ? (d.count / max) * 100 : 0;
        const sharePct = total > 0 ? Math.round((d.count / total) * 100) : 0;
        const meta = CATEGORY_META[d.name] ?? CATEGORY_META.Others;
        const isHov = hovered === d.name;

        return (
          <motion.div
            key={d.name}
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: i * 0.07 }}
            onMouseEnter={() => setHovered(d.name)}
            onMouseLeave={() => setHovered(null)}
            className={`rounded-xl p-3 transition-colors ${
              isHov ? meta.pill : "hover:bg-stone-50 dark:hover:bg-stone-800/40"
            }`}
          >
            <div className="mb-1.5 flex items-center justify-between">
              <span className={`rounded-md px-2 py-0.5 text-xs font-semibold ${meta.pill} ${meta.text}`}>
                {d.name}
              </span>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-stone-700 dark:text-stone-200">{d.count}</span>
                <span className="w-8 text-right font-mono text-xs text-stone-400">{sharePct}%</span>
              </div>
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-stone-100 dark:bg-stone-800">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.7, delay: i * 0.07 + 0.1, ease: "easeOut" }}
                className={`h-full rounded-full bg-gradient-to-r ${meta.gradient}`}
                style={{
                  boxShadow: isHov ? "0 0 8px 2px rgba(0,0,0,0.15)" : "none",
                  transition: "box-shadow 0.2s",
                }}
              />
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

/** Captures a mounted DOM element as a PNG data URL. */
async function captureElementAsPng(el: HTMLElement, filename: string): Promise<void> {
  const { default: html2canvas } = await import("html2canvas");
  const canvas = await html2canvas(el, { scale: 2, useCORS: true, backgroundColor: "#ffffff", logging: false });
  const a = document.createElement("a");
  a.href = canvas.toDataURL("image/png");
  a.download = filename;
  a.click();
}

export function Dashboard() {
  const { user } = useAuth();
  const [weddings, setWeddings] = useState<Wedding[]>([]);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedWedding, setExpandedWedding] = useState<string | null>(null);
  const [previewGuest, setPreviewGuest] = useState<{ guest: Guest; wedding: Wedding } | null>(null);
  // ref for capturing the card shown inside the modal
  const modalCardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function load() {
      if (!user) return;
      const [{ data: w }, { data: n }] = await Promise.all([
        supabase.from("weddings").select("*").eq("organizer_id", user.id).order("created_at", { ascending: false }),
        supabase.from("notifications").select("*").eq("recipient_id", user.id).order("created_at", { ascending: false }).limit(5),
      ]);
      setWeddings(w ?? []);
      setNotifications(n ?? []);
      if (w && w.length > 0) {
        const ids = w.map((x) => x.id);
        const { data: allGuests } = await supabase.from("guests").select("*").in("wedding_id", ids);
        setGuests(allGuests ?? []);
      }
      setLoading(false);
    }
    load();
  }, [user]);

  const guestsForWedding = (weddingId: string) => guests.filter((g) => g.wedding_id === weddingId);

  const stats = {
    totalWeddings: weddings.length,
    totalGuests: guests.length,
    confirmed: guests.filter((g) => g.attendance_status === "confirmed").length,
    checkedIn: guests.filter((g) => g.attendance_status === "checked_in").length,
    pending: guests.filter((g) => g.attendance_status === "pending").length,
    declined: guests.filter((g) => g.attendance_status === "declined").length,
    maybe: guests.filter((g) => g.attendance_status === "maybe").length,
  };

  const rsvpData = [
    { name: "Confirmed", value: stats.confirmed, color: RSVP_COLORS.confirmed },
    { name: "Pending", value: stats.pending, color: RSVP_COLORS.pending },
    { name: "Maybe", value: stats.maybe, color: RSVP_COLORS.maybe },
    { name: "Declined", value: stats.declined, color: RSVP_COLORS.declined },
    { name: "Checked In", value: stats.checkedIn, color: RSVP_COLORS.checked_in },
  ].filter((d) => d.value > 0);

  const categoryData = ["family", "friends", "partners", "colleagues", "vip", "others"].map((cat) => ({
    name: cat.charAt(0).toUpperCase() + cat.slice(1),
    count: guests.filter((g) => g.category === cat).length,
  })).filter((d) => d.count > 0);

  const upcomingWeddings = weddings
    .filter((w) => w.date && new Date(w.date) >= new Date())
    .sort((a, b) => new Date(a.date!).getTime() - new Date(b.date!).getTime())
    .slice(0, 3);

  /** Download the card visible inside the preview modal. */
  async function downloadModalCard() {
    if (!previewGuest || !modalCardRef.current) return;
    await captureElementAsPng(
      modalCardRef.current,
      `invitation-${previewGuest.guest.full_name.replace(/\s+/g, "-").toLowerCase()}.png`
    );
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="skeleton h-8 w-48 rounded-lg" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => <div key={i} className="skeleton h-28 rounded-2xl" />)}
        </div>
        <div className="skeleton h-80 rounded-2xl" />
        <div className="skeleton h-96 rounded-2xl" />
      </div>
    );
  }

  const statCards = [
    { label: "Total Weddings", value: stats.totalWeddings, icon: Heart, color: "text-gold-600 bg-gold-50 dark:bg-gold-900/30 dark:text-gold-400" },
    { label: "Total Guests", value: stats.totalGuests, icon: Users, color: "text-blue-600 bg-blue-50 dark:bg-blue-900/30 dark:text-blue-400" },
    { label: "Confirmed", value: stats.confirmed, icon: CheckCircle2, color: "text-green-600 bg-green-50 dark:bg-green-900/30 dark:text-green-400" },
    { label: "Checked In", value: stats.checkedIn, icon: TrendingUp, color: "text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 dark:text-indigo-400" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-bold text-stone-900 dark:text-stone-100">Dashboard</h1>
        <p className="mt-1 text-sm text-stone-500">Welcome back. Here's your wedding overview.</p>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card className="flex items-center gap-4">
              <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${s.color}`}>
                <s.icon className="h-6 w-6" />
              </div>
              <div>
                <p className="text-2xl font-bold text-stone-900 dark:text-stone-100">{s.value}</p>
                <p className="text-sm text-stone-500">{s.label}</p>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* ── INVITATION CARDS & QR CODES ── */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="font-serif text-xl font-semibold text-stone-900 dark:text-stone-100">
              Invitation Cards & QR Codes
            </h2>
            <p className="mt-0.5 text-sm text-stone-500">
              View, download, and share each guest's full invitation card directly from here.
            </p>
          </div>
          <Link to="/invitations">
            <Button variant="secondary" size="sm">Manage all</Button>
          </Link>
        </div>

        {weddings.length === 0 ? (
          <Card className="flex flex-col items-center justify-center py-14 text-center">
            <QrCode className="h-12 w-12 text-stone-300 dark:text-stone-600" />
            <p className="mt-4 text-sm font-medium text-stone-500">No weddings yet</p>
            <p className="mt-1 text-xs text-stone-400">Create a wedding to start generating invitation cards.</p>
            <Link to="/weddings" className="mt-5">
              <Button size="sm"><Heart className="h-3.5 w-3.5" /> Create Wedding</Button>
            </Link>
          </Card>
        ) : (
          <div className="space-y-4">
            {weddings.map((wedding) => {
              const wGuests = guestsForWedding(wedding.id);
              const isOpen = expandedWedding === wedding.id;
              return (
                <WeddingInvitePanel
                  key={wedding.id}
                  wedding={wedding}
                  guests={wGuests}
                  isOpen={isOpen}
                  onToggle={() => setExpandedWedding(isOpen ? null : wedding.id)}
                  onPreview={(g) => setPreviewGuest({ guest: g, wedding })}
                />
              );
            })}
          </div>
        )}
      </section>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* ── RSVP Donut Chart ── */}
        <Card>
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-serif text-lg font-semibold text-stone-900 dark:text-stone-100">RSVP Breakdown</h3>
              <p className="mt-0.5 text-sm text-stone-500">Real-time response statistics</p>
            </div>
            <span className="rounded-full bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-700 dark:bg-green-900/30 dark:text-green-400">
              {stats.totalGuests > 0 ? Math.round((stats.confirmed / stats.totalGuests) * 100) : 0}% confirmed
            </span>
          </div>
          {rsvpData.length > 0 ? (
            <RsvpDonutChart data={rsvpData} total={stats.totalGuests} />
          ) : (
            <div className="mt-8 flex h-52 flex-col items-center justify-center gap-2 text-sm text-stone-400">
              <Clock className="h-10 w-10 text-stone-300 dark:text-stone-600" />
              <p>No RSVPs yet</p>
            </div>
          )}
        </Card>

        {/* ── Guest Categories Bar Chart ── */}
        <Card>
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-serif text-lg font-semibold text-stone-900 dark:text-stone-100">Guest Categories</h3>
              <p className="mt-0.5 text-sm text-stone-500">Distribution across categories</p>
            </div>
            <span className="rounded-full bg-gold-50 px-2.5 py-1 text-xs font-semibold text-gold-700 dark:bg-gold-900/30 dark:text-gold-400">
              {stats.totalGuests} total
            </span>
          </div>
          {categoryData.length > 0 ? (
            <GuestCategoryChart data={categoryData} total={stats.totalGuests} />
          ) : (
            <div className="mt-8 flex h-52 flex-col items-center justify-center gap-2 text-sm text-stone-400">
              <Users className="h-10 w-10 text-stone-300 dark:text-stone-600" />
              <p>No guests yet</p>
            </div>
          )}
        </Card>
      </div>

      {/* Upcoming weddings */}
      <Card>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-serif text-lg font-semibold text-stone-900 dark:text-stone-100">Upcoming Weddings</h3>
          <Link to="/weddings" className="text-sm font-medium text-gold-600 hover:text-gold-700 dark:text-gold-400">View all</Link>
        </div>
        {upcomingWeddings.length > 0 ? (
          <div className="space-y-3">
            {upcomingWeddings.map((w) => (
              <Link key={w.id} to={`/weddings/${w.id}`} className="flex items-center justify-between rounded-xl border border-stone-200 p-4 transition-colors hover:bg-stone-50 dark:border-stone-800 dark:hover:bg-stone-800/50">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gold-50 text-gold-600 dark:bg-gold-900/30 dark:text-gold-400">
                    <Calendar className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-medium text-stone-900 dark:text-stone-100">{w.title || `${w.bride_name} & ${w.groom_name}`}</p>
                    <p className="text-sm text-stone-500">{formatDate(w.date)}</p>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-stone-400" />
              </Link>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center">
            <p className="text-sm text-stone-400">No upcoming weddings.</p>
            <Link to="/weddings" className="mt-3 inline-block"><Button size="sm">Create a Wedding</Button></Link>
          </div>
        )}
      </Card>

      {/* Recent activity */}
      <Card>
        <h3 className="mb-4 font-serif text-lg font-semibold text-stone-900 dark:text-stone-100">Recent Activity</h3>
        {notifications.length > 0 ? (
          <div className="space-y-2">
            {notifications.map((n) => (
              <div key={n.id} className="flex items-start gap-3 rounded-xl p-3 hover:bg-stone-50 dark:hover:bg-stone-800/50">
                <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-lg bg-gold-50 text-gold-600 dark:bg-gold-900/30 dark:text-gold-400">
                  <Mail className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-stone-900 dark:text-stone-100">{n.title}</p>
                  <p className="text-xs text-stone-500">{n.message}</p>
                </div>
                {!n.read && <Badge className="bg-gold-100 text-gold-700 dark:bg-gold-900/40 dark:text-gold-300">New</Badge>}
              </div>
            ))}
          </div>
        ) : (
          <p className="py-6 text-center text-sm text-stone-400">No recent activity.</p>
        )}
      </Card>

      {/* Full invitation preview modal */}
      {previewGuest && (
        <Modal open onClose={() => setPreviewGuest(null)} title={`Invitation — ${previewGuest.guest.full_name}`} size="lg">
          <InvitationCard
            ref={modalCardRef}
            wedding={previewGuest.wedding}
            guestName={previewGuest.guest.full_name}
            ticketId={previewGuest.guest.ticket_id}
          />
          <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
            {(() => {
              const shareOpts = { ticketId: previewGuest.guest.ticket_id, guestName: previewGuest.guest.full_name, weddingTitle: previewGuest.wedding.title || `${previewGuest.wedding.bride_name} & ${previewGuest.wedding.groom_name}` };
              return <>
                <Button variant="secondary" size="sm" onClick={downloadModalCard}><Download className="h-3.5 w-3.5" /> PNG</Button>
                <WhatsAppShareButton opts={shareOpts} compact />
                <TelegramShareButton opts={shareOpts} compact />
                <EmailShareButton opts={shareOpts} compact />
                <CopyLinkButton ticketId={previewGuest.guest.ticket_id} compact />
              </>;
            })()}
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ─── Wedding invite panel (collapsible per-wedding) ─── */
function WeddingInvitePanel({
  wedding, guests, isOpen, onToggle, onPreview,
}: {
  wedding: Wedding;
  guests: Guest[];
  isOpen: boolean;
  onToggle: () => void;
  onPreview: (g: Guest) => void;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white dark:border-stone-800 dark:bg-stone-900">
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between px-6 py-4 text-left transition-colors hover:bg-stone-50 dark:hover:bg-stone-800/50"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold-50 text-gold-600 dark:bg-gold-900/30 dark:text-gold-400">
            <Heart className="h-5 w-5" fill="currentColor" />
          </div>
          <div className="text-left">
            <p className="font-serif font-semibold text-stone-900 dark:text-stone-100">
              {wedding.title || `${wedding.bride_name} & ${wedding.groom_name}`}
            </p>
            <p className="text-xs text-stone-400">
              {formatDate(wedding.date)} · {guests.length} guest{guests.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {guests.length > 0 && (
            <span className="rounded-full bg-gold-100 px-2.5 py-0.5 text-xs font-medium text-gold-700 dark:bg-gold-900/40 dark:text-gold-300">
              {guests.length} invitation{guests.length !== 1 ? "s" : ""}
            </span>
          )}
          {isOpen ? <ChevronUp className="h-4 w-4 text-stone-400" /> : <ChevronDown className="h-4 w-4 text-stone-400" />}
        </div>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="border-t border-stone-100 px-6 py-5 dark:border-stone-800">
              {guests.length === 0 ? (
                <div className="flex flex-col items-center py-8 text-center">
                  <Users className="h-8 w-8 text-stone-300 dark:text-stone-600" />
                  <p className="mt-3 text-sm text-stone-400">No guests added yet.</p>
                  <Link to="/guests" className="mt-3">
                    <Button size="sm" variant="secondary"><Users className="h-3.5 w-3.5" /> Add Guests</Button>
                  </Link>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {guests.map((guest) => (
                    <GuestQRCard
                      key={guest.id}
                      guest={guest}
                      wedding={wedding}
                      onPreview={() => onPreview(guest)}
                    />
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── Individual guest QR card ─── */
function GuestQRCard({
  guest, wedding, onPreview,
}: { guest: Guest; wedding: Wedding; onPreview: () => void }) {
  const [qrDataUrl, setQrDataUrl] = useState("");
  const hiddenCardRef = useRef<HTMLDivElement>(null);
  const inviteUrl = `${window.location.origin}/invite/${guest.ticket_id}`;

  useEffect(() => {
    QRCode.toDataURL(inviteUrl, { width: 180, margin: 1, color: { dark: "#5e3b20", light: "#ffffff" } })
      .then(setQrDataUrl)
      .catch(() => {});
  }, [inviteUrl]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="group flex flex-col rounded-2xl border border-stone-200 bg-gradient-to-b from-white to-stone-50 p-4 dark:border-stone-700 dark:from-stone-800 dark:to-stone-900"
    >
      {/* QR thumbnail */}
      <div className="flex flex-col items-center">
        <div className="relative rounded-xl bg-white p-3 shadow-sm ring-1 ring-stone-100 dark:ring-stone-700">
          {qrDataUrl ? (
            <img src={qrDataUrl} alt={`QR for ${guest.full_name}`} className="h-28 w-28" />
          ) : (
            <div className="skeleton h-28 w-28" />
          )}
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white shadow ring-1 ring-stone-100">
              <Heart className="h-3.5 w-3.5 text-gold-600" fill="currentColor" />
            </div>
          </div>
        </div>
      </div>

      {/* Guest info */}
      <div className="mt-3 text-center">
        <p className="font-serif text-sm font-semibold leading-tight text-stone-900 dark:text-stone-100">{guest.full_name}</p>
        <p className="mt-0.5 truncate text-xs text-stone-400">{guest.email || "—"}</p>
        <div className="mt-2 flex items-center justify-center gap-1.5">
          <Badge className={`${CATEGORY_COLORS[guest.category]} text-xs`}>{CATEGORY_LABELS[guest.category]}</Badge>
          <Badge className={`${STATUS_COLORS[guest.attendance_status]} text-xs`}>{STATUS_LABELS[guest.attendance_status]}</Badge>
        </div>
      </div>

      {/* Hidden card for download capture */}
      <div className="pointer-events-none fixed left-0 top-0 -z-50 w-[600px] opacity-0">
        <InvitationCard ref={hiddenCardRef} wedding={wedding} guestName={guest.full_name} ticketId={guest.ticket_id} />
      </div>

      {/* Actions */}
      <div className="mt-3 grid grid-cols-3 gap-1.5">
        <CompactButton icon={<QrCode className="h-4 w-4" />} label="View" onClick={onPreview} />
        <DownloadCardButton cardRef={hiddenCardRef} guestName={guest.full_name} />
        <NativeShareButton
          opts={{ ticketId: guest.ticket_id, guestName: guest.full_name, weddingTitle: wedding.title || `${wedding.bride_name} & ${wedding.groom_name}` }}
          compact
          className="flex flex-col items-center gap-1 rounded-xl border border-stone-200 bg-white p-2 text-xs font-medium text-stone-600 transition-colors hover:border-gold-300 hover:bg-gold-50 hover:text-gold-700 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-300"
        />
      </div>

      <CopyLinkButton ticketId={guest.ticket_id} compact />
    </motion.div>
  );
}

/* ─── Reusable compact icon button ─── */
function CompactButton({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-1 rounded-xl border border-stone-200 bg-white p-2 text-xs font-medium text-stone-600 transition-colors hover:border-gold-300 hover:bg-gold-50 hover:text-gold-700 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-300 dark:hover:border-gold-700 dark:hover:bg-gold-900/20"
    >
      {icon}
      {label}
    </button>
  );
}

/* ─── Download full invitation card as PNG ─── */
function DownloadCardButton({ cardRef, guestName }: { cardRef: React.RefObject<HTMLDivElement | null>; guestName: string }) {
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    if (!cardRef.current) return;
    setDownloading(true);
    try {
      await captureElementAsPng(
        cardRef.current,
        `invitation-${guestName.replace(/\s+/g, "-").toLowerCase()}.png`
      );
    } catch {
      alert("Could not generate image. Try the View button and download from there.");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <button
      onClick={handleDownload}
      disabled={downloading}
      title="Download full invitation card"
      className="flex flex-col items-center gap-1 rounded-xl border border-stone-200 bg-white p-2 text-xs font-medium text-stone-600 transition-colors hover:border-gold-300 hover:bg-gold-50 hover:text-gold-700 disabled:opacity-60 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-300 dark:hover:border-gold-700 dark:hover:bg-gold-900/20"
    >
      {downloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
      {downloading ? "..." : "Save"}
    </button>
  );
}
