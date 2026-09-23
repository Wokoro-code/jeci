import { and, desc, eq, gt, isNull, like, or } from "drizzle-orm";
import { opportunities, users } from "../../drizzle/schema";
import { getDb } from "./client";
import { logAction } from "./audit";

export class OpportunityError extends Error {}

export async function createOpportunity(authorId: number, input: { title: string; type: "job" | "internship" | "volunteering" | "scholarship" | "training" | "call_for_projects" | "funding" | "mission" | "expertise" | "other"; organization?: string; location?: string; description: string; applyUrl?: string; contactEmail?: string; closesAt?: Date }) {
  const db = await getDb();
  if (!db) throw new OpportunityError("Base de données indisponible");
  const [{ id }] = await db.insert(opportunities).values({ authorId, ...input }).$returningId();
  return id;
}

/** Liste publique : uniquement les offres publiées et non expirées. */
export type OpportunityFilters = { type?: string; location?: string; search?: string };

export async function listPublishedOpportunities(filters: OpportunityFilters = {}) {
  const db = await getDb();
  if (!db) return [];
  const now = new Date();
  const conditions = [eq(opportunities.status, "published"), or(gt(opportunities.closesAt, now), isNull(opportunities.closesAt))];
  if (filters.type) conditions.push(eq(opportunities.type, filters.type as typeof opportunities.$inferSelect["type"]));
  if (filters.location) conditions.push(like(opportunities.location, `%${filters.location}%`));
  if (filters.search) conditions.push(or(like(opportunities.title, `%${filters.search}%`), like(opportunities.organization, `%${filters.search}%`), like(opportunities.description, `%${filters.search}%`)));
  return db
    .select({ id: opportunities.id, title: opportunities.title, type: opportunities.type, organization: opportunities.organization, location: opportunities.location, description: opportunities.description, applyUrl: opportunities.applyUrl, closesAt: opportunities.closesAt, publishedAt: opportunities.publishedAt, authorName: users.name })
    .from(opportunities)
    .innerJoin(users, eq(users.id, opportunities.authorId))
    .where(and(...conditions))
    .orderBy(desc(opportunities.publishedAt));
}

export async function listMyOpportunities(authorId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(opportunities).where(eq(opportunities.authorId, authorId)).orderBy(desc(opportunities.createdAt));
}

export async function updateMyOpportunity(userId: number, opportunityId: number, input: Partial<{ title: string; description: string; applyUrl: string; location: string; closesAt: Date }>) {
  const db = await getDb();
  if (!db) throw new OpportunityError("Base de données indisponible");
  const [opportunity] = await db.select().from(opportunities).where(eq(opportunities.id, opportunityId)).limit(1);
  if (!opportunity || opportunity.authorId !== userId) throw new OpportunityError("Vous ne pouvez modifier que vos propres offres.");
  if (opportunity.status === "archived") throw new OpportunityError("Cette offre est close et ne peut plus être modifiée.");
  await db.update(opportunities).set(input).where(eq(opportunities.id, opportunityId));
}

export async function closeMyOpportunity(userId: number, opportunityId: number) {
  const db = await getDb();
  if (!db) throw new OpportunityError("Base de données indisponible");
  const [opportunity] = await db.select().from(opportunities).where(eq(opportunities.id, opportunityId)).limit(1);
  if (!opportunity || opportunity.authorId !== userId) throw new OpportunityError("Vous ne pouvez clôturer que vos propres offres.");
  await db.update(opportunities).set({ status: "archived" }).where(eq(opportunities.id, opportunityId));
}

/** File d'attente admin (validation avant publication). */
export async function listPendingOpportunities() {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({ id: opportunities.id, title: opportunities.title, type: opportunities.type, organization: opportunities.organization, description: opportunities.description, createdAt: opportunities.createdAt, authorName: users.name })
    .from(opportunities)
    .innerJoin(users, eq(users.id, opportunities.authorId))
    .where(eq(opportunities.status, "pending"))
    .orderBy(opportunities.createdAt);
}

export async function decideOpportunity(actorId: number, opportunityId: number, decision: "published" | "rejected", reason?: string) {
  const db = await getDb();
  if (!db) throw new OpportunityError("Base de données indisponible");
  await db.update(opportunities).set({ status: decision, moderationReason: reason ?? null, publishedAt: decision === "published" ? new Date() : null }).where(eq(opportunities.id, opportunityId));
  await logAction({ actorId, action: "opportunity.decide", entityType: "opportunity", entityId: opportunityId, reason, after: { decision } });
}

/** Vue admin complète, tous statuts confondus (au-delà de la seule file "pending"). */
export async function listAllOpportunitiesForAdmin() {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({ id: opportunities.id, title: opportunities.title, type: opportunities.type, organization: opportunities.organization, status: opportunities.status, createdAt: opportunities.createdAt, authorName: users.name })
    .from(opportunities)
    .innerJoin(users, eq(users.id, opportunities.authorId))
    .orderBy(desc(opportunities.createdAt));
}
