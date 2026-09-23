import { and, count, desc, eq, isNull, sql } from "drizzle-orm";
import { communities, communityDocuments, communityMembers, jecProfiles, organizationalUnits, users } from "../../drizzle/schema";
import { getDb } from "./client";
import { logAction } from "./audit";

// --- Architecture organisationnelle JECI (cahier §5 et §41) ---
// Hiérarchie configurable : international → régional → national → local →
// groupe, portée par `parentId`, sans imposer de profondeur fixe à un
// mouvement national donné.

export async function listOrganizationalUnits(filters: { parentId?: number | null; level?: string } = {}) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [];
  if (filters.parentId !== undefined) conditions.push(filters.parentId === null ? isNull(organizationalUnits.parentId) : eq(organizationalUnits.parentId, filters.parentId));
  if (filters.level) conditions.push(eq(organizationalUnits.level, filters.level as typeof organizationalUnits.$inferSelect["level"]));
  return db
    .select({
      id: organizationalUnits.id,
      parentId: organizationalUnits.parentId,
      level: organizationalUnits.level,
      name: organizationalUnits.name,
      localTypeLabel: organizationalUnits.localTypeLabel,
      countryCode: organizationalUnits.countryCode,
      isActive: organizationalUnits.isActive,
      memberCount: count(jecProfiles.userId),
    })
    .from(organizationalUnits)
    .leftJoin(jecProfiles, eq(jecProfiles.unitId, organizationalUnits.id))
    .where(conditions.length ? and(...conditions) : undefined)
    .groupBy(organizationalUnits.id);
}

export async function getOrganizationalUnit(unitId: number) {
  const db = await getDb();
  if (!db) return null;
  const [unit] = await db.select().from(organizationalUnits).where(eq(organizationalUnits.id, unitId)).limit(1);
  return unit ?? null;
}

export type CreateUnitInput = { parentId?: number; level: "international" | "regional" | "national" | "local" | "group"; name: string; localTypeLabel?: string; description?: string; countryCode?: string };

export async function createOrganizationalUnit(actorId: number, input: CreateUnitInput) {
  const db = await getDb();
  if (!db) throw new Error("Base de données indisponible");
  const [result] = await db.insert(organizationalUnits).values(input).$returningId();
  await logAction({ actorId, action: "organizationalUnit.create", entityType: "organizationalUnit", entityId: result.id, after: input });
  return result.id;
}

export async function setOrganizationalUnitActive(actorId: number, unitId: number, isActive: boolean) {
  const db = await getDb();
  if (!db) throw new Error("Base de données indisponible");
  await db.update(organizationalUnits).set({ isActive }).where(eq(organizationalUnits.id, unitId));
  await logAction({ actorId, action: isActive ? "organizationalUnit.activate" : "organizationalUnit.deactivate", entityType: "organizationalUnit", entityId: unitId });
}

// --- Communautés (cahier §15) ---

export class CommunityError extends Error {}

export async function listCommunities(filters: { scope?: string; unitId?: number } = {}) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [];
  if (filters.scope) conditions.push(eq(communities.scope, filters.scope as typeof communities.$inferSelect["scope"]));
  if (filters.unitId) conditions.push(eq(communities.unitId, filters.unitId));
  return db
    .select({
      id: communities.id,
      name: communities.name,
      description: communities.description,
      imageStorageKey: communities.imageStorageKey,
      scope: communities.scope,
      unitId: communities.unitId,
      // Seuls les membres dont l'adhésion a été validée comptent dans l'effectif affiché.
      memberCount: count(sql`case when ${communityMembers.status} = 'approved' then 1 end`),
    })
    .from(communities)
    .leftJoin(communityMembers, eq(communityMembers.communityId, communities.id))
    .where(conditions.length ? and(...conditions) : undefined)
    .groupBy(communities.id);
}

export async function getCommunity(communityId: number, viewerId?: number) {
  const db = await getDb();
  if (!db) return null;
  const [communityRow] = await db.select().from(communities).where(eq(communities.id, communityId)).limit(1);
  if (!communityRow) return null;
  const allMemberships = await db
    .select({ userId: users.id, name: users.name, role: communityMembers.role, status: communityMembers.status, avatarStorageKey: jecProfiles.avatarStorageKey })
    .from(communityMembers)
    .innerJoin(users, eq(communityMembers.userId, users.id))
    .leftJoin(jecProfiles, eq(jecProfiles.userId, users.id))
    .where(eq(communityMembers.communityId, communityId));

  const members = allMemberships.filter((membership) => membership.status === "approved");
  const pendingRequests = allMemberships.filter((membership) => membership.status === "pending");
  const viewerMembership = viewerId ? allMemberships.find((member) => member.userId === viewerId) ?? null : null;
  const viewerRole = viewerMembership?.status === "approved" ? viewerMembership.role : null;

  return {
    ...communityRow,
    members,
    // Les demandes en attente ne sont retournées en détail que pour les administrateurs de la communauté ; les autres n'en voient que le nombre.
    pendingRequests: viewerRole === "admin" ? pendingRequests : [],
    pendingCount: pendingRequests.length,
    viewerRole,
    viewerStatus: viewerMembership?.status ?? null,
  };
}

