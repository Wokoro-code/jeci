import { and, desc, eq, like, ne, or } from "drizzle-orm";
import { connections, jecExperiences, jecProfiles, organizationalUnits, professionalExperiences, users } from "../../drizzle/schema";
import { getDb } from "./client";
import { assignRole } from "./roles";
import { verificationRequests } from "../../drizzle/schema";

export async function getAccountOverview(userId: number) {
  const db = await getDb();
  if (!db) return null;
  const [profile] = await db.select().from(jecProfiles).where(eq(jecProfiles.userId, userId)).limit(1);
  const [request] = await db.select().from(verificationRequests).where(eq(verificationRequests.userId, userId)).limit(1);
  const experiences = await db.select().from(jecExperiences).where(eq(jecExperiences.userId, userId)).orderBy(jecExperiences.startDate);
  const professional = await db.select().from(professionalExperiences).where(eq(professionalExperiences.userId, userId)).orderBy(desc(professionalExperiences.startDate));
  return { profile: profile ?? null, verification: request ?? null, experiences, professional };
}

export type UpdateProfileInput = {
  headline?: string;
  jecStatus?: "active_jeciste" | "alumni_jeciste" | "former_leader" | "current_leader" | "chaplain" | "facilitator" | "volunteer" | "supporter";
  unitId?: number;
  organization?: string;
  jobTitle?: string;
  sector?: string;
  country?: string;
  city?: string;
  bio?: string;
  languages?: string[];
  skills?: string[];
  certifications?: string[];
  interests?: string[];
  website?: string;
  phone?: string;
  directoryVisibility?: "network" | "unit_only" | "private";
  mentorAvailable?: boolean;
  mentorTopics?: string[];
  availableForCollaboration?: boolean;
  availableAsExpert?: boolean;
  availableForProjects?: boolean;
  privacyEmail?: "public" | "members" | "connections" | "private";
  privacyPhone?: "public" | "members" | "connections" | "private";
  privacyCity?: "public" | "members" | "connections" | "private";
  privacyJecPath?: "public" | "members" | "connections" | "private";
  privacyProfessionalPath?: "public" | "members" | "connections" | "private";
  avatarStorageKey?: string;
  coverStorageKey?: string;
};

/**
 * Met à jour le profil JEC. Si le membre déclare sa disponibilité mentor, le
 * rôle Mentor est activé immédiatement — mais uniquement pour un compte
 * vérifié (le badge « Jéciste vérifié » reste un prérequis pour toute
 * interaction, cahier des charges §10).
 */
export async function updateProfile(userId: number, input: UpdateProfileInput) {
  const db = await getDb();
  if (!db) throw new Error("Base de données indisponible");
  await db.update(jecProfiles).set(input).where(eq(jecProfiles.userId, userId));

  if (input.mentorAvailable) {
    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (user?.accountStatus === "verified") {
      await assignRole(userId, userId, "mentor", "Disponibilité mentor déclarée par le membre lui-même");
    }
  }
}

export type DirectoryFilters = {
  search?: string;
  unitId?: number;
  country?: string;
  jecStatus?: string;
  mentorOnly?: boolean;
  cursor?: number;
  limit?: number;
};

/**
 * Annuaire mondial (cahier §11) : la visibilité ne dépend pas de la
 * validation du compte. "network" = visible de tout le réseau ;
 * "unit_only" = visible seulement des membres de la même structure ;
 * "private" = jamais listé dans l'annuaire.
 */
export async function listDirectory(viewerId: number, filters: DirectoryFilters) {
  const db = await getDb();
  if (!db) return { items: [], nextCursor: null as number | null };

  const [viewerProfile] = await db.select({ unitId: jecProfiles.unitId }).from(jecProfiles).where(eq(jecProfiles.userId, viewerId)).limit(1);

  const visibilityCondition = or(
    eq(jecProfiles.directoryVisibility, "network"),
    viewerProfile?.unitId ? and(eq(jecProfiles.directoryVisibility, "unit_only"), eq(jecProfiles.unitId, viewerProfile.unitId)) : undefined,
  );

  const conditions = [visibilityCondition, ne(jecProfiles.userId, viewerId)];
  if (filters.unitId) conditions.push(eq(jecProfiles.unitId, filters.unitId));
  if (filters.country) conditions.push(like(jecProfiles.country, `%${filters.country}%`));
  if (filters.jecStatus) conditions.push(eq(jecProfiles.jecStatus, filters.jecStatus as NonNullable<UpdateProfileInput["jecStatus"]>));
  if (filters.mentorOnly) conditions.push(eq(jecProfiles.mentorAvailable, true));
  if (filters.search) conditions.push(or(like(users.name, `%${filters.search}%`), like(jecProfiles.organization, `%${filters.search}%`), like(jecProfiles.jobTitle, `%${filters.search}%`)));

  const limit = Math.min(filters.limit ?? 24, 50);
  const rows = await db
    .select({
      userId: jecProfiles.userId,
      name: users.name,
      accountStatus: users.accountStatus,
      headline: jecProfiles.headline,
      jecStatus: jecProfiles.jecStatus,
      organization: jecProfiles.organization,
      jobTitle: jecProfiles.jobTitle,
      country: jecProfiles.country,
      city: jecProfiles.city,
      avatarStorageKey: jecProfiles.avatarStorageKey,
      mentorAvailable: jecProfiles.mentorAvailable,
      unitName: organizationalUnits.name,
      unitLevel: organizationalUnits.level,
    })
    .from(jecProfiles)
    .innerJoin(users, eq(jecProfiles.userId, users.id))
    .leftJoin(organizationalUnits, eq(jecProfiles.unitId, organizationalUnits.id))
    .where(and(...conditions))
    .limit(limit + 1);

  const hasMore = rows.length > limit;
  const items = hasMore ? rows.slice(0, limit) : rows;
  return { items, nextCursor: hasMore ? limit : null };
}

