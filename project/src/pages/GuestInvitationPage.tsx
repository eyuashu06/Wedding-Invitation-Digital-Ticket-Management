import { useEffect, useRef, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Heart, Calendar, Clock, MapPin, Shirt, Phone, Check, X, HelpCircle,
  ExternalLink, QrCode, MessageSquare, Utensils, Download, FileText,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { InvitationCard } from "@/components/InvitationCard";
import { Countdown } from "@/components/Countdown";
import { Gallery } from "@/components/Gallery";
import { WhatsAppShareButton, TelegramShareButton, EmailShareButton, CopyLinkButton, exportCardAsPdf, exportCardAsPng } from "@/components/ShareButtons";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { formatDate, formatTime, formatDateTime } from "@/lib/utils";
import type { Guest, Wedding } from "@/lib/types";

export function GuestInvitationPage() {
  const { ticketId } = useParams<{ ticketId: string }>();
  const [guest, setGuest] = useState<Guest | null>(null);
  const [wedding, setWedding] = useState<Wedding | null>(null);
  const [loading, setLoading] = useState(true);
  const [rsvpSubmitting, setRsvpSubmitting] = useState(false);
  const [rsvpAttendees, setRsvpAttendees] = useState(1);
  const [rsvpMessage, setRsvpMessage] = useState("");
  const [dietary, setDietary] = useState("");
  const [plusOnes, setPlusOnes] = useState<{ name: string; dietary?: string }[]>([]);
  const [showRsvpForm, setShowRsvpForm] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const count = Math.max(0, rsvpAttendees - 1);
    setPlusOnes((prev) => {
      const next = [...prev];
      while (next.length < count) next.push({ name: "", dietary: "" });
      return next.slice(0, count);
    });
  }, [rsvpAttendees]);

  useEffect(() => {
    async function load() {
      if (!ticketId) return;
      const { data: g } = await supabase.from("guests").select("*").eq("ticket_id", ticketId).maybeSingle();
      if (g) {
        setGuest(g as Guest);
        setRsvpAttendees(g.rsvp_attendees ?? 1);
        setRsvpMessage(g.rsvp_message ?? "");
        setDietary(g.dietary_preferences ?? "");
        if (g.plus_ones && Array.isArray(g.plus_ones)) {
          setPlusOnes(g.plus_ones);
        }
        const { data: w } = await supabase.from("weddings").select("*").eq("id", g.wedding_id).maybeSingle();
        setWedding(w as Wedding);
      }
      setLoading(false);
    }
    load();
  }, [ticketId]);

  async function submitRSVP(status: "confirmed" | "declined" | "maybe") {
    if (!guest) return;
    setRsvpSubmitting(true);
    const patch = {
      attendance_status: status,
      rsvp_attendees: status === "confirmed" ? rsvpAttendees : null,
      rsvp_responded_at: new Date().toISOString(),
      rsvp_message: rsvpMessage.trim() || null,
      dietary_preferences: dietary.trim() || null,
      plus_ones: status === "confirmed" && rsvpAttendees > 1 ? plusOnes.filter((p) => p.name.trim()) : [],
    };
    await supabase.from("guests").update(patch).eq("id", guest.id);
    setGuest({ ...guest, ...patch });
    setShowRsvpForm(false);
    setRsvpSubmitting(false);
  }

  const guestFilename = () =>
    `invitation-${(guest?.full_name ?? "guest").replace(/\s+/g, "-").toLowerCase()}`;

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-stone-50 dark:bg-stone-950">
        <div className="skeleton h-96 w-full max-w-md rounded-2xl" />
      </div>
    );
  }

  if (!guest || !wedding) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-stone-50 px-4 dark:bg-stone-950">
        <Card className="max-w-md text-center">
          <X className="mx-auto h-12 w-12 text-red-500" />
          <h1 className="mt-4 font-serif text-xl font-bold text-stone-900 dark:text-stone-100">Invitation Not Found</h1>
          <p className="mt-2 text-sm text-stone-500">This invitation link is invalid or has been removed.</p>
          <Link to="/"><Button className="mt-6" variant="secondary">Go Home</Button></Link>
        </Card>
      </div>
    );
  }

  const hasRSVPed = guest.attendance_status !== "pending" && guest.rsvp_responded_at !== null;
  const shareOpts = {
    ticketId: guest.ticket_id,
    guestName: guest.full_name,
    weddingTitle: wedding.title || `${wedding.bride_name} & ${wedding.groom_name}`,
    weddingDate: wedding.date,
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-stone-50 via-white to-gold-50 dark:from-stone-950 dark:via-stone-900 dark:to-stone-950">
      <header className="flex items-center justify-between px-6 py-5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold-600 text-white">
            <Heart className="h-5 w-5" fill="currentColor" />
          </div>
          <span className="font-serif text-lg font-bold text-stone-900 dark:text-stone-100">WeddingPass</span>
        </div>
        <Badge className={hasRSVPed ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300" : "bg-gold-100 text-gold-700 dark:bg-gold-900/40 dark:text-gold-300"}>
          {hasRSVPed ? `RSVP: ${guest.attendance_status}` : "Pending RSVP"}
        </Badge>
      </header>

      <div className="mx-auto max-w-2xl px-4 py-8 lg:px-6">

        {/* Invitation card */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <InvitationCard ref={cardRef} wedding={wedding} guestName={guest.full_name} ticketId={guest.ticket_id} showStory />
        </motion.div>

        {/* Download & share row */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="mt-4 flex flex-wrap gap-2">
          <button
            onClick={() => cardRef.current && exportCardAsPng(cardRef.current, `${guestFilename()}.png`)}
            className="flex items-center gap-1.5 rounded-xl border border-stone-200 bg-white px-3 py-2 text-xs font-medium text-stone-700 transition-colors hover:border-gold-300 hover:bg-gold-50 hover:text-gold-700 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-300"
          >
            <Download className="h-3.5 w-3.5" /> Save PNG
          </button>
          <button
            onClick={() => cardRef.current && exportCardAsPdf(cardRef.current, `${guestFilename()}.pdf`)}
            className="flex items-center gap-1.5 rounded-xl border border-stone-200 bg-white px-3 py-2 text-xs font-medium text-stone-700 transition-colors hover:border-gold-300 hover:bg-gold-50 hover:text-gold-700 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-300"
          >
            <FileText className="h-3.5 w-3.5" /> Save PDF
          </button>
          <WhatsAppShareButton opts={shareOpts} compact />
          <TelegramShareButton opts={shareOpts} compact />
          <EmailShareButton opts={shareOpts} compact />
          <CopyLinkButton ticketId={guest.ticket_id} compact />
        </motion.div>

        {/* Countdown */}
        {wedding.date && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mt-6">
            <Card>
              <Countdown date={wedding.date} />
            </Card>
          </motion.div>
        )}

        {/* RSVP */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="mt-6">
          <Card>
            <h3 className="font-serif text-lg font-semibold text-stone-900 dark:text-stone-100">RSVP</h3>
            <p className="mt-1 text-sm text-stone-500">
              {hasRSVPed
                ? `You responded: ${guest.attendance_status}. You can update your response below.`
                : "Will you be attending?"}
            </p>

            {!showRsvpForm && (
              <div className="mt-4 grid grid-cols-3 gap-3">
                <Button
                  onClick={() => { setShowRsvpForm(true); }}
                  className={guest.attendance_status === "confirmed" ? "ring-2 ring-green-500" : ""}
                >
                  <Check className="h-4 w-4" /> Accept
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => submitRSVP("maybe")}
                  disabled={rsvpSubmitting}
                  className={guest.attendance_status === "maybe" ? "ring-2 ring-amber-500" : ""}
                >
                  <HelpCircle className="h-4 w-4" /> Maybe
                </Button>
                <Button
                  variant="danger"
                  onClick={() => submitRSVP("declined")}
                  disabled={rsvpSubmitting}
                  className={guest.attendance_status === "declined" ? "ring-2 ring-red-500" : ""}
                >
                  <X className="h-4 w-4" /> Decline
                </Button>
              </div>
            )}

            {showRsvpForm && (
              <div className="mt-4 space-y-4 rounded-xl border border-stone-200 p-4 dark:border-stone-700">
                <div>
                  <label className="label">Number of Attendees</label>
                  <input
                    type="number" min={1} max={10}
                    value={rsvpAttendees}
                    onChange={(e) => setRsvpAttendees(parseInt(e.target.value) || 1)}
                    className="input"
                  />
                </div>

                {rsvpAttendees > 1 && (
                  <div className="space-y-3 rounded-xl bg-stone-50 p-3 dark:bg-stone-800/40">
                    <p className="text-xs font-semibold text-stone-700 dark:text-stone-300">
                      Accompanying Guests ({rsvpAttendees - 1})
                    </p>
                    {plusOnes.map((p, idx) => (
                      <div key={idx} className="grid gap-2 sm:grid-cols-2">
                        <input
                          type="text"
                          placeholder={`Guest ${idx + 2} Full Name`}
                          value={p.name}
                          onChange={(e) => {
                            const val = e.target.value;
                            setPlusOnes((prev) => prev.map((item, i) => i === idx ? { ...item, name: val } : item));
                          }}
                          className="input text-xs"
                        />
                        <input
                          type="text"
                          placeholder="Dietary Needs (optional)"
                          value={p.dietary ?? ""}
                          onChange={(e) => {
                            const val = e.target.value;
                            setPlusOnes((prev) => prev.map((item, i) => i === idx ? { ...item, dietary: val } : item));
                          }}
                          className="input text-xs"
                        />
                      </div>
                    ))}
                  </div>
                )}

                <div>
                  <label className="label flex items-center gap-1.5"><MessageSquare className="h-3.5 w-3.5" /> Message (optional)</label>
                  <textarea
                    rows={2}
                    value={rsvpMessage}
                    onChange={(e) => setRsvpMessage(e.target.value)}
                    placeholder="Congratulations! We are so excited to celebrate with you..."
                    className="input resize-none"
                  />
                </div>
                <div>
                  <label className="label flex items-center gap-1.5"><Utensils className="h-3.5 w-3.5" /> Primary Guest Dietary Preferences (optional)</label>
                  <input
                    type="text"
                    value={dietary}
                    onChange={(e) => setDietary(e.target.value)}
                    placeholder="Vegetarian, gluten-free, nut allergy..."
                    className="input"
                  />
                </div>
                <div className="flex gap-3">
                  <Button onClick={() => submitRSVP("confirmed")} disabled={rsvpSubmitting}>
                    <Check className="h-4 w-4" /> Confirm Attendance
                  </Button>
                  <Button variant="secondary" onClick={() => setShowRsvpForm(false)} disabled={rsvpSubmitting}>
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            {hasRSVPed && (
              <div className="mt-3 space-y-1 text-xs text-stone-400">
                <p>Submitted on {formatDateTime(guest.rsvp_responded_at)}</p>
                {guest.rsvp_message && <p className="italic">"{guest.rsvp_message}"</p>}
              </div>
            )}
          </Card>
        </motion.div>

        {/* Event details */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="mt-6">
          <Card>
            <h3 className="font-serif text-lg font-semibold text-stone-900 dark:text-stone-100">Event Details</h3>
            <div className="mt-4 space-y-3">
              <DetailRow icon={Calendar} label="Date" value={formatDate(wedding.date)} />
              {wedding.start_time && <DetailRow icon={Clock} label="Time" value={`${formatTime(wedding.start_time)}${wedding.end_time ? ` – ${formatTime(wedding.end_time)}` : ""}`} />}
              {wedding.venue_name && <DetailRow icon={MapPin} label="Venue" value={wedding.venue_name} />}
              {wedding.venue_address && <DetailRow icon={MapPin} label="Address" value={wedding.venue_address} />}
              {wedding.dress_code && <DetailRow icon={Shirt} label="Dress Code" value={wedding.dress_code} />}
              {(wedding.contact_phones?.length ?? 0) > 0 && <DetailRow icon={Phone} label="Contact" value={(wedding.contact_phones ?? []).join(", ")} />}
            </div>
            {wedding.maps_url && (
              <a href={wedding.maps_url} target="_blank" rel="noopener noreferrer" className="mt-4 inline-block">
                <Button variant="secondary" size="sm"><ExternalLink className="h-3.5 w-3.5" /> View on Google Maps</Button>
              </a>
            )}
          </Card>
        </motion.div>

        {/* Schedule */}
        {wedding.schedule && wedding.schedule.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="mt-6">
            <Card>
              <h3 className="font-serif text-lg font-semibold text-stone-900 dark:text-stone-100">Schedule</h3>
              <div className="mt-4 space-y-3">
                {(wedding.schedule as { time: string; label: string }[]).map((item, i) => (
                  <div key={i} className="flex items-center gap-3 border-l-2 border-gold-300 pl-4 dark:border-gold-700">
                    <span className="w-24 text-sm font-medium text-gold-700 dark:text-gold-400">{item.time}</span>
                    <span className="text-sm text-stone-600 dark:text-stone-400">{item.label}</span>
                  </div>
                ))}
              </div>
            </Card>
          </motion.div>
        )}

        {/* Photo gallery */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="mt-6">
          <Card>
            <h3 className="mb-4 font-serif text-lg font-semibold text-stone-900 dark:text-stone-100">Gallery</h3>
            <Gallery weddingId={wedding.id} />
          </Card>
        </motion.div>

        {/* Digital ticket with QR */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }} className="mt-6">
          <Card className="border-2 border-gold-200 dark:border-gold-800">
            <div className="flex items-center gap-2">
              <QrCode className="h-5 w-5 text-gold-600 dark:text-gold-400" />
              <h3 className="font-serif text-lg font-semibold text-stone-900 dark:text-stone-100">Your Digital Ticket</h3>
            </div>
            <p className="mt-1 text-sm text-stone-500">Show this QR code at the entrance for check-in.</p>
            <div className="mt-4 flex flex-col items-center rounded-xl bg-gradient-to-br from-gold-50 to-gold-100 p-6 dark:from-gold-950 dark:to-stone-900">
              <div className="w-full max-w-xs rounded-xl bg-white p-4 shadow-sm">
                <div className="text-center">
                  <p className="font-script text-2xl text-gold-600">{wedding.bride_name} & {wedding.groom_name}</p>
                  <p className="mt-1 text-xs text-stone-500">{formatDate(wedding.date)}</p>
                </div>
                <div className="my-3 border-t border-dashed border-stone-200" />
                <div className="flex flex-col items-center">
                  <InvitationQR ticketId={guest.ticket_id} />
                  <p className="mt-2 font-mono text-xs text-stone-400">{guest.ticket_id}</p>
                </div>
                <div className="my-3 border-t border-dashed border-stone-200" />
                <div className="text-center">
                  <p className="text-sm font-semibold text-stone-900 dark:text-stone-100">{guest.full_name}</p>
                  {guest.accompanying_persons > 0 && <p className="text-xs text-stone-500">+{guest.accompanying_persons} guest(s)</p>}
                </div>
              </div>
            </div>
            <p className="mt-3 text-center text-xs text-stone-400">
              Ticket Status: <span className="font-medium capitalize">{guest.attendance_status.replace("_", " ")}</span>
            </p>
          </Card>
        </motion.div>

        <div className="mt-8 text-center">
          <p className="flex items-center justify-center gap-1.5 text-xs text-stone-400">
            <Heart className="h-3 w-3" fill="currentColor" /> Powered by WeddingPass
          </p>
        </div>
      </div>
    </div>
  );
}

function DetailRow({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-lg bg-stone-100 text-stone-500 dark:bg-stone-800 dark:text-stone-400">
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <p className="text-xs text-stone-400">{label}</p>
        <p className="text-sm text-stone-900 dark:text-stone-100">{value}</p>
      </div>
    </div>
  );
}

function InvitationQR({ ticketId }: { ticketId: string }) {
  const [qrUrl, setQrUrl] = useState("");
  useEffect(() => {
    import("qrcode").then((QRCode) => {
      QRCode.toDataURL(`${window.location.origin}/invite/${ticketId}`, { width: 160, margin: 1, color: { dark: "#5e3b20", light: "#ffffff" } })
        .then(setQrUrl)
        .catch(() => {});
    });
  }, [ticketId]);
  return qrUrl ? <img src={qrUrl} alt="QR Code" className="h-40 w-40" /> : <div className="skeleton h-40 w-40" />;
}
