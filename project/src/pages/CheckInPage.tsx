import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { QrCode, Camera, CheckCircle2, XCircle, Search, Clock, WifiOff, RefreshCw } from "lucide-react";
import { Html5Qrcode } from "html5-qrcode";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Field, Select, Input } from "@/components/ui/Field";
import { useToast } from "@/components/ui/Toast";
import { formatDateTime } from "@/lib/utils";
import { CATEGORY_LABELS, CATEGORY_COLORS, type Guest, type Wedding, type CheckIn } from "@/lib/types";

export function CheckInPage() {
  const { user } = useAuth();
  const toast = useToast();
  const [weddings, setWeddings] = useState<Wedding[]>([]);
  const [selectedWedding, setSelectedWedding] = useState("");
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState<{ guest: Guest; status: "success" | "duplicate" | "not_found"; offline?: boolean } | null>(null);
  const [checkIns, setCheckIns] = useState<CheckIn[]>([]);
  const [manualTicket, setManualTicket] = useState("");
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scannerId = "qr-scanner-region";

  // Monitor online / offline status
  useEffect(() => {
    const handleOnline = () => { setIsOffline(false); syncPendingCheckIns(); };
    const handleOffline = () => setIsOffline(true);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [selectedWedding]);

  useEffect(() => {
    async function load() {
      if (!user) return;
      try {
        const { data: w } = await supabase.from("weddings").select("*").eq("organizer_id", user.id).order("created_at", { ascending: false });
        if (w) {
          setWeddings(w);
          localStorage.setItem(`wp_weddings_${user.id}`, JSON.stringify(w));
          if (w.length > 0) setSelectedWedding(w[0].id);
        }
      } catch {
        // Fallback to offline cached weddings
        const cached = localStorage.getItem(`wp_weddings_${user.id}`);
        if (cached) {
          const parsed = JSON.parse(cached);
          setWeddings(parsed);
          if (parsed.length > 0) setSelectedWedding(parsed[0].id);
        }
      }
    }
    load();
  }, [user]);

  // Sync / Cache guests for offline check-in
  useEffect(() => {
    async function syncGuestCache() {
      if (!selectedWedding) return;
      try {
        const { data: g } = await supabase.from("guests").select("*").eq("wedding_id", selectedWedding);
        if (g) {
          localStorage.setItem(`wp_guests_${selectedWedding}`, JSON.stringify(g));
        }
      } catch {
        /* ignore offline fetch error */
      }
    }
    syncGuestCache();
  }, [selectedWedding]);

  useEffect(() => {
    async function loadCheckIns() {
      if (!selectedWedding) return;
      try {
        const { data } = await supabase.from("check_ins").select("*").eq("wedding_id", selectedWedding).order("checked_in_at", { ascending: false }).limit(20);
        if (data) setCheckIns(data);
      } catch {
        const cached = localStorage.getItem(`wp_checkins_${selectedWedding}`);
        if (cached) setCheckIns(JSON.parse(cached));
      }
    }
    loadCheckIns();
  }, [selectedWedding]);

  async function syncPendingCheckIns() {
    if (!user) return;
    const pendingRaw = localStorage.getItem("wp_pending_checkins");
    if (!pendingRaw) return;
    try {
      const pending: { guest_id: string; wedding_id: string; checked_in_at: string }[] = JSON.parse(pendingRaw);
      if (!pending.length) return;

      for (const item of pending) {
        await supabase.from("guests").update({ attendance_status: "checked_in", checked_in_at: item.checked_in_at }).eq("id", item.guest_id);
        await supabase.from("check_ins").insert({ guest_id: item.guest_id, wedding_id: item.wedding_id, verified_by: user.id });
      }
      localStorage.removeItem("wp_pending_checkins");
      toast.success("Synced offline check-ins to server!");
    } catch {
      /* retry later */
    }
  }

  async function processCheckIn(ticketId: string) {
    if (!selectedWedding || !user) return;
    const nowIso = new Date().toISOString();

    if (navigator.onLine) {
      try {
        const { data: guest } = await supabase.from("guests").select("*").eq("ticket_id", ticketId).eq("wedding_id", selectedWedding).maybeSingle();
        if (!guest) { setScanResult({ guest: {} as Guest, status: "not_found" }); return; }
        if (guest.attendance_status === "checked_in") { setScanResult({ guest, status: "duplicate" }); return; }

        await supabase.from("guests").update({ attendance_status: "checked_in", checked_in_at: nowIso }).eq("id", guest.id);
        await supabase.from("check_ins").insert({ guest_id: guest.id, wedding_id: selectedWedding, verified_by: user.id });

        setScanResult({ guest, status: "success" });
        toast.success(`Checked in: ${guest.full_name}`);
        const { data: ci } = await supabase.from("check_ins").select("*").eq("wedding_id", selectedWedding).order("checked_in_at", { ascending: false }).limit(20);
        if (ci) setCheckIns(ci);
        return;
      } catch {
        /* Fall back to offline flow */
      }
    }

    // Offline process flow
    const cachedGuestsRaw = localStorage.getItem(`wp_guests_${selectedWedding}`);
    if (!cachedGuestsRaw) {
      setScanResult({ guest: {} as Guest, status: "not_found" });
      return;
    }

    const cachedGuests: Guest[] = JSON.parse(cachedGuestsRaw);
    const guestIndex = cachedGuests.findIndex((g) => g.ticket_id === ticketId);
    if (guestIndex === -1) {
      setScanResult({ guest: {} as Guest, status: "not_found" });
      return;
    }

    const guest = cachedGuests[guestIndex];
    if (guest.attendance_status === "checked_in") {
      setScanResult({ guest, status: "duplicate", offline: true });
      return;
    }

    // Update local offline cache
    guest.attendance_status = "checked_in";
    guest.checked_in_at = nowIso;
    cachedGuests[guestIndex] = guest;
    localStorage.setItem(`wp_guests_${selectedWedding}`, JSON.stringify(cachedGuests));

    // Queue pending check-in for sync
    const pendingRaw = localStorage.getItem("wp_pending_checkins") ?? "[]";
    const pending = JSON.parse(pendingRaw);
    pending.push({ guest_id: guest.id, wedding_id: selectedWedding, checked_in_at: nowIso });
    localStorage.setItem("wp_pending_checkins", JSON.stringify(pending));

    setScanResult({ guest, status: "success", offline: true });
    toast.info(`Offline Check-In: ${guest.full_name}`, "Saved locally. Will sync when reconnected.");
    setCheckIns((prev) => [{ id: "off-" + Date.now(), guest_id: guest.id, wedding_id: selectedWedding, checked_in_at: nowIso, verified_by: user.id }, ...prev]);
  }

  async function startScan() {
    setScanning(true);
    setScanResult(null);
    setTimeout(async () => {
      try {
        const scanner = new Html5Qrcode(scannerId);
        scannerRef.current = scanner;
        await scanner.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          (decodedText) => {
            scanner.stop();
            setScanning(false);
            const ticketId = decodedText.split("/invite/").pop() ?? decodedText;
            processCheckIn(ticketId);
          },
          () => {}
        );
      } catch (err) {
        console.error("Scanner error:", err);
        setScanning(false);
      }
    }, 100);
  }

  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        try { scannerRef.current.stop(); } catch { /* ignore */ }
      }
    };
  }, []);

  async function stopScan() {
    if (scannerRef.current) {
      try { await scannerRef.current.stop(); } catch { /* ignore */ }
      scannerRef.current = null;
    }
    setScanning(false);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold text-stone-900 dark:text-stone-100">Check-In</h1>
          <p className="mt-1 text-sm text-stone-500">Scan guest QR codes to verify entry at the wedding venue.</p>
        </div>
        {isOffline && (
          <div className="flex items-center gap-2 rounded-xl border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-800 dark:border-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
            <WifiOff className="h-4 w-4 shrink-0 text-amber-600" />
            <span>Offline Mode Active — Scans are saved locally</span>
          </div>
        )}
      </div>

      {weddings.length === 0 ? (
        <Card className="py-12 text-center">
          <QrCode className="mx-auto h-12 w-12 text-stone-300 dark:text-stone-600" />
          <p className="mt-4 text-sm text-stone-400">Create a wedding first to use check-in.</p>
        </Card>
      ) : (
        <>
          <Card>
            <Field label="Select Wedding">
              <Select value={selectedWedding} onChange={(e) => setSelectedWedding(e.target.value)}>
                {weddings.map((w) => <option key={w.id} value={w.id}>{w.title || `${w.bride_name} & ${w.groom_name}`}</option>)}
              </Select>
            </Field>
          </Card>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <h3 className="font-serif text-lg font-semibold text-stone-900 dark:text-stone-100">QR Scanner</h3>
              <div id={scannerId} className="mt-4 overflow-hidden rounded-xl bg-stone-900" style={{ minHeight: scanning ? "300px" : "0" }} />
              {!scanning ? (
                <Button className="mt-4 w-full" onClick={startScan}><Camera className="h-4 w-4" /> Start Scanning</Button>
              ) : (
                <Button className="mt-4 w-full" variant="danger" onClick={stopScan}>Stop Scanning</Button>
              )}
              <div className="mt-4 border-t border-stone-200 pt-4 dark:border-stone-800">
                <p className="mb-2 text-sm font-medium text-stone-600 dark:text-stone-300">Manual Check-In</p>
                <div className="flex gap-2">
                  <Input value={manualTicket} onChange={(e) => setManualTicket(e.target.value)} placeholder="Enter ticket ID..." className="flex-1" />
                  <Button variant="secondary" onClick={() => { processCheckIn(manualTicket); setManualTicket(""); }} disabled={!manualTicket}><Search className="h-4 w-4" /></Button>
                </div>
              </div>
            </Card>

            <Card>
              <h3 className="font-serif text-lg font-semibold text-stone-900 dark:text-stone-100">Scan Result</h3>
              <AnimatePresence mode="wait">
                {scanResult ? (
                  <motion.div key={scanResult.status} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="mt-4">
                    {scanResult.status === "success" && (
                      <div className="rounded-xl border border-green-200 bg-green-50 p-6 dark:border-green-800 dark:bg-green-900/20">
                        <CheckCircle2 className="mx-auto h-12 w-12 text-green-600 dark:text-green-400" />
                        <p className="mt-3 text-center text-lg font-semibold text-green-700 dark:text-green-300">Checked In!</p>
                        {scanResult.offline && <p className="mt-1 text-center text-xs font-semibold text-amber-600 dark:text-amber-400">(Saved Offline)</p>}
                        <div className="mt-4 space-y-1 text-center text-sm">
                          <p className="font-medium text-stone-900 dark:text-stone-100">{scanResult.guest.full_name}</p>
                          <Badge className={CATEGORY_COLORS[scanResult.guest.category]}>{CATEGORY_LABELS[scanResult.guest.category]}</Badge>
                          {scanResult.guest.rsvp_attendees && <p className="text-stone-500">{scanResult.guest.rsvp_attendees} attendees</p>}
                        </div>
                      </div>
                    )}
                    {scanResult.status === "duplicate" && (
                      <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 dark:border-amber-800 dark:bg-amber-900/20">
                        <XCircle className="mx-auto h-12 w-12 text-amber-600 dark:text-amber-400" />
                        <p className="mt-3 text-center text-lg font-semibold text-amber-700 dark:text-amber-300">Already Checked In</p>
                        <p className="mt-2 text-center text-sm text-stone-600 dark:text-stone-400">{scanResult.guest.full_name}</p>
                      </div>
                    )}
                    {scanResult.status === "not_found" && (
                      <div className="rounded-xl border border-red-200 bg-red-50 p-6 dark:border-red-800 dark:bg-red-900/20">
                        <XCircle className="mx-auto h-12 w-12 text-red-600 dark:text-red-400" />
                        <p className="mt-3 text-center text-lg font-semibold text-red-700 dark:text-red-300">Not Found</p>
                        <p className="mt-2 text-center text-sm text-stone-600 dark:text-stone-400">This ticket is not valid for this wedding.</p>
                      </div>
                    )}
                  </motion.div>
                ) : (
                  <div className="mt-4 flex h-48 items-center justify-center text-center">
                    <div>
                      <QrCode className="mx-auto h-10 w-10 text-stone-300 dark:text-stone-600" />
                      <p className="mt-3 text-sm text-stone-400">Scan a QR code to check in a guest</p>
                    </div>
                  </div>
                )}
              </AnimatePresence>
            </Card>
          </div>

          <Card>
            <h3 className="font-serif text-lg font-semibold text-stone-900 dark:text-stone-100">Recent Check-Ins</h3>
            <p className="mt-1 text-sm text-stone-500">{checkIns.length} entries logged</p>
            {checkIns.length > 0 ? (
              <div className="mt-4 space-y-2">
                {checkIns.map((ci) => <CheckInRow key={ci.id} checkIn={ci} />)}
              </div>
            ) : (
              <div className="mt-6 flex items-center justify-center py-8 text-center">
                <div>
                  <Clock className="mx-auto h-8 w-8 text-stone-300 dark:text-stone-600" />
                  <p className="mt-2 text-sm text-stone-400">No check-ins yet</p>
                </div>
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  );
}

function CheckInRow({ checkIn }: { checkIn: CheckIn }) {
  const [name, setName] = useState("");
  useEffect(() => {
    supabase.from("guests").select("full_name").eq("id", checkIn.guest_id).maybeSingle().then(({ data }) => {
      setName(data?.full_name ?? "Unknown");
    });
  }, [checkIn.guest_id]);

  return (
    <div className="flex items-center justify-between rounded-xl border border-stone-100 p-3 dark:border-stone-800/50">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400">
          <CheckCircle2 className="h-4.5 w-4.5" />
        </div>
        <div>
          <p className="text-sm font-medium text-stone-900 dark:text-stone-100">{name}</p>
          <p className="text-xs text-stone-400">{formatDateTime(checkIn.checked_in_at)}</p>
        </div>
      </div>
    </div>
  );
}
