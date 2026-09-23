/** Client pour la route d'upload (voir server/_core/upload.ts). */
export type UploadPurpose = "avatar" | "cover" | "post_media" | "verification_document" | "message_attachment" | "community_document";

export type UploadResult = { storageKey: string; url: string; originalName: string; mimeType: string; sizeBytes: number };

export async function uploadFile(file: File, purpose: UploadPurpose): Promise<UploadResult> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("purpose", purpose);

  const response = await fetch("/api/upload", { method: "POST", body: formData, credentials: "include" });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.error ?? "Échec de l'envoi du fichier.");
  }
  return data as UploadResult;
}
