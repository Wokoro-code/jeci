import { Router } from "express";
import multer from "multer";
import { createContext } from "./context";
import { requireActiveAccount } from "../permissions";
import { storagePut } from "../storage";

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 Mo
const MAX_VIDEO_SIZE_BYTES = 60 * 1024 * 1024; // 60 Mo pour les vidéos de publication

const ALLOWED_MIME_TYPES_BY_PURPOSE: Record<string, string[]> = {
  avatar: ["image/jpeg", "image/png", "image/webp"],
  cover: ["image/jpeg", "image/png", "image/webp"],
  post_media: ["image/jpeg", "image/png", "image/webp", "video/mp4", "video/webm", "video/quicktime"],
  verification_document: ["image/jpeg", "image/png", "image/webp", "application/pdf"],
  message_attachment: ["image/jpeg", "image/png", "image/webp", "application/pdf"],
  community_document: ["image/jpeg", "image/png", "image/webp", "application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "application/vnd.ms-excel", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"],
};

const MAX_SIZE_BYTES_BY_PURPOSE: Record<string, number> = {
  avatar: MAX_FILE_SIZE_BYTES,
  cover: MAX_FILE_SIZE_BYTES,
  post_media: MAX_VIDEO_SIZE_BYTES,
  verification_document: MAX_FILE_SIZE_BYTES,
  message_attachment: MAX_FILE_SIZE_BYTES,
  community_document: MAX_FILE_SIZE_BYTES,
};

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: MAX_VIDEO_SIZE_BYTES } });

export const uploadRouter = Router();

/**
 * Upload générique, protégé par la même session que le reste de
 * l'application (cookie de session tRPC). Le champ "purpose" détermine les
 * types MIME acceptés et le préfixe de rangement du fichier. Un compte
 * suspendu ou désactivé ne peut rien uploader (requireActiveAccount).
 */
uploadRouter.post("/", upload.single("file"), async (req, res) => {
  try {
    const ctx = await createContext({ req, res });
    if (!ctx.user) {
      res.status(401).json({ error: "Vous devez être connecté pour envoyer un fichier." });
      return;
    }
    requireActiveAccount(ctx.user.accountStatus);

    const purpose = typeof req.body?.purpose === "string" ? req.body.purpose : "message_attachment";
    const allowedMimeTypes = ALLOWED_MIME_TYPES_BY_PURPOSE[purpose];
    if (!allowedMimeTypes) {
      res.status(400).json({ error: "Type d'envoi inconnu." });
      return;
    }

    const file = req.file;
    if (!file) {
      res.status(400).json({ error: "Aucun fichier reçu." });
      return;
    }
    if (!allowedMimeTypes.includes(file.mimetype)) {
      res.status(400).json({ error: "Type de fichier non autorisé pour cet usage." });
      return;
    }
    const maxSize = MAX_SIZE_BYTES_BY_PURPOSE[purpose] ?? MAX_FILE_SIZE_BYTES;
    if (file.size > maxSize) {
      res.status(400).json({ error: `Fichier trop volumineux (maximum ${Math.round(maxSize / (1024 * 1024))} Mo pour cet usage).` });
      return;
    }

    const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-100);
    const relKey = `${purpose}/${ctx.user.id}/${safeName}`;
    const { key, url } = await storagePut(relKey, file.buffer, file.mimetype);

    res.json({ storageKey: key, url, originalName: file.originalname, mimeType: file.mimetype, sizeBytes: file.size });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Échec de l'envoi du fichier.";
    res.status(400).json({ error: message });
  }
});