/** Profil public d'un membre, avec le statut de la relation vue par le visiteur. */
export async function getPublicProfile(viewerId: number, targetUserId: number) {
  const db = await getDb();
  if (!db) return null;
  const [row] = await db
    .select({
      userId: jecProfiles.userId,
      name: users.name,
      accountStatus: users.accountStatus,
      headline: jecProfiles.headline,
      jecStatus: jecProfiles.jecStatus,
      organization: jecProfiles.organization,
      jobTitle: jecProfiles.jobTitle,
      sector: jecProfiles.sector,
      bio: jecProfiles.bio,
      country: jecProfiles.country,
      city: jecProfiles.city,
      website: jecProfiles.website,
      languages: jecProfiles.languages,
      skills: jecProfiles.skills,
      certifications: jecProfiles.certifications,
      interests: jecProfiles.interests,
      avatarStorageKey: jecProfiles.avatarStorageKey,
      coverStorageKey: jecProfiles.coverStorageKey,
      mentorAvailable: jecProfiles.mentorAvailable,
      mentorTopics: jecProfiles.mentorTopics,
      availableForCollaboration: jecProfiles.availableForCollaboration,
      availableAsExpert: jecProfiles.availableAsExpert,
      availableForProjects: jecProfiles.availableForProjects,
      unitId: jecProfiles.unitId,
      unitName: organizationalUnits.name,
      unitLevel: organizationalUnits.level,
    })
    .from(jecProfiles)
    .innerJoin(users, eq(jecProfiles.userId, users.id))
    .leftJoin(organizationalUnits, eq(jecProfiles.unitId, organizationalUnits.id))
    .where(eq(jecProfiles.userId, targetUserId))
    .limit(1);
  if (!row) return null;

  const [connection] = await db
    .select()
    .from(connections)
    .where(or(and(eq(connections.userAId, viewerId), eq(connections.userBId, targetUserId)), and(eq(connections.userAId, targetUserId), eq(connections.userBId, viewerId))))
    .limit(1);

  const experiences = await db.select().from(jecExperiences).where(eq(jecExperiences.userId, targetUserId)).orderBy(jecExperiences.startDate);
  const professional = await db.select().from(professionalExperiences).where(eq(professionalExperiences.userId, targetUserId)).orderBy(desc(professionalExperiences.startDate));

  return { ...row, connectionStatus: connection?.status ?? null, isSelf: viewerId === targetUserId, experiences, professional };
}

// --- « Mon parcours JEC » (cahier §8) ---

export type JecExperienceInput = {
  unitId?: number;
  movementLabel?: string;
  functionTitle: string;
  startDate?: string;
  endDate?: string;
  description?: string;
  responsibilities?: string;
};

export async function addJecExperience(userId: number, input: JecExperienceInput) {
  const db = await getDb();
  if (!db) throw new Error("Base de données indisponible");
  const [result] = await db.insert(jecExperiences).values({ userId, ...input } as typeof jecExperiences.$inferInsert).$returningId();
  return result.id;
}

export async function updateJecExperience(userId: number, experienceId: number, input: Partial<JecExperienceInput>) {
  const db = await getDb();
  if (!db) throw new Error("Base de données indisponible");
  await db.update(jecExperiences).set(input as Partial<typeof jecExperiences.$inferInsert>).where(and(eq(jecExperiences.id, experienceId), eq(jecExperiences.userId, userId)));
}

export async function deleteJecExperience(userId: number, experienceId: number) {
  const db = await getDb();
  if (!db) throw new Error("Base de données indisponible");
  await db.delete(jecExperiences).where(and(eq(jecExperiences.id, experienceId), eq(jecExperiences.userId, userId)));
}

// --- Parcours professionnel : expériences, formation, certifications (cahier §7) ---

export type ProfessionalExperienceInput = { kind: "work" | "education" | "certification"; title: string; organization?: string; startDate?: string; endDate?: string; description?: string };

export async function addProfessionalExperience(userId: number, input: ProfessionalExperienceInput) {
  const db = await getDb();
  if (!db) throw new Error("Base de données indisponible");
  const [result] = await db.insert(professionalExperiences).values({ userId, ...input } as typeof professionalExperiences.$inferInsert).$returningId();
  return result.id;
}

export async function updateProfessionalExperience(userId: number, experienceId: number, input: Partial<ProfessionalExperienceInput>) {
  const db = await getDb();
  if (!db) throw new Error("Base de données indisponible");
  await db.update(professionalExperiences).set(input as Partial<typeof professionalExperiences.$inferInsert>).where(and(eq(professionalExperiences.id, experienceId), eq(professionalExperiences.userId, userId)));
}

export async function deleteProfessionalExperience(userId: number, experienceId: number) {
  const db = await getDb();
  if (!db) throw new Error("Base de données indisponible");
  await db.delete(professionalExperiences).where(and(eq(professionalExperiences.id, experienceId), eq(professionalExperiences.userId, userId)));
}
