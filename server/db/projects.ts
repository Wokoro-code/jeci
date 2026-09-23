import { and, eq, isNull, isNotNull, ne, or, sql } from "drizzle-orm";
import { projectMembers, projects, users } from "../../drizzle/schema";
import { getDb } from "./client";
import { logAction } from "./audit";

export class ProjectError extends Error {}

export async function createProject(ownerId: number, input: { name: string; description?: string; communityId?: number; domain?: string; location?: string; objective?: string; needs?: string; budgetIndicative?: string; partners?: string; coverStorageKey?: string; coverMimeType?: string; linkUrl?: string; visibility?: "network" | "unit_only" | "private" }) {
  const db = await getDb();
  if (!db) throw new ProjectError("Base de données indisponible");
  const [{ id }] = await db.insert(projects).values({ ownerId, ...input }).$returningId();
  await db.insert(projectMembers).values({ projectId: id, userId: ownerId, role: "owner" });
  return id;
}

/** Projets visibles par le membre ; un `communityId` restreint la liste à ceux d'une communauté (cahier §15). */
/** `contributable` : filtre "Projets auxquels je peux contribuer" (cahier §21) — projets ouverts au réseau avec des besoins exprimés, hors projets déjà possédés par le membre. */
export async function listProjects(viewerId: number, filters: { communityId?: number; contributable?: boolean } = {}) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [ne(projects.status, "suspended"), or(eq(projects.visibility, "network"), eq(projects.ownerId, viewerId)), filters.communityId ? eq(projects.communityId, filters.communityId) : isNull(projects.communityId)];
  if (filters.contributable) {
    conditions.push(isNotNull(projects.needs), ne(projects.needs, ""), ne(projects.ownerId, viewerId), eq(projects.visibility, "network"));
  }
  return db
    .select({ id: projects.id, name: projects.name, description: projects.description, communityId: projects.communityId, domain: projects.domain, location: projects.location, needs: projects.needs, coverStorageKey: projects.coverStorageKey, coverMimeType: projects.coverMimeType, visibility: projects.visibility, status: projects.status, ownerId: projects.ownerId, ownerName: users.name })
    .from(projects)
    .innerJoin(users, eq(users.id, projects.ownerId))
    .where(and(...conditions));
}

async function assertOwner(db: NonNullable<Awaited<ReturnType<typeof getDb>>>, userId: number, projectId: number) {
  const [project] = await db.select().from(projects).where(eq(projects.id, projectId)).limit(1);
  if (!project || project.ownerId !== userId) throw new ProjectError("Seul le créateur peut gérer cet espace.");
  return project;
}

/** Fiche détaillée d'un espace projet (page « Accéder »). */
export async function getProject(projectId: number, viewerId: number) {
  const db = await getDb();
  if (!db) return null;
  const [project] = await db
    .select({ id: projects.id, name: projects.name, description: projects.description, communityId: projects.communityId, domain: projects.domain, location: projects.location, objective: projects.objective, needs: projects.needs, budgetIndicative: projects.budgetIndicative, partners: projects.partners, coverStorageKey: projects.coverStorageKey, coverMimeType: projects.coverMimeType, linkUrl: projects.linkUrl, visibility: projects.visibility, status: projects.status, ownerId: projects.ownerId, ownerName: users.name, createdAt: projects.createdAt })
    .from(projects)
    .innerJoin(users, eq(users.id, projects.ownerId))
    .where(eq(projects.id, projectId))
    .limit(1);
  if (!project) return null;
  if (project.visibility === "private" && project.ownerId !== viewerId) {
    const [membership] = await db.select().from(projectMembers).where(and(eq(projectMembers.projectId, projectId), eq(projectMembers.userId, viewerId))).limit(1);
    if (!membership) return null;
  }
  const members = await db
    .select({ userId: users.id, name: users.name, role: projectMembers.role })
    .from(projectMembers)
    .innerJoin(users, eq(users.id, projectMembers.userId))
    .where(eq(projectMembers.projectId, projectId));
  const viewerMembership = members.find((member) => member.userId === viewerId) ?? null;
  return { ...project, members, viewerRole: viewerMembership?.role ?? null };
}

/** Un membre vérifié peut rejoindre directement un espace ouvert au réseau ; les espaces réservés/privés restent gérés par le créateur. */
export async function joinProject(userId: number, projectId: number) {
  const db = await getDb();
  if (!db) throw new ProjectError("Base de données indisponible");
  const [project] = await db.select({ visibility: projects.visibility }).from(projects).where(eq(projects.id, projectId)).limit(1);
  if (!project) throw new ProjectError("Espace introuvable.");
  if (project.visibility !== "network") throw new ProjectError("Cet espace n'est pas ouvert aux demandes directes ; contactez son créateur.");
  await db.insert(projectMembers).values({ projectId, userId, role: "member" }).onDuplicateKeyUpdate({ set: { role: sql`role` } });
}

export async function leaveProject(userId: number, projectId: number) {
  const db = await getDb();
  if (!db) throw new ProjectError("Base de données indisponible");
  await db.delete(projectMembers).where(and(eq(projectMembers.projectId, projectId), eq(projectMembers.userId, userId), ne(projectMembers.role, "owner")));
}

export async function updateProject(userId: number, projectId: number, input: Partial<{ name: string; description: string; domain: string; location: string; objective: string; needs: string; budgetIndicative: string; partners: string; coverStorageKey: string; coverMimeType: string; linkUrl: string; status: "idea" | "in_preparation" | "in_progress" | "completed" | "suspended"; visibility: "network" | "unit_only" | "private" }>) {
  const db = await getDb();
  if (!db) throw new ProjectError("Base de données indisponible");
  await assertOwner(db, userId, projectId);
  await db.update(projects).set(input).where(eq(projects.id, projectId));
}

export async function addProjectMember(userId: number, projectId: number, memberUserId: number) {
  const db = await getDb();
  if (!db) throw new ProjectError("Base de données indisponible");
  await assertOwner(db, userId, projectId);
  await db.insert(projectMembers).values({ projectId, userId: memberUserId, role: "member" }).onDuplicateKeyUpdate({ set: { role: "member" } });
}

export async function removeProjectMember(userId: number, projectId: number, memberUserId: number) {
  const db = await getDb();
  if (!db) throw new ProjectError("Base de données indisponible");
  await assertOwner(db, userId, projectId);
  await db.delete(projectMembers).where(and(eq(projectMembers.projectId, projectId), eq(projectMembers.userId, memberUserId)));
}

/** Retrait d'un espace non conforme par un administrateur. */
export async function archiveProjectByAdmin(actorId: number, projectId: number, reason: string) {
  const db = await getDb();
  if (!db) throw new ProjectError("Base de données indisponible");
  await db.update(projects).set({ status: "suspended" }).where(eq(projects.id, projectId));
  await logAction({ actorId, action: "project.archive", entityType: "project", entityId: projectId, reason });
}

/** Vue admin complète (tous les espaces, quelle que soit leur visibilité ou leur statut). */
export async function listAllProjectsForAdmin() {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({ id: projects.id, name: projects.name, visibility: projects.visibility, status: projects.status, createdAt: projects.createdAt, ownerName: users.name })
    .from(projects)
    .innerJoin(users, eq(users.id, projects.ownerId));
}
