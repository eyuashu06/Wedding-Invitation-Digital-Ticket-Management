import { useState } from "react";
import { Check, Copy, Mail, Share2 } from "lucide-react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

export interface ShareOptions {
  ticketId: string;
  guestName: string;
  weddingTitle: string;
  weddingDate?: string | null;
}

export function getInviteUrl(ticketId: string) {
  return `${window.location.origin}/invite/${ticketId}`;
}

function buildShareText(opts: ShareOptions) {
  const url = getInviteUrl(opts.ticketId);
  return `You're invited to ${opts.weddingTitle}! Open your personal invitation here: ${url}`;
}

export function WhatsAppShareButton({ opts, compact }: { opts: ShareOptions; compact?: boolean }) {
  const text = encodeURIComponent(buildShareText(opts));
  const href = `https://wa.me/?text=${text}`;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={compact ? compactBtnCls + " bg-[#25D366]/10 text-[#25D366] border-[#25D366]/30 hover:bg-[#25D366]/20" : ""}
      title="Share on WhatsApp"
    >
      {compact ? (
        <>
          <WhatsAppIcon />
          WhatsApp
        </>
      ) : (
        <span className="flex items-center gap-2"><WhatsAppIcon /> Share via WhatsApp</span>
      )}
    </a>
  );
}

export function TelegramShareButton({ opts, compact }: { opts: ShareOptions; compact?: boolean }) {
  const url = encodeURIComponent(getInviteUrl(opts.ticketId));
  const text = encodeURIComponent(`You're invited to ${opts.weddingTitle}!`);
  const href = `https://t.me/share/url?url=${url}&text=${text}`;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={compact ? compactBtnCls + " bg-[#2AABEE]/10 text-[#2AABEE] border-[#2AABEE]/30 hover:bg-[#2AABEE]/20" : ""}
      title="Share on Telegram"
    >
      {compact ? (
        <>
          <TelegramIcon />
          Telegram
        </>
      ) : (
        <span className="flex items-center gap-2"><TelegramIcon /> Share via Telegram</span>
      )}
    </a>
  );
}

export function EmailShareButton({ opts, compact }: { opts: ShareOptions; compact?: boolean }) {
  const subject = encodeURIComponent(`Invitation: ${opts.weddingTitle}`);
  const body = encodeURIComponent(
    `Dear ${opts.guestName},\n\nYou are cordially invited to ${opts.weddingTitle}.\n\nOpen your personal digital invitation here:\n${getInviteUrl(opts.ticketId)}\n\nWith love and warmth,\nThe Couple`
  );
  const href = `mailto:?subject=${subject}&body=${body}`;
  return (
    <a
      href={href}
      className={compact ? compactBtnCls + " bg-stone-100 text-stone-600 border-stone-300 hover:bg-stone-200 dark:bg-stone-800 dark:text-stone-300 dark:border-stone-600" : ""}
      title="Share via Email"
    >
      {compact ? (
        <>
          <Mail className="h-4 w-4" />
          Email
        </>
      ) : (
        <span className="flex items-center gap-2"><Mail className="h-4 w-4" /> Share via Email</span>
      )}
    </a>
  );
}

export function NativeShareButton({
  opts, compact, className,
}: { opts: ShareOptions; compact?: boolean; className?: string }) {
  const handleShare = async () => {
    const url = getInviteUrl(opts.ticketId);
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${opts.weddingTitle} — Invitation`,
          text: buildShareText(opts),
          url,
        });
      } catch { /* user cancelled */ }
    } else {
      await navigator.clipboard.writeText(url);
      alert("Invitation link copied to clipboard!");
    }
  };

  return (
    <button
      onClick={handleShare}
      title="Share invitation"
      className={compact ? compactBtnCls + " bg-gold-50 text-gold-700 border-gold-300 hover:bg-gold-100 dark:bg-gold-900/20 dark:text-gold-300 dark:border-gold-700" : className}
    >
      {compact ? (
        <>
          <Share2 className="h-4 w-4" />
          Share
        </>
      ) : (
        <span className="flex items-center gap-2"><Share2 className="h-4 w-4" /> Share</span>
      )}
    </button>
  );
}

export function CopyLinkButton({ ticketId, compact, className }: { ticketId: string; compact?: boolean; className?: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    await navigator.clipboard.writeText(getInviteUrl(ticketId));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={handleCopy}
      title={copied ? "Copied!" : "Copy invitation link"}
      className={
        compact
          ? compactBtnCls + (copied
            ? " bg-green-50 text-green-700 border-green-300 dark:bg-green-900/20 dark:text-green-300 dark:border-green-700"
            : " bg-stone-100 text-stone-600 border-stone-300 hover:bg-stone-200 dark:bg-stone-800 dark:text-stone-300 dark:border-stone-600")
          : className
      }
    >
      {compact ? (
        <>
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          {copied ? "Copied!" : "Copy"}
        </>
      ) : (
        copied ? <span className="flex items-center gap-2"><Check className="h-4 w-4" /> Copied!</span>
               : <span className="flex items-center gap-2"><Copy className="h-4 w-4" /> Copy Link</span>
      )}
    </button>
  );
}

/** Export a mounted DOM element as a PDF file. */
export async function exportCardAsPdf(el: HTMLElement, filename: string): Promise<void> {
  const canvas = await html2canvas(el, {
    scale: 2,
    useCORS: true,
    backgroundColor: "#ffffff",
    logging: false,
  });
  const imgData = canvas.toDataURL("image/png");
  const pdf = new jsPDF({ orientation: "portrait", unit: "px", format: [canvas.width / 2, canvas.height / 2] });
  pdf.addImage(imgData, "PNG", 0, 0, canvas.width / 2, canvas.height / 2);
  pdf.save(filename);
}

/** Export a mounted DOM element as a PNG. */
export async function exportCardAsPng(el: HTMLElement, filename: string): Promise<void> {
  const canvas = await html2canvas(el, {
    scale: 2,
    useCORS: true,
    backgroundColor: "#ffffff",
    logging: false,
  });
  const a = document.createElement("a");
  a.href = canvas.toDataURL("image/png");
  a.download = filename;
  a.click();
}

const compactBtnCls =
  "flex flex-col items-center gap-1 rounded-xl border px-2 py-2 text-xs font-medium transition-colors";

function WhatsAppIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

function TelegramIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
    </svg>
  );
}
