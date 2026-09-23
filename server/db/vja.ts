import { and, desc, eq, or } from "drizzle-orm";
import { jecProfiles, organizationalUnits, users, vjaSheets } from "../../drizzle/schema";
import { getDb } from "./client";

export type VjaInput = {
  title: string;
  unitId?: number;
  seeReality: string;
  judgeAnalysis?: string;
  judgeReflection?: string;
  actObjective?: string;
  actAction?: string;
  actResults?: string;
  actEvaluation?: string;
  mediaStorageKey?: string;
  mediaMimeType?: string;
  linkUrl?: string;
  status?: "draft" | "in_progress" | "completed";
  visibility?: "network" | "unit_only" | "private";
};

export async function createVjaSheet(authorId: number, input: VjaInput) {
  const db = await getDb();
  if (!db) throw new Error("Base de données indisponible");
  const [{ id }] = await db.insert(vjaSheets).values({ authorId, ...input }).$returningId();
  return id;
}

export async function updateVjaSheet(userId: number, sheetId: number, input: Partial<VjaInput>) {
  const db = await getDb();
  if (!db) throw new Error("Base de données indisponible");
  await db.update(vjaSheets).set(input as Partial<typeof vjaSheets.$inferInsert>).where(and(eq(vjaSheets.id, sheetId), eq(vjaSheets.authorId, userId)));
}

/** Fiches Voir-Juger-Agir partagées avec le réseau (cahier §23), contributions individuelles ou collectives. */
export async function listVjaSheets(viewerId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({ id: vjaSheets.id, title: vjaSheets.title, status: vjaSheets.status, seeReality: vjaSheets.seeReality, mediaStorageKey: vjaSheets.mediaStorageKey, mediaMimeType: vjaSheets.mediaMimeType, linkUrl: vjaSheets.linkUrl, createdAt: vjaSheets.createdAt, authorId: vjaSheets.authorId, authorName: users.name, authorAvatar: jecProfiles.avatarStorageKey, unitName: organizationalUnits.name })
    .from(vjaSheets)
    .innerJoin(users, eq(users.id, vjaSheets.authorId))
    .leftJoin(jecProfiles, eq(jecProfiles.userId, vjaSheets.authorId))
    .leftJoin(organizationalUnits, eq(organizationalUnits.id, vjaSheets.unitId))
    .where(or(eq(vjaSheets.visibility, "network"), eq(vjaSheets.authorId, viewerId)))
    .orderBy(desc(vjaSheets.id))
    .limit(50);
}

export async function getVjaSheet(sheetId: number) {
  const db = await getDb();
  if (!db) return null;
  const [row] = await db.select().from(vjaSheets).where(eq(vjaSheets.id, sheetId)).limit(1);
  return row ?? null;
}
