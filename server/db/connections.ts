import { and, desc, eq, inArray, or } from "drizzle-orm";
import { jecProfiles, connections, communityMembers, users } from "../../drizzle/schema";
import { getDb } from "./client";
import { createNotification } from "./notifications";
import { logAction } from "./audit";
import { sendEmail, emailTemplates } from "../email";

export class ConnectionError extends Error {}

function orderedPair(a: number, b: number): [number, number] {
  return a < b ? [a, b] : [b, a];
}

async function findPair(db: NonNullable<Awaited<ReturnType<typeof getDb>>>, a: number, b: number) {
  const [x, y] = orderedPair(a, b);
  const [row] = await db.select().from(connections).where(and(eq(connections.userAId, x), eq(connections.userBId, y))).limit(1);
  return row;
}

/**
 * Envoie une demande de connexion. Réservé aux comptes vérifiés (le
 * référentiel interdit toute interaction — dont les demandes de connexion —
 * tant que le compte est en attente de validation) ; la vérification du
 * demandeur est faite au niveau de la procédure tRPC (verifiedProcedure).
 */
export async function sendConnectionRequest(fromUserId: number, toUserId: number) {
  if (fromUserId === toUserId) throw new ConnectionError("Impossible de se connecter à soi-même.");
  const db = await getDb();
  if (!db) throw new ConnectionError("Base de données indisponible");

  const existing = await findPair(db, fromUserId, toUserId);
  if (existing) {
    if (existing.status === "blocked") throw new ConnectionError("Cette connexion n'est pas disponible.");
    if (existing.status === "accepted") throw new ConnectionError("Vous êtes déjà connectés.");
    if (existing.status === "pending") throw new ConnectionError("Une demande est déjà en attente.");
  }

  const [x, y] = orderedPair(fromUserId, toUserId);
  if (existing) {
    await db.update(connections).set({ status: "pending", initiatedById: fromUserId, respondedAt: null }).where(and(eq(connections.userAId, x), eq(connections.userBId, y)));
  } else {
    await db.insert(connections).values({ userAId: x, userBId: y, initiatedById: fromUserId, status: "pending" });
  }

  await createNotification(toUserId, "connection_request", "Nouvelle demande de connexion", undefined, "/network");
}

export async function respondToConnectionRequest(userId: number, requesterId: number, decision: "accepted" | "declined") {
  const db = await getDb();
  if (!db) throw new ConnectionError("Base de données indisponible");
  const existing = await findPair(db, userId, requesterId);
  if (!existing || existing.status !== "pending" || existing.initiatedById === userId) {
    throw new ConnectionError("Aucune demande en attente de votre part à traiter.");
  }
  const [x, y] = orderedPair(userId, requesterId);
  await db.update(connections).set({ status: decision, respondedAt: new Date() }).where(and(eq(connections.userAId, x), eq(connections.userBId, y)));
  if (decision === "accepted") {
    await createNotification(requesterId, "connection_accepted", "Connexion acceptée", undefined, "/network");
    const [[requester], [accepter]] = await Promise.all([
      db.select({ name: users.name, email: users.email }).from(users).where(eq(users.id, requesterId)).limit(1),
      db.select({ name: users.name }).from(users).where(eq(users.id, userId)).limit(1),
    ]);
    if (requester?.email) await sendEmail({ to: requester.email, ...emailTemplates.connectionAccepted(requester.name ?? "", accepter?.name ?? "Un membre du réseau") });
  }
}

export async function cancelOrRemoveConnection(userId: number, otherUserId: number) {
  const db = await getDb();
  if (!db) throw new ConnectionError("Base de données indisponible");
  const [x, y] = orderedPair(userId, otherUserId);
  await db.delete(connections).where(and(eq(connections.userAId, x), eq(connections.userBId, y)));
}

