import { and, asc, desc, eq, gt, isNull, ne } from "drizzle-orm";
import { jecProfiles, communities, communityMembers, conversationMembers, conversations, messageAttachments, messages, organizationalUnits, users } from "../../drizzle/schema";
import { getDb } from "./client";
import { areConnected } from "./connections";
import { createNotification } from "./notifications";
import { isRecentlyActive } from "./users";

export class MessagingError extends Error {}

function directPairKey(a: number, b: number) {
  const [x, y] = a < b ? [a, b] : [b, a];
  return `${x}-${y}`;
}

/**
 * Ouvre (ou retrouve) une conversation directe. Réservé aux connexions
 * acceptées : le référentiel limite la messagerie à "ses connexions".
 */
export async function startOrGetDirectConversation(userId: number, otherUserId: number) {
  if (userId === otherUserId) throw new MessagingError("Impossible de démarrer une conversation avec soi-même.");
  const db = await getDb();
  if (!db) throw new MessagingError("Base de données indisponible");

  const connected = await areConnected(userId, otherUserId);
  if (!connected) throw new MessagingError("Vous devez être connectés pour échanger un message.");

  const key = directPairKey(userId, otherUserId);
  const [existing] = await db.select().from(conversations).where(eq(conversations.directPairKey, key)).limit(1);
  if (existing) return existing.id;

  const [{ id: conversationId }] = await db.insert(conversations).values({ kind: "direct", directPairKey: key, createdBy: userId }).$returningId();
  await db.insert(conversationMembers).values([{ conversationId, userId }, { conversationId, userId: otherUserId }]);
  return conversationId;
}

/**
 * Ouvre (ou crée) le groupe de discussion officiel d'une structure
 * organisationnelle (mouvement national, structure locale, groupe...), et y
 * ajoute automatiquement l'appelant s'il n'en fait pas encore partie. Un
 * seul groupe existe par structure (contrainte d'unicité sur unitId).
 */
export async function getOrJoinUnitConversation(userId: number, unitId: number) {
  const db = await getDb();
  if (!db) throw new MessagingError("Base de données indisponible");

  const [unit] = await db.select().from(organizationalUnits).where(eq(organizationalUnits.id, unitId)).limit(1);
  if (!unit) throw new MessagingError("Structure introuvable.");

  let conversationId: number;
  const [existing] = await db.select().from(conversations).where(eq(conversations.unitId, unitId)).limit(1);
  if (existing) {
    conversationId = existing.id;
  } else {
    const [{ id }] = await db.insert(conversations).values({ kind: "group", unitId, title: unit.name, createdBy: userId }).$returningId();
    conversationId = id;
  }

  await db
    .insert(conversationMembers)
    .values({ conversationId, userId })
    .onDuplicateKeyUpdate({ set: { leftAt: null } });

  return conversationId;
}

/**
 * Ouvre (ou crée) le groupe de discussion officiel d'une communauté
 * (cahier §15). Réservé aux membres dont l'adhésion a été validée.
 */
export async function getOrJoinCommunityConversation(userId: number, communityId: number) {
  const db = await getDb();
  if (!db) throw new MessagingError("Base de données indisponible");

  const [community] = await db.select().from(communities).where(eq(communities.id, communityId)).limit(1);
  if (!community) throw new MessagingError("Communauté introuvable.");

  const [membership] = await db.select({ status: communityMembers.status }).from(communityMembers).where(and(eq(communityMembers.communityId, communityId), eq(communityMembers.userId, userId))).limit(1);
  if (membership?.status !== "approved") throw new MessagingError("Votre adhésion à cette communauté doit être validée avant de rejoindre la discussion.");

  let conversationId: number;
  const [existing] = await db.select().from(conversations).where(eq(conversations.communityId, communityId)).limit(1);
  if (existing) {
    conversationId = existing.id;
  } else {
    const [{ id }] = await db.insert(conversations).values({ kind: "group", communityId, title: community.name, createdBy: userId }).$returningId();
    conversationId = id;
  }

  await db
    .insert(conversationMembers)
    .values({ conversationId, userId })
    .onDuplicateKeyUpdate({ set: { leftAt: null } });

  return conversationId;
}

