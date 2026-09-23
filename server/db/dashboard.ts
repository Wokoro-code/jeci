import { count, eq } from "drizzle-orm";
import { events, mentorshipRequests, opportunities, posts, reports, users } from "../../drizzle/schema";
import { getDb } from "./client";

export async function getDashboardStats() {
  const db = await getDb();
  if (!db) return null;

  const [[totalMembers], [verifiedMembers], [pendingVerifications], [openReports], [pendingOpportunities], [pendingEvents], [pendingMentorship], [totalPosts]] = await Promise.all([
    db.select({ value: count() }).from(users),
    db.select({ value: count() }).from(users).where(eq(users.accountStatus, "verified")),
    db.select({ value: count() }).from(users).where(eq(users.accountStatus, "pending_verification")),
    db.select({ value: count() }).from(reports).where(eq(reports.status, "open")),
    db.select({ value: count() }).from(opportunities).where(eq(opportunities.status, "pending")),
    db.select({ value: count() }).from(events).where(eq(events.status, "pending")),
    db.select({ value: count() }).from(mentorshipRequests).where(eq(mentorshipRequests.status, "pending")),
    db.select({ value: count() }).from(posts),
  ]);

  return {
    totalMembers: totalMembers?.value ?? 0,
    verifiedMembers: verifiedMembers?.value ?? 0,
    pendingVerifications: pendingVerifications?.value ?? 0,
    openReports: openReports?.value ?? 0,
    pendingOpportunities: pendingOpportunities?.value ?? 0,
    pendingEvents: pendingEvents?.value ?? 0,
    pendingMentorship: pendingMentorship?.value ?? 0,
    totalPosts: totalPosts?.value ?? 0,
  };
}
