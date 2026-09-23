import { and, desc, eq } from "drizzle-orm";
import { events, opportunities, posts, projects, savedItems } from "../../drizzle/schema";
import { getDb } from "./client";

export type SavedItemType = "post" | "opportunity" | "event" | "project";

export async function toggleSavedItem(userId: number, itemType: SavedItemType, itemId: number) {
  const db = await getDb();
  if (!db) throw new Error("Base de données indisponible");
  const [existing] = await db.select().from(savedItems).where(and(eq(savedItems.userId, userId), eq(savedItems.itemType, itemType), eq(savedItems.itemId, itemId))).limit(1);
  if (existing) {
    await db.delete(savedItems).where(eq(savedItems.id, existing.id));
    return { saved: false } as const;
  }
  await db.insert(savedItems).values({ userId, itemType, itemId });
  return { saved: true } as const;
}

export async function listSavedItemIds(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(savedItems).where(eq(savedItems.userId, userId));
}

/** Récupère le contenu réel derrière chaque élément enregistré, pour l'écran "Sauvegardés". */
export async function listSavedItemsWithContent(userId: number) {
  const db = await getDb();
  if (!db) return [];
  const rows = await db.select().from(savedItems).where(eq(savedItems.userId, userId)).orderBy(desc(savedItems.createdAt));

  const results = [];
  for (const row of rows) {
    if (row.itemType === "opportunity") {
      const [item] = await db.select().from(opportunities).where(eq(opportunities.id, row.itemId)).limit(1);
      if (item) results.push({ saved: row, opportunity: item });
    } else if (row.itemType === "event") {
      const [item] = await db.select().from(events).where(eq(events.id, row.itemId)).limit(1);
      if (item) results.push({ saved: row, event: item });
    } else if (row.itemType === "post") {
      const [item] = await db.select().from(posts).where(eq(posts.id, row.itemId)).limit(1);
      if (item) results.push({ saved: row, post: item });
    } else if (row.itemType === "project") {
      const [item] = await db.select().from(projects).where(eq(projects.id, row.itemId)).limit(1);
      if (item) results.push({ saved: row, project: item });
    }
  }
  return results;
}
