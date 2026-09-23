import { auditLogs } from "../../drizzle/schema";
import { getDb } from "./client";

export type AuditEntry = {
  actorId: number | null;
  actorRole?: string | null;
  action: string;
  entityType: string;
  entityId: string | number;
  reason?: string | null;
  before?: unknown;
  after?: unknown;
};

/**
 * Journal d'audit minimal (référentiel section 7) : auteur, rôle utilisé,
 * action, ressource, horodatage, motif, état avant/après. Ne doit jamais
 * recevoir le texte intégral d'une conversation privée hors signalement
 * explicitement traité — c'est aux appelants de ne transmettre que ce qui
 * est strictement nécessaire.
 */
export async function logAction(entry: AuditEntry): Promise<void> {
  const db = await getDb();
  if (!db) return;
  try {
    await db.insert(auditLogs).values({
      actorId: entry.actorId,
      actorRole: entry.actorRole ?? null,
      action: entry.action,
      entityType: entry.entityType,
      entityId: String(entry.entityId),
      reason: entry.reason ?? null,
      before: entry.before ?? null,
      after: entry.after ?? null,
    });
  } catch (error) {
    // L'audit ne doit jamais faire échouer l'action métier elle-même.
    console.error("[Audit] Failed to record entry:", error);
  }
}