export async function listConversationMembers(conversationId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({ userId: users.id, name: users.name, avatarStorageKey: jecProfiles.avatarStorageKey, accountStatus: users.accountStatus })
    .from(conversationMembers)
    .innerJoin(users, eq(users.id, conversationMembers.userId))
    .leftJoin(jecProfiles, eq(jecProfiles.userId, users.id))
    .where(and(eq(conversationMembers.conversationId, conversationId), isNull(conversationMembers.leftAt)));
}

export async function listConversations(userId: number) {
  const db = await getDb();
  if (!db) return [];
  const memberships = await db.select({ conversationId: conversationMembers.conversationId, lastReadMessageId: conversationMembers.lastReadMessageId }).from(conversationMembers).where(and(eq(conversationMembers.userId, userId), isNull(conversationMembers.leftAt)));
  if (!memberships.length) return [];

  const results = [];
  for (const membership of memberships) {
    const [conversation] = await db.select().from(conversations).where(eq(conversations.id, membership.conversationId)).limit(1);
    if (!conversation || conversation.kind !== "direct") continue;
    const [other] = await db
      .select({ userId: users.id, name: users.name, avatarStorageKey: jecProfiles.avatarStorageKey, accountStatus: users.accountStatus, lastActiveAt: users.lastActiveAt })
      .from(conversationMembers)
      .innerJoin(users, eq(users.id, conversationMembers.userId))
      .leftJoin(jecProfiles, eq(jecProfiles.userId, users.id))
      .where(and(eq(conversationMembers.conversationId, conversation.id), ne(conversationMembers.userId, userId)))
      .limit(1);
    const [lastMessage] = await db.select().from(messages).where(and(eq(messages.conversationId, conversation.id), isNull(messages.deletedAt))).orderBy(desc(messages.sentAt)).limit(1);
    const unreadWhere = membership.lastReadMessageId
      ? and(eq(messages.conversationId, conversation.id), gt(messages.id, membership.lastReadMessageId), ne(messages.senderId, userId))
      : and(eq(messages.conversationId, conversation.id), ne(messages.senderId, userId));
    const unread = await db.select({ id: messages.id }).from(messages).where(unreadWhere);
    results.push({ conversation, other: other ? { userId: other.userId, name: other.name, avatarStorageKey: other.avatarStorageKey, accountStatus: other.accountStatus, isOnline: isRecentlyActive(other.lastActiveAt) } : null, lastMessage: lastMessage ?? null, unreadCount: unread.length });
  }
  return results.sort((a, b) => {
    const at = a.lastMessage?.sentAt ?? a.conversation.createdAt;
    const bt = b.lastMessage?.sentAt ?? b.conversation.createdAt;
    return new Date(bt).getTime() - new Date(at).getTime();
  });
}

async function assertMember(userId: number, conversationId: number) {
  const db = await getDb();
  if (!db) throw new MessagingError("Base de données indisponible");
  const [membership] = await db.select().from(conversationMembers).where(and(eq(conversationMembers.conversationId, conversationId), eq(conversationMembers.userId, userId))).limit(1);
  if (!membership || membership.leftAt) throw new MessagingError("Vous ne faites pas partie de cette conversation.");
  return db;
}

export async function listMessages(userId: number, conversationId: number, before?: number) {
  const db = await assertMember(userId, conversationId);
  const conditions = before ? and(eq(messages.conversationId, conversationId), isNull(messages.deletedAt), gt(messages.id, 0)) : and(eq(messages.conversationId, conversationId), isNull(messages.deletedAt));
  const rows = await db.select().from(messages).where(conditions).orderBy(asc(messages.sentAt)).limit(100);
  const attachmentsByMessage = new Map<number, (typeof messageAttachments.$inferSelect)[]>();
  if (rows.length) {
    const allAttachments = await db.select().from(messageAttachments);
    for (const attachment of allAttachments) {
      if (!rows.some((m) => m.id === attachment.messageId)) continue;
      const list = attachmentsByMessage.get(attachment.messageId) ?? [];
      list.push(attachment);
      attachmentsByMessage.set(attachment.messageId, list);
    }
  }

  // Accusés façon WhatsApp (envoyé / reçu-connecté / lu), uniquement pertinents en conversation directe.
  const [conversation] = await db.select({ kind: conversations.kind }).from(conversations).where(eq(conversations.id, conversationId)).limit(1);
  let otherReadState: { lastReadMessageId: number | null; isOnline: boolean } | null = null;
  if (conversation?.kind === "direct") {
    const [other] = await db
      .select({ lastReadMessageId: conversationMembers.lastReadMessageId, lastActiveAt: users.lastActiveAt })
      .from(conversationMembers)
      .innerJoin(users, eq(users.id, conversationMembers.userId))
      .where(and(eq(conversationMembers.conversationId, conversationId), ne(conversationMembers.userId, userId)))
      .limit(1);
    if (other) otherReadState = { lastReadMessageId: other.lastReadMessageId, isOnline: isRecentlyActive(other.lastActiveAt) };
  }

  return rows.map((message) => {
    let deliveryStatus: "sent" | "delivered" | "read" | undefined;
    if (conversation?.kind === "direct" && message.senderId === userId && otherReadState) {
      if (otherReadState.lastReadMessageId !== null && otherReadState.lastReadMessageId >= message.id) deliveryStatus = "read";
      else if (otherReadState.isOnline) deliveryStatus = "delivered";
      else deliveryStatus = "sent";
    }
    return { ...message, attachments: attachmentsByMessage.get(message.id) ?? [], deliveryStatus };
  });
}

