import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Mail, Send, Eye, ExternalLink, Download, FileText } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Field";
import { CATEGORY_LABELS, CATEGORY_COLORS, STATUS_LABELS, STATUS_COLORS, type Guest, type Wedding } from "@/lib/types";
import { InvitationCard } from "@/components/InvitationCard";
import { WhatsAppShareButton, TelegramShareButton, EmailShareButton, CopyLinkButton, exportCardAsPdf, exportCardAsPng } from "@/components/ShareButtons";
import { formatDateTime } from "@/lib/utils";

export function InvitationsPage() {
  const { user } = useAuth();
  const [weddings, setWeddings] = useState<Wedding[]>([]);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [loading, setLoading] = useState(true);
  const [weddingFilter, setWeddingFilter] = useState("all");
  const [previewGuest, setPreviewGuest] = useState<Guest | null>(null);
  const modalCardRef = useRef<HTMLDivElement>(null);

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

  async function sendInvitation(guest: Guest) {
    const inviteUrl = `${window.location.origin}/invite/${guest.ticket_id}`;
    await supabase.from("guests").update({ attendance_status: "pending" }).eq("id", guest.id);

    if (user) {
      await supabase.from("notifications").insert({
        recipient_id: user.id, wedding_id: guest.wedding_id, type: "invitation_sent",
        title: "Invitation sent", message: `Invitation sent to ${guest.full_name}. Link: ${inviteUrl}`,
      });
    }

    if (navigator.share) {
      try { await navigator.share({ title: "Wedding Invitation", text: `You're invited! ${guest.full_name}`, url: inviteUrl }); } catch { /* cancelled */ }
    } else {
      await navigator.clipboard.writeText(inviteUrl);
      alert(`Invitation link copied to clipboard:\n${inviteUrl}`);
    }
    loadData();
  }

  const filtered = weddingFilter === "all" ? guests : guests.filter((g) => g.wedding_id === weddingFilter);
  const weddingName = (id: string) => weddings.find((w) => w.id === id);

  if (loading) return <div className="skeleton h-96 rounded-2xl" />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-bold text-stone-900 dark:text-stone-100">Invitations</h1>
        <p className="mt-1 text-sm text-stone-500">Send and track invitation status for each guest.</p>
      </div>

      {weddings.length === 0 ? (
        <Card className="py-12 text-center">
          <Mail className="mx-auto h-12 w-12 text-stone-300 dark:text-stone-600" />
          <p className="mt-4 text-sm text-stone-400">Create a wedding and add guests first.</p>
        </Card>
      ) : (
        <>
          <Card className="flex items-center gap-3">
            <span className="text-sm text-stone-500">Filter:</span>
            <Select value={weddingFilter} onChange={(e) => setWeddingFilter(e.target.value)} className="max-w-xs">
              <option value="all">All Weddings</option>
              {weddings.map((w) => <option key={w.id} value={w.id}>{w.title || `${w.bride_name} & ${w.groom_name}`}</option>)}
            </Select>
          </Card>

          {filtered.length === 0 ? (
            <Card className="py-12 text-center">
              <p className="text-sm text-stone-400">No guests to invite yet. Add guests from the Guests page.</p>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filtered.map((g, i) => {
                const wedding = weddingName(g.wedding_id);
                return (
                  <motion.div key={g.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i * 0.03, 0.3) }}>
                    <Card className="flex h-full flex-col">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium text-stone-900 dark:text-stone-100">{g.full_name}</p>
                          <p className="text-xs text-stone-400">{wedding?.title ?? "Unknown"}</p>
                        </div>
                        <Badge className={STATUS_COLORS[g.attendance_status]}>{STATUS_LABELS[g.attendance_status]}</Badge>
                      </div>
                      {g.email && <p className="mt-2 text-sm text-stone-500">{g.email}</p>}
                      <Badge className={`mt-2 ${CATEGORY_COLORS[g.category]}`}>{CATEGORY_LABELS[g.category]}</Badge>
                      <div className="mt-3 rounded-lg bg-stone-50 px-3 py-2 dark:bg-stone-800/50">
                        <p className="font-mono text-xs text-stone-400">Ticket ID</p>
                        <p className="font-mono text-xs text-stone-600 dark:text-stone-300">{g.ticket_id.slice(0, 18)}...</p>
                      </div>
                      {g.rsvp_responded_at && <p className="mt-2 text-xs text-stone-400">RSVP'd: {formatDateTime(g.rsvp_responded_at)}</p>}
                      <div className="mt-4 flex flex-1 items-end gap-2">
                        <Button size="sm" className="flex-1" onClick={() => sendInvitation(g)}><Send className="h-3.5 w-3.5" /> Send</Button>
                        <Button size="sm" variant="secondary" onClick={() => setPreviewGuest(g)}><Eye className="h-3.5 w-3.5" /></Button>
                        <CopyLinkButton ticketId={g.ticket_id} compact />
                      </div>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          )}
        </>
      )}

      {previewGuest && weddingName(previewGuest.wedding_id) && (() => {
        const w = weddingName(previewGuest.wedding_id)!;
        const shareOpts = { ticketId: previewGuest.ticket_id, guestName: previewGuest.full_name, weddingTitle: w.title || `${w.bride_name} & ${w.groom_name}` };
        return (
          <Modal open onClose={() => setPreviewGuest(null)} title={`Invitation — ${previewGuest.full_name}`} size="lg">
            <InvitationCard ref={modalCardRef} wedding={w} guestName={previewGuest.full_name} ticketId={previewGuest.ticket_id} showStory />
            <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
              <a href={`${window.location.origin}/invite/${previewGuest.ticket_id}`} target="_blank" rel="noopener noreferrer">
                <Button variant="secondary" size="sm"><ExternalLink className="h-3.5 w-3.5" /> Open</Button>
              </a>
              <Button variant="secondary" size="sm" onClick={() => modalCardRef.current && exportCardAsPng(modalCardRef.current, `invitation-${previewGuest.full_name.replace(/\s+/g, '-').toLowerCase()}.png`)}><Download className="h-3.5 w-3.5" /> PNG</Button>
              <Button variant="secondary" size="sm" onClick={() => modalCardRef.current && exportCardAsPdf(modalCardRef.current, `invitation-${previewGuest.full_name.replace(/\s+/g, '-').toLowerCase()}.pdf`)}><FileText className="h-3.5 w-3.5" /> PDF</Button>
              <WhatsAppShareButton opts={shareOpts} compact />
              <TelegramShareButton opts={shareOpts} compact />
              <EmailShareButton opts={shareOpts} compact />
              <CopyLinkButton ticketId={previewGuest.ticket_id} compact />
            </div>
          </Modal>
        );
      })()}
    </div>
  );
}
