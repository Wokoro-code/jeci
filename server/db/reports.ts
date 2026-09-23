import { desc, eq } from "drizzle-orm";
import { reports, users } from "../../drizzle/schema";
import { getDb } from "./client";
import { logAction } from "./audit";

export async function createReport(reporterId: number, input: { targetType: "post" | "comment" | "message" | "profile" | "opportunity" | "event" | "project"; targetId: number; reason: string; details?: string }) {
  const db = await getDb();
  if (!db) throw new Error("Base de données indisponible");
  const [{ id }] = await db.insert(reports).values({ reporterId, ...input }).$returningId();
  return id;
}

export async function listMyReports(reporterId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(reports).where(eq(reports.reporterId, reporterId)).orderBy(desc(reports.createdAt));
}

/** File de signalements pour Modérateur/Administrateur. */
export async function listReportQueue() {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({ id: reports.id, targetType: reports.targetType, targetId: reports.targetId, reason: reports.reason, details: reports.details, status: reports.status, createdAt: reports.createdAt, reporterName: users.name })
    .from(reports)
    .innerJoin(users, eq(users.id, reports.reporterId))
    .orderBy(desc(reports.createdAt));
}

/**
 * Décision de modération. Le Modérateur peut conserver, classer, masquer
 * temporairement ou escalader ; le retrait définitif reste exclusivement du
 * ressort de l'Administrateur (référentiel section 8). Cette fonction ne
 * change que l'état du signalement — l'action sur le contenu lui-même
 * (masquage, retrait) est effectuée par le module concerné (feed, etc.).
 */
export async function decideReport(actorId: number, actorRole: string, reportId: number, decision: "under_review" | "escalated" | "resolved" | "dismissed", reason?: string) {
  const db = await getDb();
  if (!db) throw new Error("Base de données indisponible");
  if (decision === "resolved" && actorRole !== "administrator") throw new Error("Seul un administrateur peut clôturer définitivement un signalement.");
  await db.update(reports).set({ status: decision, decision, decisionReason: reason ?? null, handledBy: actorId, resolvedAt: decision === "resolved" || decision === "dismissed" ? new Date() : null }).where(eq(reports.id, reportId));
  await logAction({ actorId, actorRole, action: "report.decide", entityType: "report", entityId: reportId, reason, after: { decision } });
}