/**
 * Détail d'un message dans une conversation de groupe (structure ou
 * communauté) : qui l'a reçu, lu ou pas encore lu. Un membre "a lu" le
 * message si son curseur `lastReadMessageId` a dépassé ce message.
 */
export async function getMessageReceipts(userId: number, conversationId: number, messageId: number) {
  await assertMember(userId, conversationId);
  const db = await getDb();
  if (!db) return { read: [], unread: [] };

  const [message] = await db.select({ senderId: messages.senderId }).from(messages).where(eq(messages.id, messageId)).limit(1);
  if (!message) throw new MessagingError("Message introuvable.");

  const members = await db
    .select({ userId: users.id, name: users.name, avatarStorageKey: jecProfiles.avatarStorageKey, lastReadMessageId: conversationMembers.lastReadMessageId })
    .from(conversationMembers)
    .innerJoin(users, eq(users.id, conversationMembers.userId))
    .leftJoin(jecProfiles, eq(jecProfiles.userId, users.id))
    .where(and(eq(conversationMembers.conversationId, conversationId), isNull(conversationMembers.leftAt), ne(conversationMembers.userId, message.senderId)));

  const read: typeof members = [];
  const unread: typeof members = [];
  for (const member of members) {
    if (member.lastReadMessageId !== null && member.lastReadMessageId >= messageId) read.push(member);
    else unread.push(member);
  }
  return { read, unread };
}

export async function sendMessage(userId: number, conversationId: number, input: { body?: string; attachments?: Array<{ storageKey: string; originalName: string; mimeType: string; sizeBytes: number }> }) {
  const db = await assertMember(userId, conversationId);
  if (!input.body?.trim() && !input.attachments?.length) throw new MessagingError("Un message ne peut pas être vide.");

  const [{ id: messageId }] = await db
    .insert(messages)
    .values({ conversationId, senderId: userId, body: input.body?.trim() ?? null, kind: input.attachments?.length ? "attachment" : "text" })
    .$returningId();

  if (input.attachments?.length) {
    await db.insert(messageAttachments).values(input.attachments.map((attachment) => ({ messageId, ...attachment })));
  }

  await db.update(conversations).set({ lastMessageAt: new Date() }).where(eq(conversations.id, conversationId));

  const recipients = await db.select({ userId: conversationMembers.userId }).from(conversationMembers).where(and(eq(conversationMembers.conversationId, conversationId), ne(conversationMembers.userId, userId)));
  await Promise.all(recipients.map((recipient) => createNotification(recipient.userId, "message", "Nouveau message", input.body?.slice(0, 140), "/messages")));

  return messageId;
}

export async function markConversationRead(userId: number, conversationId: number) {
  const db = await assertMember(userId, conversationId);
  const [lastMessage] = await db.select().from(messages).where(eq(messages.conversationId, conversationId)).orderBy(desc(messages.id)).limit(1);
  if (!lastMessage) return;
  await db.update(conversationMembers).set({ lastReadMessageId: lastMessage.id }).where(and(eq(conversationMembers.conversationId, conversationId), eq(conversationMembers.userId, userId)));
  // Synchronise la cloche : avoir lu ses messages efface les notifications "nouveau message" en attente.
  const { markNotificationsByTypeRead } = await import("./notifications");
  await markNotificationsByTypeRead(userId, ["message"]);
}
