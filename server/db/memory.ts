import { and, desc, eq } from "drizzle-orm";
import { memoryEntries, organizationalUnits, users } from "../../drizzle/schema";
import { getDb } from "./client";
import { logAction } from "./audit";

export type MemoryInput = { unitId?: number; title: string; periodLabel?: string; body?: string; mediaStorageKey?: string; mediaMimeType?: string; linkUrl?: string };

/** Contribution à la mémoire du mouvement (cahier §24) : publiée après validation d'un modérateur/administrateur. */
export async function submitMemoryEntry(authorId: number, input: MemoryInput) {
  const db = await getDb();
  if (!db) throw new Error("Base de données indisponible");
  const [{ id }] = await db.insert(memoryEntries).values({ authorId, ...input }).$returningId();
  return id;
}

export async function listMemoryEntries(filters: { unitId?: number } = {}) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [eq(memoryEntries.status, "published")];
  if (filters.unitId) conditions.push(eq(memoryEntries.unitId, filters.unitId));
  return db
    .select({ id: memoryEntries.id, title: memoryEntries.title, periodLabel: memoryEntries.periodLabel, body: memoryEntries.body, mediaStorageKey: memoryEntries.mediaStorageKey, mediaMimeType: memoryEntries.mediaMimeType, linkUrl: memoryEntries.linkUrl, createdAt: memoryEntries.createdAt, authorName: users.name, unitName: organizationalUnits.name })
    .from(memoryEntries)
    .innerJoin(users, eq(users.id, memoryEntries.authorId))
    .leftJoin(organizationalUnits, eq(organizationalUnits.id, memoryEntries.unitId))
    .where(and(...conditions))
    .orderBy(desc(memoryEntries.id));
}

export async function listPendingMemoryEntries() {
  const db = await getDb();
  if (!db) return [];
  return db.select({ id: memoryEntries.id, title: memoryEntries.title, authorName: users.name, createdAt: memoryEntries.createdAt }).from(memoryEntries).innerJoin(users, eq(users.id, memoryEntries.authorId)).where(eq(memoryEntries.status, "pending"));
}

export async function decideMemoryEntry(actorId: number, entryId: number, decision: "published" | "rejected") {
  const db = await getDb();
  if (!db) throw new Error("Base de données indisponible");
  await db.update(memoryEntries).set({ status: decision }).where(eq(memoryEntries.id, entryId));
  await logAction({ actorId, action: `memoryEntry.${decision}`, entityType: "memoryEntry", entityId: entryId });
}
