import { useEffect, useState, forwardRef, type ReactNode } from "react";
import QRCode from "qrcode";
import { Calendar, Clock, MapPin, Heart, BookOpen } from "lucide-react";
import { formatDate, formatTime } from "@/lib/utils";
import type { Wedding } from "@/lib/types";

interface InvitationCardProps {
  wedding: Wedding;
  guestName: string;
  ticketId: string;
  qrValue?: string;
  showStory?: boolean;
  children?: ReactNode;
}

interface TemplateStyle {
  wrapper: string;
  text: string;
  accent: string;
  border: string;
  divider: string;
  bgHex: string;
  accentHex: string;
  scriptColor: string;
}

const templateStyles: Record<string, TemplateStyle> = {
  classic: {
    wrapper: "bg-gradient-to-br from-amber-50 to-yellow-100",
    text: "text-amber-950",
    accent: "text-amber-700",
    border: "border-amber-300",
    divider: "bg-amber-300",
    bgHex: "#fefce8",
    accentHex: "#b45309",
    scriptColor: "#92400e",
  },
  modern: {
    wrapper: "bg-gradient-to-br from-stone-50 to-stone-100",
    text: "text-stone-900",
    accent: "text-stone-600",
    border: "border-stone-300",
    divider: "bg-stone-300",
    bgHex: "#fafaf9",
    accentHex: "#57534e",
    scriptColor: "#44403c",
  },
  romantic: {
    wrapper: "bg-gradient-to-br from-rose-50 to-pink-100",
    text: "text-rose-950",
    accent: "text-rose-500",
    border: "border-rose-300",
    divider: "bg-rose-300",
    bgHex: "#fff1f2",
    accentHex: "#f43f5e",
    scriptColor: "#e11d48",
  },
  botanical: {
    wrapper: "bg-gradient-to-br from-emerald-50 to-green-100",
    text: "text-emerald-950",
    accent: "text-emerald-600",
    border: "border-emerald-300",
    divider: "bg-emerald-300",
    bgHex: "#ecfdf5",
    accentHex: "#059669",
    scriptColor: "#047857",
  },
  royal: {
    wrapper: "bg-gradient-to-br from-yellow-100 via-amber-100 to-yellow-200",
    text: "text-yellow-950",
    accent: "text-yellow-700",
    border: "border-yellow-400",
    divider: "bg-yellow-400",
    bgHex: "#fef9c3",
    accentHex: "#b45309",
    scriptColor: "#92400e",
  },
  rustic: {
    wrapper: "bg-gradient-to-br from-orange-50 to-amber-100",
    text: "text-orange-950",
    accent: "text-orange-700",
    border: "border-orange-300",
    divider: "bg-orange-300",
    bgHex: "#fff7ed",
    accentHex: "#c2410c",
    scriptColor: "#9a3412",
  },
  ethiopian: {
    wrapper: "bg-gradient-to-br from-green-100 via-yellow-50 to-red-100",
    text: "text-green-950",
    accent: "text-green-700",
    border: "border-green-500",
    divider: "bg-green-500",
    bgHex: "#f0fdf4",
    accentHex: "#15803d",
    scriptColor: "#15803d",
  },
  elegant: {
    wrapper: "bg-white",
    text: "text-gray-950",
    accent: "text-gray-700",
    border: "border-gray-900",
    divider: "bg-gray-900",
    bgHex: "#ffffff",
    accentHex: "#111827",
    scriptColor: "#111827",
  },
  dark: {
    wrapper: "bg-gradient-to-br from-stone-900 to-stone-950",
    text: "text-rose-100",
    accent: "text-rose-300",
    border: "border-rose-800",
    divider: "bg-rose-800",
    bgHex: "#1c1917",
    accentHex: "#fda4af",
    scriptColor: "#fda4af",
  },
};

