import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, router, verifiedProcedure } from "../_core/trpc";
import * as db from "../db";
import { ProjectError } from "../db/projects";

function toTrpcError(error: unknown): never {
  if (error instanceof ProjectError) throw new TRPCError({ code: "BAD_REQUEST", message: error.message });
  throw error;
}

export const projectsRouter = router({
  list: protectedProcedure.input(z.object({ communityId: z.number().int().positive().optional(), contributable: z.boolean().optional() }).optional()).query(({ ctx, input }) => db.listProjects(ctx.user.id, input ?? {})),
  get: protectedProcedure.input(z.object({ projectId: z.number().int().positive() })).query(({ ctx, input }) => db.getProject(input.projectId, ctx.user.id)),

  create: verifiedProcedure
    .input(z.object({ name: z.string().min(2).max(160), description: z.string().max(2000).optional(), domain: z.string().max(120).optional(), location: z.string().max(160).optional(), objective: z.string().max(2000).optional(), needs: z.string().max(1000).optional(), budgetIndicative: z.string().max(120).optional(), partners: z.string().max(1000).optional(), coverStorageKey: z.string().max(512).optional(), coverMimeType: z.string().max(100).optional(), linkUrl: z.string().url().max(500).optional(), communityId: z.number().int().positive().optional(), visibility: z.enum(["network", "unit_only", "private"]).optional() }))
    .mutation(async ({ ctx, input }) => ({ projectId: await db.createProject(ctx.user.id, input) })),

  update: verifiedProcedure
    .input(z.object({ projectId: z.number().int().positive(), name: z.string().min(2).max(160).optional(), description: z.string().max(2000).optional(), domain: z.string().max(120).optional(), location: z.string().max(160).optional(), objective: z.string().max(2000).optional(), needs: z.string().max(1000).optional(), budgetIndicative: z.string().max(120).optional(), partners: z.string().max(1000).optional(), coverStorageKey: z.string().max(512).optional(), coverMimeType: z.string().max(100).optional(), linkUrl: z.string().url().max(500).optional(), status: z.enum(["idea", "in_preparation", "in_progress", "completed", "suspended"]).optional(), visibility: z.enum(["network", "unit_only", "private"]).optional() }))
    .mutation(async ({ ctx, input }) => {
      const { projectId, ...rest } = input;
      try {
        await db.updateProject(ctx.user.id, projectId, rest);
        return { success: true } as const;
      } catch (error) {
        toTrpcError(error);
      }
    }),

  join: verifiedProcedure.input(z.object({ projectId: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
    try {
      await db.joinProject(ctx.user.id, input.projectId);
      return { success: true } as const;
    } catch (error) {
      toTrpcError(error);
    }
  }),
  leave: protectedProcedure.input(z.object({ projectId: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
    await db.leaveProject(ctx.user.id, input.projectId);
    return { success: true } as const;
  }),

  addMember: verifiedProcedure.input(z.object({ projectId: z.number().int().positive(), userId: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
    try {
      await db.addProjectMember(ctx.user.id, input.projectId, input.userId);
      return { success: true } as const;
    } catch (error) {
      toTrpcError(error);
    }
  }),

  removeMember: verifiedProcedure.input(z.object({ projectId: z.number().int().positive(), userId: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
    try {
      await db.removeProjectMember(ctx.user.id, input.projectId, input.userId);
      return { success: true } as const;
    } catch (error) {
      toTrpcError(error);
    }
  }),
});