/** Blocage : accessible à l'utilisateur lui-même, ou à un administrateur en cas de fraude/litige documenté. */
export async function blockUser(actorId: number, targetUserId: number, reason?: string, byAdmin = false) {
  const db = await getDb();
  if (!db) throw new ConnectionError("Base de données indisponible");
  const subjectId = byAdmin ? targetUserId : actorId;
  const otherId = byAdmin ? actorId : targetUserId;
  const [x, y] = orderedPair(subjectId, otherId);
  const existing = await findPair(db, subjectId, otherId);
  if (existing) {
    await db.update(connections).set({ status: "blocked", initiatedById: subjectId, respondedAt: new Date() }).where(and(eq(connections.userAId, x), eq(connections.userBId, y)));
  } else {
    await db.insert(connections).values({ userAId: x, userBId: y, initiatedById: subjectId, status: "blocked" });
  }
  if (byAdmin) await logAction({ actorId, action: "connection.block", entityType: "user", entityId: targetUserId, reason });
}

export async function listConnections(userId: number) {
  const db = await getDb();
  if (!db) return [];
  const rows = await db
    .select({
      connectionId: connections.id,
      otherUserId: users.id,
      name: users.name,
      accountStatus: users.accountStatus,
      headline: jecProfiles.headline,
      avatarStorageKey: jecProfiles.avatarStorageKey,
      since: connections.respondedAt,
    })
    .from(connections)
    .innerJoin(users, or(and(eq(connections.userAId, userId), eq(users.id, connections.userBId)), and(eq(connections.userBId, userId), eq(users.id, connections.userAId))))
    .leftJoin(jecProfiles, eq(jecProfiles.userId, users.id))
    .where(and(or(eq(connections.userAId, userId), eq(connections.userBId, userId)), eq(connections.status, "accepted")))
    .orderBy(desc(connections.respondedAt));
  return rows;
}

export async function listPendingRequests(userId: number) {
  const db = await getDb();
  if (!db) return { incoming: [], outgoing: [] };
  const rows = await db
    .select({
      connectionId: connections.id,
      userAId: connections.userAId,
      userBId: connections.userBId,
      initiatedById: connections.initiatedById,
      otherUserId: users.id,
      name: users.name,
      headline: jecProfiles.headline,
      avatarStorageKey: jecProfiles.avatarStorageKey,
      createdAt: connections.createdAt,
    })
    .from(connections)
    .innerJoin(users, or(and(eq(connections.userAId, userId), eq(users.id, connections.userBId)), and(eq(connections.userBId, userId), eq(users.id, connections.userAId))))
    .leftJoin(jecProfiles, eq(jecProfiles.userId, users.id))
    .where(and(or(eq(connections.userAId, userId), eq(connections.userBId, userId)), eq(connections.status, "pending")));

  const incoming = rows.filter((row) => row.initiatedById !== userId);
  const outgoing = rows.filter((row) => row.initiatedById === userId);
  return { incoming, outgoing };
}

export async function areConnected(userA: number, userB: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  const existing = await findPair(db, userA, userB);
  return existing?.status === "accepted";
}

type SuggestionRow = { userId: number; name: string | null; avatarStorageKey: string | null; headline: string | null };

/**
 * « Vous connaissez peut-être » (cahier §17 et §42) : suggestions basées sur
 * la même structure organisationnelle, le même pays, une communauté commune
 * et les relations communes. Volume de candidats modeste par mouvement, donc
 * les scores sont combinés en mémoire plutôt que via une requête unique.
 */