export const InvitationCard = forwardRef<HTMLDivElement, InvitationCardProps>(
  function InvitationCard({ wedding, guestName, ticketId, qrValue, showStory = false, children }, ref) {
    const [qrDataUrl, setQrDataUrl] = useState<string>("");
    const style = templateStyles[wedding.template_id] ?? templateStyles.classic;
    const isDark = wedding.template_id === "dark";
    const isEthiopian = wedding.template_id === "ethiopian";

    useEffect(() => {
      const value = qrValue ?? `${window.location.origin}/invite/${ticketId}`;
      QRCode.toDataURL(value, {
        width: 200,
        margin: 1,
        color: { dark: style.accentHex, light: isDark ? "#1c1917" : "#ffffff" },
      })
        .then(setQrDataUrl)
        .catch(() => setQrDataUrl(""));
    }, [ticketId, qrValue, style.accentHex, isDark]);

    return (
      <div
        ref={ref}
        className={`relative overflow-hidden rounded-2xl border-2 ${style.border} ${style.wrapper} p-8 text-center`}
      >
        {/* Decorative corners */}
        <div className={`absolute left-4 top-4 h-8 w-8 border-l-2 border-t-2 ${isDark ? "border-rose-600" : "border-current"} opacity-30`} />
        <div className={`absolute right-4 top-4 h-8 w-8 border-r-2 border-t-2 ${isDark ? "border-rose-600" : "border-current"} opacity-30`} />
        <div className={`absolute bottom-4 left-4 h-8 w-8 border-b-2 border-l-2 ${isDark ? "border-rose-600" : "border-current"} opacity-30`} />
        <div className={`absolute bottom-4 right-4 h-8 w-8 border-b-2 border-r-2 ${isDark ? "border-rose-600" : "border-current"} opacity-30`} />

        {/* Ethiopian stripe accent */}
        {isEthiopian && (
          <div className="absolute left-0 top-0 flex h-2 w-full">
            <div className="flex-1 bg-green-600" />
            <div className="flex-1 bg-yellow-400" />
            <div className="flex-1 bg-red-600" />
          </div>
        )}

        <div className="mx-auto max-w-md">
          <p className={`font-script text-3xl ${style.accent}`}>
            {isEthiopian ? "የሰርግ ግብዣ" : "Wedding Invitation"}
          </p>
          <div className={`mx-auto my-4 h-px w-24 ${style.divider} opacity-50`} />

          <p className={`text-sm uppercase tracking-widest ${style.accent}`}>Together with their families</p>

          <h2 className={`mt-4 font-serif text-4xl font-bold ${style.text}`}>{wedding.bride_name}</h2>
          <p className={`my-2 font-script text-3xl ${style.accent}`}>&amp;</p>
          <h2 className={`font-serif text-4xl font-bold ${style.text}`}>{wedding.groom_name}</h2>

          <p className={`mt-6 text-sm ${style.accent}`}>Request the pleasure of the company of</p>
          <p className={`mt-1 font-serif text-xl font-semibold ${style.text}`}>{guestName}</p>

          <div className={`mx-auto my-6 h-px w-24 ${style.divider} opacity-50`} />

          <div className={`space-y-2 text-sm ${style.text}`}>
            <div className="flex items-center justify-center gap-2">
              <Calendar className="h-4 w-4 opacity-60" />
              {formatDate(wedding.date)}
            </div>
            {wedding.start_time && (
              <div className="flex items-center justify-center gap-2">
                <Clock className="h-4 w-4 opacity-60" />
                {formatTime(wedding.start_time)}{wedding.end_time ? ` – ${formatTime(wedding.end_time)}` : ""}
              </div>
            )}
            {wedding.venue_name && (
              <div className="flex items-center justify-center gap-2">
                <MapPin className="h-4 w-4 opacity-60" />
                {wedding.venue_name}
              </div>
            )}
            {wedding.venue_address && <p className="text-xs opacity-60">{wedding.venue_address}</p>}
          </div>

          {/* Story/About section (optional) */}
          {showStory && wedding.story && (
            <div className={`mt-6 rounded-xl border ${style.border} p-4 text-left opacity-90`}>
              <div className={`mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest ${style.accent}`}>
                <BookOpen className="h-3.5 w-3.5" /> Our Story
              </div>
              <p className={`text-sm leading-relaxed ${style.text}`}>{wedding.story}</p>
            </div>
          )}

          {/* QR */}
          {qrDataUrl && (
            <div className="mt-6 flex flex-col items-center">
              <div className={`rounded-xl p-3 shadow-sm ${isDark ? "bg-stone-800" : "bg-white"}`}>
                <img src={qrDataUrl} alt="QR Code" className="h-32 w-32" />
              </div>
              <p className={`mt-2 font-mono text-xs ${style.accent}`}>{ticketId}</p>
            </div>
          )}

          {wedding.dress_code && (
            <p className={`mt-4 text-xs ${style.accent}`}>Dress Code: {wedding.dress_code}</p>
          )}

          {children}

          <div className={`mx-auto mt-6 h-px w-24 ${style.divider} opacity-50`} />
          <p className={`mt-3 flex items-center justify-center gap-1.5 text-xs ${style.accent}`}>
            <Heart className="h-3 w-3" fill="currentColor" /> WeddingPass
          </p>
        </div>
      </div>
    );
  }
);
