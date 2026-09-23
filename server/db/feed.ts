import { and, count, desc, eq, isNull, lt, or } from "drizzle-orm";
import { jecProfiles, postComments, postReactions, posts, users } from "../../drizzle/schema";
import { getDb } from "./client";
import { logAction } from "./audit";

export class FeedError extends Error {}

export async function createPost(authorId: number, input: { body: string; communityId?: number; category?: "news" | "testimony" | "reflection" | "project" | "opportunity" | "event" | "training" | "call_for_contribution" | "skills_request" | "volunteer_request"; visibility?: "network" | "unit_only" | "public"; attachmentStorageKey?: string; attachmentMimeType?: string }) {
  const db = await getDb();
  if (!db) throw new FeedError("Base de données indisponible");
  const [{ id }] = await db.insert(posts).values({ authorId, communityId: input.communityId ?? null, body: input.body.trim(), category: input.category ?? "news", visibility: input.visibility ?? "network", attachmentStorageKey: input.attachmentStorageKey ?? null, attachmentMimeType: input.attachmentMimeType ?? null }).$returningId();
  return id;
}

async function hydratePosts(db: NonNullable<Awaited<ReturnType<typeof getDb>>>, rows: (typeof posts.$inferSelect & { authorName: string | null; authorAccountStatus: string; authorAvatar: string | null })[], viewerId: number) {
  return Promise.all(
    rows.map(async (post) => {
      const [reactionCount] = await db.select({ value: count() }).from(postReactions).where(eq(postReactions.postId, post.id));
      const [commentCount] = await db.select({ value: count() }).from(postComments).where(and(eq(postComments.postId, post.id), isNull(postComments.deletedAt)));
      const [viewerReaction] = await db.select().from(postReactions).where(and(eq(postReactions.postId, post.id), eq(postReactions.userId, viewerId))).limit(1);
      return { ...post, reactionCount: reactionCount?.value ?? 0, commentCount: commentCount?.value ?? 0, viewerReaction: viewerReaction?.kind ?? null };
    }),
  );
}

/** Fil de publications : ne montre jamais un contenu masqué ou supprimé. Un `communityId` restreint le fil à celui d'une communauté (cahier §15). */
export async function listFeed(viewerId: number, cursor?: number, communityId?: number) {
  const db = await getDb();
  if (!db) return { items: [], nextCursor: null as number | null };

  const conditions = [isNull(posts.hiddenAt), isNull(posts.deletedAt)];
  if (cursor) conditions.push(lt(posts.id, cursor));
  conditions.push(communityId ? eq(posts.communityId, communityId) : isNull(posts.communityId));

  const limit = 20;
  const rows = await db
    .select({ id: posts.id, authorId: posts.authorId, communityId: posts.communityId, body: posts.body, category: posts.category, visibility: posts.visibility, attachmentStorageKey: posts.attachmentStorageKey, attachmentMimeType: posts.attachmentMimeType, createdAt: posts.createdAt, editedAt: posts.editedAt, hiddenAt: posts.hiddenAt, hiddenReason: posts.hiddenReason, deletedAt: posts.deletedAt, authorName: users.name, authorAccountStatus: users.accountStatus, authorAvatar: jecProfiles.avatarStorageKey })
    .from(posts)
    .innerJoin(users, eq(users.id, posts.authorId))
    .leftJoin(jecProfiles, eq(jecProfiles.userId, posts.authorId))
    .where(and(...conditions))
    .orderBy(desc(posts.id))
    .limit(limit + 1);

  const hasMore = rows.length > limit;
  const items = await hydratePosts(db, hasMore ? rows.slice(0, limit) : rows, viewerId);
  return { items, nextCursor: hasMore ? items[items.length - 1]?.id ?? null : null };
}

/** Récupère une publication précise (indépendamment de la pagination du fil) — utile pour un lien direct ou un élément enregistré. */
export async function getPostById(postId: number, viewerId: number) {
  const db = await getDb();
  if (!db) return null;
  const [row] = await db
    .select({ id: posts.id, authorId: posts.authorId, communityId: posts.communityId, body: posts.body, category: posts.category, visibility: posts.visibility, attachmentStorageKey: posts.attachmentStorageKey, attachmentMimeType: posts.attachmentMimeType, createdAt: posts.createdAt, editedAt: posts.editedAt, hiddenAt: posts.hiddenAt, hiddenReason: posts.hiddenReason, deletedAt: posts.deletedAt, authorName: users.name, authorAccountStatus: users.accountStatus, authorAvatar: jecProfiles.avatarStorageKey })
    .from(posts)
    .innerJoin(users, eq(users.id, posts.authorId))
    .leftJoin(jecProfiles, eq(jecProfiles.userId, posts.authorId))
    .where(and(eq(posts.id, postId), isNull(posts.deletedAt)))
    .limit(1);
  if (!row) return null;
  const [hydrated] = await hydratePosts(db, [row], viewerId);
  return hydrated;
}

