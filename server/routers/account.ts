import { z } from "zod";
import { protectedProcedure, router, verifiedProcedure } from "../_core/trpc";
import * as db from "../db";

const jecStatusEnum = z.enum(["active_jeciste", "alumni_jeciste", "former_leader", "current_leader", "chaplain", "facilitator", "volunteer", "supporter"]);
const privacyLevelEnum = z.enum(["public", "members", "connections", "private"]);

export const accountRouter = router({
  overview: protectedProcedure.query(async ({ ctx }) => ({ user: ctx.user, ...(await db.getAccountOverview(ctx.user.id)) })),
  myVerification: protectedProcedure.query(({ ctx }) => db.getMyVerification(ctx.user.id)),

  updateProfile: protectedProcedure
    .input(
      z.object({
        headline: z.string().max(180).optional(),
        jecStatus: jecStatusEnum.optional(),
        unitId: z.number().int().positive().optional(),
        organization: z.string().max(180).optional(),
        jobTitle: z.string().max(180).optional(),
        sector: z.string().max(120).optional(),
        country: z.string().max(100).optional(),
        city: z.string().max(120).optional(),
        bio: z.string().max(3000).optional(),
        languages: z.array(z.string().max(40)).max(10).optional(),
        skills: z.array(z.string().max(60)).max(20).optional(),
        certifications: z.array(z.string().max(120)).max(20).optional(),
        interests: z.array(z.string().max(60)).max(20).optional(),
        website: z.string().max(300).optional(),
        phone: z.string().max(40).optional(),
        directoryVisibility: z.enum(["network", "unit_only", "private"]).optional(),
        mentorAvailable: z.boolean().optional(),
        mentorTopics: z.array(z.string().max(60)).max(10).optional(),
        availableForCollaboration: z.boolean().optional(),
        availableAsExpert: z.boolean().optional(),
        availableForProjects: z.boolean().optional(),
        privacyEmail: privacyLevelEnum.optional(),
        privacyPhone: privacyLevelEnum.optional(),
        privacyCity: privacyLevelEnum.optional(),
        privacyJecPath: privacyLevelEnum.optional(),
        privacyProfessionalPath: privacyLevelEnum.optional(),
        avatarStorageKey: z.string().max(512).optional(),
        coverStorageKey: z.string().max(512).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await db.updateProfile(ctx.user.id, input);
      return { success: true } as const;
    }),

  submitVerification: protectedProcedure
    .input(z.object({ documents: z.array(z.object({ storageKey: z.string().min(1).max(512), originalName: z.string().min(1).max(255), mimeType: z.string().min(1).max(100) })).min(1).max(5) }))
    .mutation(async ({ ctx, input }) => ({ requestId: await db.submitVerification(ctx.user.id, input.documents) })),

  // Annuaire mondial : lecture ouverte à tout compte connecté, y compris en attente de vérification.
  directory: protectedProcedure
    .input(z.object({ search: z.string().max(120).optional(), unitId: z.number().int().positive().optional(), country: z.string().max(100).optional(), jecStatus: jecStatusEnum.optional(), mentorOnly: z.boolean().optional(), cursor: z.number().int().optional(), limit: z.number().int().max(50).optional() }))
    .query(({ ctx, input }) => db.listDirectory(ctx.user.id, input)),

  publicProfile: protectedProcedure.input(z.object({ userId: z.number().int().positive() })).query(({ ctx, input }) => db.getPublicProfile(ctx.user.id, input.userId)),

  // --- « Mon parcours JEC » (cahier §8) ---
  addJecExperience: verifiedProcedure
    .input(z.object({ unitId: z.number().int().positive().optional(), movementLabel: z.string().max(160).optional(), functionTitle: z.string().min(1).max(160), startDate: z.string().optional(), endDate: z.string().optional(), description: z.string().max(2000).optional(), responsibilities: z.string().max(2000).optional() }))
    .mutation(async ({ ctx, input }) => ({ experienceId: await db.addJecExperience(ctx.user.id, input) })),
  updateJecExperience: verifiedProcedure
    .input(z.object({ experienceId: z.number().int().positive(), unitId: z.number().int().positive().optional(), movementLabel: z.string().max(160).optional(), functionTitle: z.string().max(160).optional(), startDate: z.string().optional(), endDate: z.string().optional(), description: z.string().max(2000).optional(), responsibilities: z.string().max(2000).optional() }))
    .mutation(async ({ ctx, input }) => {
      const { experienceId, ...rest } = input;
      await db.updateJecExperience(ctx.user.id, experienceId, rest);
      return { success: true } as const;
    }),
  deleteJecExperience: verifiedProcedure.input(z.object({ experienceId: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
    await db.deleteJecExperience(ctx.user.id, input.experienceId);
    return { success: true } as const;
  }),

  // --- Parcours professionnel : expériences, formation, certifications (cahier §7) ---
  addProfessionalExperience: verifiedProcedure
    .input(z.object({ kind: z.enum(["work", "education", "certification"]), title: z.string().min(1).max(180), organization: z.string().max(180).optional(), startDate: z.string().optional(), endDate: z.string().optional(), description: z.string().max(2000).optional() }))
    .mutation(async ({ ctx, input }) => ({ experienceId: await db.addProfessionalExperience(ctx.user.id, input) })),
  updateProfessionalExperience: verifiedProcedure
    .input(z.object({ experienceId: z.number().int().positive(), kind: z.enum(["work", "education", "certification"]).optional(), title: z.string().max(180).optional(), organization: z.string().max(180).optional(), startDate: z.string().optional(), endDate: z.string().optional(), description: z.string().max(2000).optional() }))
    .mutation(async ({ ctx, input }) => {
      const { experienceId, ...rest } = input;
      await db.updateProfessionalExperience(ctx.user.id, experienceId, rest);
      return { success: true } as const;
    }),
  deleteProfessionalExperience: verifiedProcedure.input(z.object({ experienceId: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
    await db.deleteProfessionalExperience(ctx.user.id, input.experienceId);
    return { success: true } as const;
  }),

  // --- Référentiel organisationnel (cahier §5), lecture ouverte pour peupler les sélecteurs de profil ---
  organizationalUnits: protectedProcedure.input(z.object({ parentId: z.number().int().positive().optional(), level: z.enum(["international", "regional", "national", "local", "group"]).optional() }).optional()).query(({ input }) => db.listOrganizationalUnits(input ?? {})),
  organizationalUnit: protectedProcedure.input(z.object({ unitId: z.number().int().positive() })).query(({ input }) => db.getOrganizationalUnit(input.unitId)),
});
