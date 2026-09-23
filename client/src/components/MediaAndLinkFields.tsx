/** JECI — Contrôle réutilisable photo/vidéo + lien pour tous les formulaires de création (cahier §13 : « texte, image, vidéo, document, lien »). */
import { useState } from "react";
import { Link2, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { uploadFile, type UploadPurpose } from "@/lib/upload";

export function MediaAndLinkFields({
  mediaStorageKey,
  onMediaChange,
  linkUrl,
  onLinkChange,
  purpose = "post_media",
  linkLabel = "Lien (optionnel)",
}: {
  mediaStorageKey?: string;
  onMediaChange: (result: { storageKey?: string; mimeType?: string }) => void;
  linkUrl: string;
  onLinkChange: (value: string) => void;
  purpose?: UploadPurpose;
  linkLabel?: string;
}) {
  const [uploading, setUploading] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);

  const handleChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setUploading(true);
    try {
      const result = await uploadFile(file, purpose);
      onMediaChange({ storageKey: result.storageKey, mimeType: result.mimeType });
      setFileName(result.originalName);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Échec de l'envoi du fichier.");
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = () => {
    onMediaChange({ storageKey: undefined, mimeType: undefined });
    setFileName(null);
  };

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <Label>Photo ou vidéo (optionnel)</Label>
        {mediaStorageKey ? (
          <div className="flex items-center justify-between rounded-lg border border-[#D9D4CC] bg-[#F7F4EE] px-3 py-2 text-xs font-bold text-[#3D495B]">
            <span className="truncate">{fileName ?? "Fichier ajouté"} ✓</span>
            <button type="button" onClick={handleRemove} className="ml-2 shrink-0 rounded-full p-1 text-[#9AA1AA] hover:bg-white hover:text-[#9B2226]" aria-label="Retirer le fichier">
              <X size={14} />
            </button>
          </div>
        ) : (
          <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed border-[#D9D4CC] py-3 text-xs font-bold text-[#536174] hover:bg-[#F7F4EE]">
            <Upload size={16} />
            {uploading ? "Envoi..." : "Ajouter une photo ou une vidéo"}
            <input type="file" accept="image/png,image/jpeg,image/webp,video/mp4,video/webm,video/quicktime" className="hidden" onChange={handleChange} disabled={uploading} />
          </label>
        )}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="media-link-url" className="flex items-center gap-1.5">
          <Link2 size={13} /> {linkLabel}
        </Label>
        <Input id="media-link-url" type="url" placeholder="https://…" value={linkUrl} onChange={(event) => onLinkChange(event.target.value)} />
      </div>
    </div>
  );
}
