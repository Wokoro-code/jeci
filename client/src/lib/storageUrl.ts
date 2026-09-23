/** Construit l'URL publique d'un fichier à partir de sa clé de stockage (voir server/storage.ts). */
export function storageUrl(storageKey?: string | null): string | undefined {
  if (!storageKey) return undefined;
  if (storageKey.startsWith("http://") || storageKey.startsWith("https://")) return storageKey;
  return `/uploads/${storageKey}`;
}