/** Seuls les responsables actuels (cahier : « peuvent créer des communautés que les responsables actuels ») ou un super administrateur peuvent créer une communauté thématique. */
export async function assertCanCreateCommunity(userId: number) {
  const db = await getDb();
  if (!db) throw new CommunityError("Base de données indisponible");
  const [user] = await db.select({ role: users.role }).from(users).where(eq(users.id, userId)).limit(1);
  if (user?.role === "admin") return;
  const [profile] = await db.select({ jecStatus: jecProfiles.jecStatus }).from(jecProfiles).where(eq(jecProfiles.userId, userId)).limit(1);
  if (profile?.jecStatus !== "current_leader") throw new CommunityError("Seuls les responsables actuels peuvent créer une communauté.");
}

export type CreateCommunityInput = { name: string; description?: string; scope: "international" | "regional" | "national" | "professional" | "thematic"; unitId?: number; imageStorageKey?: string };

export async function createCommunity(actorId: number, input: CreateCommunityInput) {
  const db = await getDb();
  if (!db) throw new Error("Base de données indisponible");
  await assertCanCreateCommunity(actorId);
  const [result] = await db.insert(communities).values({ ...input, createdBy: actorId }).$returningId();
  await db.insert(communityMembers).values({ communityId: result.id, userId: actorId, role: "admin", status: "approved", respondedAt: new Date() });
  await logAction({ actorId, action: "community.create", entityType: "community", entityId: result.id, after: input });
  return result.id;
}

/** Demande d'adhésion à une communauté : elle reste "pending" tant qu'un administrateur de la communauté ne l'a pas validée. */
export async function requestToJoinCommunity(userId: number, communityId: number) {
  const db = await getDb();
  if (!db) throw new Error("Base de données indisponible");
  await db
    .insert(communityMembers)
    .values({ communityId, userId, role: "member", status: "pending" })
    .onDuplicateKeyUpdate({ set: { status: sql`if(${communityMembers.status} = 'approved', 'approved', 'pending')`, respondedAt: null, respondedBy: null } });
}

export async function leaveCommunity(userId: number, communityId: number) {
  const db = await getDb();
  if (!db) throw new Error("Base de données indisponible");
  await db.delete(communityMembers).where(and(eq(communityMembers.communityId, communityId), eq(communityMembers.userId, userId)));
}

async function assertIsCommunityAdmin(db: NonNullable<Awaited<ReturnType<typeof getDb>>>, actorId: number, communityId: number) {
  const [actor] = await db.select({ role: users.role }).from(users).where(eq(users.id, actorId)).limit(1);
  if (actor?.role === "admin") return;
  const [membership] = await db.select({ role: communityMembers.role, status: communityMembers.status }).from(communityMembers).where(and(eq(communityMembers.communityId, communityId), eq(communityMembers.userId, actorId))).limit(1);
  if (membership?.role !== "admin" || membership.status !== "approved") throw new CommunityError("Seul un administrateur de cette communauté peut effectuer cette action.");
}

/** Validation ou refus d'une demande d'adhésion par un administrateur de la communauté. */
export async function decideCommunityMembership(actorId: number, communityId: number, targetUserId: number, decision: "approved" | "rejected") {
  const db = await getDb();
  if (!db) throw new Error("Base de données indisponible");
  await assertIsCommunityAdmin(db, actorId, communityId);
  await db.update(communityMembers).set({ status: decision, respondedBy: actorId, respondedAt: new Date() }).where(and(eq(communityMembers.communityId, communityId), eq(communityMembers.userId, targetUserId)));
  await logAction({ actorId, action: `community.membership.${decision}`, entityType: "community", entityId: communityId, reason: `Membre #${targetUserId}` });
}

// --- Documents de la communauté (cahier §15) ---

export async function listCommunityDocuments(communityId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({ id: communityDocuments.id, title: communityDocuments.title, storageKey: communityDocuments.storageKey, mimeType: communityDocuments.mimeType, createdAt: communityDocuments.createdAt, uploaderName: users.name })
    .from(communityDocuments)
    .innerJoin(users, eq(users.id, communityDocuments.uploadedBy))
    .where(eq(communityDocuments.communityId, communityId))
    .orderBy(desc(communityDocuments.id));
}

export async function addCommunityDocument(actorId: number, communityId: number, input: { title: string; storageKey: string; mimeType?: string }) {
  const db = await getDb();
  if (!db) throw new Error("Base de données indisponible");
  const [membership] = await db.select({ status: communityMembers.status }).from(communityMembers).where(and(eq(communityMembers.communityId, communityId), eq(communityMembers.userId, actorId))).limit(1);
  if (membership?.status !== "approved") throw new CommunityError("Rejoignez la communauté pour y déposer un document.");
  const [{ id }] = await db.insert(communityDocuments).values({ communityId, uploadedBy: actorId, ...input }).$returningId();
  return id;
}
