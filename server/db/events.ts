import { and, asc, count, desc, eq, isNull } from "drizzle-orm";
import { eventRegistrations, events, users } from "../../drizzle/schema";
import { getDb } from "./client";
import { logAction } from "./audit";
import { createNotification } from "./notifications";
import { sendEmail, emailTemplates } from "../email";

export class EventError extends Error {}

export async function createEvent(authorId: number, input: { title: string; description: string; type?: "meeting" | "camp" | "training" | "conference" | "assembly" | "gathering" | "webinar" | "social" | "international_meeting"; communityId?: number; location?: string; isOnline?: boolean; startsAt: Date; endsAt?: Date; capacity?: number; imageStorageKey?: string; registrationUrl?: string }) {
  const db = await getDb();
  if (!db) throw new EventError("Base de données indisponible");
  const [{ id }] = await db.insert(events).values({ authorId, ...input }).$returningId();
  return id;
}

/** Événements publiés ; `communityId` restreint à une communauté (cahier §15), `type` filtre par catégorie (cahier §22). */
export async function listPublishedEvents(filters: { communityId?: number; type?: string } = {}) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [eq(events.status, "published"), filters.communityId ? eq(events.communityId, filters.communityId) : isNull(events.communityId)];
  if (filters.type) conditions.push(eq(events.type, filters.type as typeof events.$inferSelect["type"]));
  const rows = await db
    .select({ id: events.id, title: events.title, type: events.type, description: events.description, communityId: events.communityId, location: events.location, isOnline: events.isOnline, startsAt: events.startsAt, endsAt: events.endsAt, capacity: events.capacity, imageStorageKey: events.imageStorageKey, registrationUrl: events.registrationUrl, authorName: users.name })
    .from(events)
    .innerJoin(users, eq(users.id, events.authorId))
    .where(and(...conditions))
    .orderBy(asc(events.startsAt));
  const withCounts = await Promise.all(
    rows.map(async (event) => {
      const [registered] = await db.select({ value: count() }).from(eventRegistrations).where(and(eq(eventRegistrations.eventId, event.id), eq(eventRegistrations.status, "registered")));
      return { ...event, registeredCount: registered?.value ?? 0 };
    }),
  );
  return withCounts;
}

export async function listMyEvents(authorId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(events).where(eq(events.authorId, authorId)).orderBy(asc(events.startsAt));
}

export async function registerForEvent(userId: number, eventId: number) {
  const db = await getDb();
  if (!db) throw new EventError("Base de données indisponible");
  const [event] = await db.select().from(events).where(eq(events.id, eventId)).limit(1);
  if (!event || event.status !== "published") throw new EventError("Cet événement n'est pas ouvert aux inscriptions.");

  const [registeredCount] = await db.select({ value: count() }).from(eventRegistrations).where(and(eq(eventRegistrations.eventId, eventId), eq(eventRegistrations.status, "registered")));
  const isFull = event.capacity != null && (registeredCount?.value ?? 0) >= event.capacity;

  await db
    .insert(eventRegistrations)
    .values({ eventId, userId, status: isFull ? "waitlisted" : "registered" })
    .onDuplicateKeyUpdate({ set: { status: isFull ? "waitlisted" : "registered", registeredAt: new Date() } });

  return { waitlisted: isFull };
}

export async function cancelEventRegistration(userId: number, eventId: number) {
  const db = await getDb();
  if (!db) throw new EventError("Base de données indisponible");
  await db.update(eventRegistrations).set({ status: "cancelled" }).where(and(eq(eventRegistrations.eventId, eventId), eq(eventRegistrations.userId, userId)));
}

export async function listPendingEvents() {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({ id: events.id, title: events.title, description: events.description, startsAt: events.startsAt, authorName: users.name })
    .from(events)
    .innerJoin(users, eq(users.id, events.authorId))
    .where(eq(events.status, "pending"));
}

export async function decideEvent(actorId: number, eventId: number, decision: "published" | "cancelled", reason?: string) {
  const db = await getDb();
  if (!db) throw new EventError("Base de données indisponible");
  await db.update(events).set({ status: decision, moderationReason: reason ?? null }).where(eq(events.id, eventId));
  await logAction({ actorId, action: "event.decide", entityType: "event", entityId: eventId, reason, after: { decision } });

  if (decision === "cancelled") {
    const registrants = await db
      .select({ userId: eventRegistrations.userId, name: users.name, email: users.email })
      .from(eventRegistrations)
      .innerJoin(users, eq(users.id, eventRegistrations.userId))
      .where(and(eq(eventRegistrations.eventId, eventId), eq(eventRegistrations.status, "registered")));
    const [event] = await db.select({ title: events.title }).from(events).where(eq(events.id, eventId)).limit(1);
    await Promise.all(
      registrants.map(async (registrant) => {
        await createNotification(registrant.userId, "event_cancelled", "Événement annulé", reason, "/events");
        if (registrant.email) await sendEmail({ to: registrant.email, ...emailTemplates.eventCancelled(registrant.name ?? "", event?.title ?? "cet événement", reason) });
      }),
    );
  }
}

/** Vue admin complète, tous statuts confondus. */
export async function listAllEventsForAdmin() {
  const db = await getDb();
  if (!db) return [];
  const rows = await db
    .select({ id: events.id, title: events.title, status: events.status, startsAt: events.startsAt, location: events.location, authorName: users.name })
    .from(events)
    .innerJoin(users, eq(users.id, events.authorId))
    .orderBy(desc(events.startsAt));
  const withCounts = await Promise.all(
    rows.map(async (event) => {
      const [registered] = await db.select({ value: count() }).from(eventRegistrations).where(and(eq(eventRegistrations.eventId, event.id), eq(eventRegistrations.status, "registered")));
      return { ...event, registeredCount: registered?.value ?? 0 };
    }),
  );
  return withCounts;
}