export async function listConnectionSuggestions(userId: number, limit = 10) {
  const db = await getDb();
  if (!db) return [];

  const [viewerProfile] = await db.select({ unitId: jecProfiles.unitId, country: jecProfiles.country }).from(jecProfiles).where(eq(jecProfiles.userId, userId)).limit(1);

  const existingRows = await db.select({ userAId: connections.userAId, userBId: connections.userBId }).from(connections).where(or(eq(connections.userAId, userId), eq(connections.userBId, userId)));
  const excluded = new Set<number>([userId]);
  existingRows.forEach((row) => excluded.add(row.userAId === userId ? row.userBId : row.userAId));

  const candidates = new Map<number, SuggestionRow & { reasons: Set<string> }>();
  function addCandidate(row: SuggestionRow, reason: string) {
    if (excluded.has(row.userId)) return;
    const existing = candidates.get(row.userId);
    if (existing) existing.reasons.add(reason);
    else candidates.set(row.userId, { ...row, reasons: new Set([reason]) });
  }

  if (viewerProfile?.unitId) {
    const sameUnit = await db
      .select({ userId: jecProfiles.userId, name: users.name, avatarStorageKey: jecProfiles.avatarStorageKey, headline: jecProfiles.headline })
      .from(jecProfiles)
      .innerJoin(users, eq(users.id, jecProfiles.userId))
      .where(and(eq(jecProfiles.unitId, viewerProfile.unitId), eq(users.accountStatus, "verified")))
      .limit(30);
    sameUnit.forEach((row) => addCandidate(row, "Même structure"));
  }

  if (viewerProfile?.country) {
    const sameCountry = await db
      .select({ userId: jecProfiles.userId, name: users.name, avatarStorageKey: jecProfiles.avatarStorageKey, headline: jecProfiles.headline })
      .from(jecProfiles)
      .innerJoin(users, eq(users.id, jecProfiles.userId))
      .where(and(eq(jecProfiles.country, viewerProfile.country), eq(users.accountStatus, "verified")))
      .limit(30);
    sameCountry.forEach((row) => addCandidate(row, "Même pays"));
  }

  const myCommunities = await db.select({ communityId: communityMembers.communityId }).from(communityMembers).where(and(eq(communityMembers.userId, userId), eq(communityMembers.status, "approved")));
  if (myCommunities.length) {
    const communityIds = myCommunities.map((row) => row.communityId);
    const sameCommunity = await db
      .select({ userId: jecProfiles.userId, name: users.name, avatarStorageKey: jecProfiles.avatarStorageKey, headline: jecProfiles.headline })
      .from(communityMembers)
      .innerJoin(jecProfiles, eq(jecProfiles.userId, communityMembers.userId))
      .innerJoin(users, eq(users.id, communityMembers.userId))
      .where(and(inArray(communityMembers.communityId, communityIds), eq(communityMembers.status, "approved")))
      .limit(50);
    sameCommunity.forEach((row) => addCandidate(row, "Communauté commune"));
  }

  const myConnectionIds = Array.from(excluded).filter((id) => id !== userId);
  if (myConnectionIds.length) {
    const mutualRows = await db
      .select({ userAId: connections.userAId, userBId: connections.userBId })
      .from(connections)
      .where(and(eq(connections.status, "accepted"), or(inArray(connections.userAId, myConnectionIds), inArray(connections.userBId, myConnectionIds))));
    const mutualCandidateIds = new Set<number>();
    mutualRows.forEach((row) => {
      [row.userAId, row.userBId].forEach((id) => {
        if (!excluded.has(id)) mutualCandidateIds.add(id);
      });
    });
    if (mutualCandidateIds.size) {
      const mutuals = await db
        .select({ userId: jecProfiles.userId, name: users.name, avatarStorageKey: jecProfiles.avatarStorageKey, headline: jecProfiles.headline })
        .from(jecProfiles)
        .innerJoin(users, eq(users.id, jecProfiles.userId))
        .where(inArray(jecProfiles.userId, Array.from(mutualCandidateIds)))
        .limit(50);
      mutuals.forEach((row) => addCandidate(row, "Relation commune"));
    }
  }

  return Array.from(candidates.values())
    .sort((a, b) => b.reasons.size - a.reasons.size)
    .slice(0, limit)
    .map((candidate) => ({ userId: candidate.userId, name: candidate.name, avatarStorageKey: candidate.avatarStorageKey, headline: candidate.headline, reasons: Array.from(candidate.reasons) }));
}