export async function updatePost(userId: number, postId: number, body: string) {
  const db = await getDb();
  if (!db) throw new FeedError("Base de données indisponible");
  const [post] = await db.select().from(posts).where(eq(posts.id, postId)).limit(1);
  if (!post || post.authorId !== userId) throw new FeedError("Vous ne pouvez modifier que vos propres publications.");
  await db.update(posts).set({ body: body.trim(), editedAt: new Date() }).where(eq(posts.id, postId));
}

export async function deletePost(userId: number, postId: number) {
  const db = await getDb();
  if (!db) throw new FeedError("Base de données indisponible");
  const [post] = await db.select().from(posts).where(eq(posts.id, postId)).limit(1);
  if (!post || post.authorId !== userId) throw new FeedError("Vous ne pouvez supprimer que vos propres publications.");
  await db.update(posts).set({ deletedAt: new Date() }).where(eq(posts.id, postId));
}

/** Masquage temporaire par un modérateur, ou retrait définitif par un administrateur. */
export async function moderatePost(actorId: number, postId: number, action: "hide" | "delete", reason: string) {
  const db = await getDb();
  if (!db) throw new FeedError("Base de données indisponible");
  if (action === "hide") await db.update(posts).set({ hiddenAt: new Date(), hiddenReason: reason }).where(eq(posts.id, postId));
  else await db.update(posts).set({ deletedAt: new Date() }).where(eq(posts.id, postId));
  await logAction({ actorId, action: `post.${action}`, entityType: "post", entityId: postId, reason });
}

export async function addComment(userId: number, postId: number, body: string) {
  const db = await getDb();
  if (!db) throw new FeedError("Base de données indisponible");
  const [{ id }] = await db.insert(postComments).values({ postId, authorId: userId, body: body.trim() }).$returningId();
  return id;
}

export async function listComments(postId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({ id: postComments.id, postId: postComments.postId, authorId: postComments.authorId, body: postComments.body, createdAt: postComments.createdAt, authorName: users.name, authorAvatar: jecProfiles.avatarStorageKey })
    .from(postComments)
    .innerJoin(users, eq(users.id, postComments.authorId))
    .leftJoin(jecProfiles, eq(jecProfiles.userId, postComments.authorId))
    .where(and(eq(postComments.postId, postId), isNull(postComments.deletedAt)))
    .orderBy(postComments.createdAt);
}

export async function deleteComment(userId: number, commentId: number) {
  const db = await getDb();
  if (!db) throw new FeedError("Base de données indisponible");
  const [comment] = await db.select().from(postComments).where(eq(postComments.id, commentId)).limit(1);
  if (!comment || comment.authorId !== userId) throw new FeedError("Vous ne pouvez supprimer que vos propres commentaires.");
  await db.update(postComments).set({ deletedAt: new Date() }).where(eq(postComments.id, commentId));
}

export async function toggleReaction(userId: number, postId: number, kind: "like" | "celebrate" | "support" | "insightful") {
  const db = await getDb();
  if (!db) throw new FeedError("Base de données indisponible");
  const [existing] = await db.select().from(postReactions).where(and(eq(postReactions.postId, postId), eq(postReactions.userId, userId))).limit(1);
  if (existing && existing.kind === kind) {
    await db.delete(postReactions).where(eq(postReactions.id, existing.id));
    return { active: false };
  }
  if (existing) {
    await db.update(postReactions).set({ kind }).where(eq(postReactions.id, existing.id));
  } else {
    await db.insert(postReactions).values({ postId, userId, kind });
  }
  return { active: true };
}

/** Vue admin/modérateur : publications récentes non supprimées (masquées incluses, pour pouvoir les réexaminer). */
export async function listRecentPostsForModeration() {
  const db = await getDb();
  if (!db) return [];
  const rows = await db
    .select({ id: posts.id, body: posts.body, createdAt: posts.createdAt, hiddenAt: posts.hiddenAt, authorId: posts.authorId, authorName: users.name })
    .from(posts)
    .innerJoin(users, eq(users.id, posts.authorId))
    .where(isNull(posts.deletedAt))
    .orderBy(desc(posts.id))
    .limit(100);
  return Promise.all(
    rows.map(async (post) => {
      const [reactionCount] = await db.select({ value: count() }).from(postReactions).where(eq(postReactions.postId, post.id));
      const [commentCount] = await db.select({ value: count() }).from(postComments).where(and(eq(postComments.postId, post.id), isNull(postComments.deletedAt)));
      return { ...post, reactionCount: reactionCount?.value ?? 0, commentCount: commentCount?.value ?? 0 };
    }),
  );
}
