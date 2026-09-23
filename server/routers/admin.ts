import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { adminProcedure, moderatorProcedure, router } from "../_core/trpc";
import * as db from "../db";
import { getActiveRoleCodes } from "../db/users";
import { FeedError } from "../db/feed";

const assignableRoleEnum = z.enum(["mentor", "moderator", "verification_officer", "community_admin", "local_admin", "national_admin", "regional_admin", "international_admin", "super_admin"]);
const roleScopeInput = z.object({ scopeType: z.enum(["global", "unit", "community"]).default("global"), scopeId: z.number().int().positive().optional() }).optional();

async function resolveActorRole(userId: number, isAdmin: boolean): Promise<string> {
  if (isAdmin) return "super_admin";
  const codes = await getActiveRoleCodes(userId);
  return codes.includes("moderator") ? "moderator" : "unknown";
}

export const adminRouter = router({
  // --- Vérification des comptes (cahier §10) ---
  verificationQueue: adminProcedure.query(() => db.listVerificationQueue()),
  verificationDetail: adminProcedure.input(z.object({ userId: z.number().int().positive() })).query(({ input }) => db.getVerificationDetail(input.userId)),
  decideVerification: adminProcedure
    .input(z.object({ userId: z.number().int().positive(), decision: z.enum(["approved", "rejected", "needs_information"]), reason: z.string().max(3000).optional() }))
    .mutation(async ({ ctx, input }) => {
      await db.decideVerification(input.userId, ctx.user.id, input.decision, input.reason);
      return { success: true } as const;
    }),

  // --- RBAC : rôles et périmètres (cahier §28) ---
  roleAssignments: adminProcedure.query(() => db.listRoleAssignments()),
  assignRole: adminProcedure
    .input(z.object({ userId: z.number().int().positive(), roleCode: assignableRoleEnum, reason: z.string().min(3).max(500), scope: roleScopeInput }))
    .mutation(async ({ ctx, input }) => {
      await db.assignRole(ctx.user.id, input.userId, input.roleCode, input.reason, input.scope ?? { scopeType: "global" });
      return { success: true } as const;
    }),
  revokeRole: adminProcedure
    .input(z.object({ userId: z.number().int().positive(), roleCode: assignableRoleEnum, reason: z.string().min(3).max(500), scope: roleScopeInput }))
    .mutation(async ({ ctx, input }) => {
      await db.revokeRole(ctx.user.id, input.userId, input.roleCode, input.reason, input.scope ?? { scopeType: "global" });
      return { success: true } as const;
    }),

  // --- Architecture organisationnelle JECI (cahier §5, §27) ---
  organizationalUnits: adminProcedure.input(z.object({ parentId: z.number().int().positive().optional(), level: z.enum(["international", "regional", "national", "local", "group"]).optional() }).optional()).query(({ input }) => db.listOrganizationalUnits(input ?? {})),
  createOrganizationalUnit: adminProcedure
    .input(z.object({ parentId: z.number().int().positive().optional(), level: z.enum(["international", "regional", "national", "local", "group"]), name: z.string().min(1).max(160), localTypeLabel: z.string().max(80).optional(), description: z.string().max(2000).optional(), countryCode: z.string().max(2).optional() }))
    .mutation(async ({ ctx, input }) => ({ unitId: await db.createOrganizationalUnit(ctx.user.id, input) })),
  setOrganizationalUnitActive: adminProcedure.input(z.object({ unitId: z.number().int().positive(), isActive: z.boolean() })).mutation(async ({ ctx, input }) => {
    await db.setOrganizationalUnitActive(ctx.user.id, input.unitId, input.isActive);
    return { success: true } as const;
  }),

  // --- Communautés (cahier §15) ---
  communities: adminProcedure.query(() => db.listCommunities()),
  createCommunity: adminProcedure
    .input(z.object({ name: z.string().min(1).max(160), description: z.string().max(2000).optional(), scope: z.enum(["international", "regional", "national", "professional", "thematic"]), unitId: z.number().int().positive().optional(), imageStorageKey: z.string().max(512).optional() }))
    .mutation(async ({ ctx, input }) => ({ communityId: await db.createCommunity(ctx.user.id, input) })),

  // --- Modération : signalements ---
  reportQueue: moderatorProcedure.query(() => db.listReportQueue()),
  decideReport: moderatorProcedure
    .input(z.object({ reportId: z.number().int().positive(), decision: z.enum(["under_review", "escalated", "resolved", "dismissed"]), reason: z.string().max(2000).optional() }))
    .mutation(async ({ ctx, input }) => {
      const actorRole = await resolveActorRole(ctx.user.id, ctx.user.role === "admin");
      try {
        await db.decideReport(ctx.user.id, actorRole, input.reportId, input.decision, input.reason);
        return { success: true } as const;
      } catch (error) {
        if (error instanceof Error) throw new TRPCError({ code: "FORBIDDEN", message: error.message });
        throw error;
      }
    }),

  // --- Modération : publications ---
  moderatePost: moderatorProcedure
    .input(z.object({ postId: z.number().int().positive(), action: z.enum(["hide", "delete"]), reason: z.string().min(3).max(1000) }))
    .mutation(async ({ ctx, input }) => {
      if (input.action === "delete" && ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Le retrait définitif est réservé au Super administrateur." });
      }
      try {
        await db.moderatePost(ctx.user.id, input.postId, input.action, input.reason);
        return { success: true } as const;
      } catch (error) {
        if (error instanceof FeedError) throw new TRPCError({ code: "BAD_REQUEST", message: error.message });
        throw error;
      }
    }),

  // --- Opportunités et événements : validation ---
  pendingOpportunities: adminProcedure.query(() => db.listPendingOpportunities()),
  decideOpportunity: adminProcedure.input(z.object({ opportunityId: z.number().int().positive(), decision: z.enum(["published", "rejected"]), reason: z.string().max(1000).optional() })).mutation(async ({ ctx, input }) => {
    await db.decideOpportunity(ctx.user.id, input.opportunityId, input.decision, input.reason);
    return { success: true } as const;
  }),
  pendingEvents: adminProcedure.query(() => db.listPendingEvents()),
  decideEvent: adminProcedure.input(z.object({ eventId: z.number().int().positive(), decision: z.enum(["published", "cancelled"]), reason: z.string().max(1000).optional() })).mutation(async ({ ctx, input }) => {
    await db.decideEvent(ctx.user.id, input.eventId, input.decision, input.reason);
    return { success: true } as const;
  }),

  // --- Projets ---
  archiveProject: adminProcedure.input(z.object({ projectId: z.number().int().positive(), reason: z.string().min(3).max(1000) })).mutation(async ({ ctx, input }) => {
    await db.archiveProjectByAdmin(ctx.user.id, input.projectId, input.reason);
    return { success: true } as const;
  }),

  // --- Communications officielles ---
  campaigns: adminProcedure.query(() => db.listCampaigns()),
  createCampaign: adminProcedure
    .input(z.object({ title: z.string().min(3).max(200), body: z.string().min(3).max(4000), segment: z.enum(["all", "verified", "mentors", "unit"]), unitId: z.number().int().positive().optional() }))
    .mutation(async ({ ctx, input }) => ({ campaignId: await db.createCampaign(ctx.user.id, input) })),
  sendCampaign: adminProcedure.input(z.object({ campaignId: z.number().int().positive() })).mutation(({ ctx, input }) => db.sendCampaign(ctx.user.id, input.campaignId)),

  // --- Tableau de bord ---
  dashboardStats: adminProcedure.query(() => db.getDashboardStats()),

  // --- Registre des membres ---
  members: adminProcedure
    .input(z.object({ search: z.string().max(120).optional(), status: z.enum(["verified", "pending_verification", "rejected", "suspended", "deactivated"]).optional(), unitId: z.number().int().positive().optional() }))
    .query(({ input }) => db.listAllMembers(input)),
  suspendMember: adminProcedure.input(z.object({ userId: z.number().int().positive(), reason: z.string().min(3).max(1000) })).mutation(async ({ ctx, input }) => {
    await db.suspendMember(ctx.user.id, input.userId, input.reason);
    return { success: true } as const;
  }),
  reactivateMember: adminProcedure.input(z.object({ userId: z.number().int().positive(), reason: z.string().max(1000).optional() })).mutation(async ({ ctx, input }) => {
    await db.reactivateMember(ctx.user.id, input.userId, input.reason);
    return { success: true } as const;
  }),

  // --- Vues admin complètes (tous statuts) ---
  allOpportunities: adminProcedure.query(() => db.listAllOpportunitiesForAdmin()),
  allEvents: adminProcedure.query(() => db.listAllEventsForAdmin()),
  allProjects: adminProcedure.query(() => db.listAllProjectsForAdmin()),
  allMentorship: adminProcedure.query(() => db.listAllMentorshipForAdmin()),
  recentPosts: moderatorProcedure.query(() => db.listRecentPostsForModeration()),
});
