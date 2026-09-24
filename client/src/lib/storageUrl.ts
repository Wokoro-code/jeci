/** Construit l'URL publique d'un fichier à partir de sa clé de stockage. */

const PUBLIC_STORAGE_BASE_URL = (
  import.meta.env.VITE_S3_PUBLIC_BASE_URL as string | undefined
)?.replace(/\/+$/, "");

export function storageUrl(storageKey?: string | null): string | undefined {
  if (!storageKey) return undefined;

  // Si la valeur est déjà une URL complète, on l'utilise directement.
  if (storageKey.startsWith("http://") || storageKey.startsWith("https://")) {
    return storageKey;
  }

  // Les fichiers R2 sont servis directement depuis leur URL publique.
  if (PUBLIC_STORAGE_BASE_URL) {
    return `${PUBLIC_STORAGE_BASE_URL}/${storageKey.replace(/^\/+/, "")}`;
  }

  // Fallback local si aucune URL publique n'est configurée.
  return `/uploads/${storageKey.replace(/^\/+/, "")}`;
}