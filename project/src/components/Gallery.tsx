import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight, Upload, Trash2, Loader2, Image } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/Button";
import type { WeddingPhoto } from "@/lib/types";

interface GalleryProps {
  weddingId: string;
  editable?: boolean;
}

export function Gallery({ weddingId, editable = false }: GalleryProps) {
  const { user } = useAuth();
  const [photos, setPhotos] = useState<WeddingPhoto[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadPhotos();
  }, [weddingId]);

  async function loadPhotos() {
    const { data } = await supabase
      .from("wedding_photos")
      .select("*")
      .eq("wedding_id", weddingId)
      .order("sort_order", { ascending: true });
    setPhotos((data as WeddingPhoto[]) ?? []);
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length || !user) return;
    setUploading(true);
    for (const file of files) {
      const ext = file.name.split(".").pop();
      const path = `${user.id}/${weddingId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error: upErr } = await supabase.storage.from("wedding-photos").upload(path, file);
      if (upErr) continue;
      const { data: urlData } = supabase.storage.from("wedding-photos").getPublicUrl(path);
      await supabase.from("wedding_photos").insert({
        wedding_id: weddingId,
        organizer_id: user.id,
        storage_path: path,
        url: urlData.publicUrl,
        sort_order: photos.length,
      });
    }
    await loadPhotos();
    setUploading(false);
    if (fileRef.current) fileRef.current.value = "";
  }

  async function handleDelete(photo: WeddingPhoto) {
    await supabase.storage.from("wedding-photos").remove([photo.storage_path]);
    await supabase.from("wedding_photos").delete().eq("id", photo.id);
    setPhotos((prev) => prev.filter((p) => p.id !== photo.id));
  }

  const prev = () => setLightboxIndex((i) => (i !== null ? (i - 1 + photos.length) % photos.length : null));
  const next = () => setLightboxIndex((i) => (i !== null ? (i + 1) % photos.length : null));

  if (photos.length === 0 && !editable) return null;

  return (
    <div>
      {editable && (
        <div className="mb-4 flex items-center gap-3">
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleUpload}
          />
          <Button
            variant="secondary"
            size="sm"
            disabled={uploading}
            onClick={() => fileRef.current?.click()}
          >
            {uploading ? (
              <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Uploading...</>
            ) : (
              <><Upload className="h-3.5 w-3.5" /> Upload Photos</>
            )}
          </Button>
          <span className="text-xs text-stone-400">{photos.length} photo{photos.length !== 1 ? "s" : ""}</span>
        </div>
      )}

      {photos.length === 0 && editable && (
        <div
          onClick={() => fileRef.current?.click()}
          className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-stone-200 py-12 text-center transition-colors hover:border-gold-300 hover:bg-gold-50 dark:border-stone-700 dark:hover:border-gold-700"
        >
          <Image className="h-10 w-10 text-stone-300 dark:text-stone-600" />
          <p className="mt-3 text-sm font-medium text-stone-500">Click to upload gallery photos</p>
          <p className="mt-1 text-xs text-stone-400">JPEG, PNG, WebP — up to 10 MB each</p>
        </div>
      )}

      {photos.length > 0 && (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
          {photos.map((photo, idx) => (
            <motion.div
              key={photo.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="group relative aspect-square cursor-pointer overflow-hidden rounded-xl bg-stone-100 dark:bg-stone-800"
              onClick={() => setLightboxIndex(idx)}
            >
              <img
                src={photo.url}
                alt={photo.caption ?? "Wedding photo"}
                loading="lazy"
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
              {editable && (
                <button
                  onClick={(e) => { e.stopPropagation(); handleDelete(photo); }}
                  className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-red-600 text-white opacity-0 transition-opacity group-hover:opacity-100"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </motion.div>
          ))}
        </div>
      )}

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxIndex !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
            onClick={() => setLightboxIndex(null)}
          >
            <button
              onClick={(e) => { e.stopPropagation(); prev(); }}
              className="absolute left-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <motion.img
              key={lightboxIndex}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              src={photos[lightboxIndex].url}
              alt={photos[lightboxIndex].caption ?? ""}
              className="max-h-[85vh] max-w-[90vw] rounded-xl object-contain shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
            <button
              onClick={(e) => { e.stopPropagation(); next(); }}
              className="absolute right-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
            <button
              onClick={() => setLightboxIndex(null)}
              className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
            >
              <X className="h-5 w-5" />
            </button>
            {photos[lightboxIndex].caption && (
              <p className="absolute bottom-6 left-1/2 -translate-x-1/2 rounded-full bg-black/60 px-4 py-1.5 text-sm text-white">
                {photos[lightboxIndex].caption}
              </p>
            )}
            <p className="absolute bottom-6 right-6 text-xs text-white/50">
              {lightboxIndex + 1} / {photos.length}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
