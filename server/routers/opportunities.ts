import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, router, verifiedProcedure } from "../_core/trpc";
import * as db from "../db";
import { OpportunityError } from "../db/opportunities";

function toTrpcError(error: unknown): never {
  if (error instanceof OpportunityError) throw new TRPCError({ code: "BAD_REQUEST", message: error.message });
  throw error;
}

export const opportunitiesRouter = router({
  listPublished: protectedProcedure.input(z.object({ type: z.enum(["job", "internship", "volunteering", "scholarship", "training", "call_for_projects", "funding", "mission", "expertise", "other"]).optional(), location: z.string().max(120).optional(), search: z.string().max(120).optional() }).optional()).query(({ input }) => db.listPublishedOpportunities(input ?? {})),
  mine: verifiedProcedure.query(({ ctx }) => db.listMyOpportunities(ctx.user.id)),

  create: verifiedProcedure
    .input(
      z.object({
        title: z.string().min(3).max(180),
        type: z.enum(["job", "internship", "volunteering", "scholarship", "training", "call_for_projects", "funding", "mission", "expertise", "other"]),
        organization: z.string().max(180).optional(),
        location: z.string().max(120).optional(),
        description: z.string().min(10).max(4000),
        applyUrl: z.string().url().max(500).optional(),
        contactEmail: z.string().email().optional(),
        closesAt: z.coerce.date().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => ({ opportunityId: await db.createOpportunity(ctx.user.id, input) })),

  update: verifiedProcedure
    .input(z.object({ opportunityId: z.number().int().positive(), title: z.string().min(3).max(180).optional(), description: z.string().min(10).max(4000).optional(), applyUrl: z.string().url().max(500).optional(), location: z.string().max(120).optional(), closesAt: z.coerce.date().optional() }))
    .mutation(async ({ ctx, input }) => {
      const { opportunityId, ...rest } = input;
      try {
        await db.updateMyOpportunity(ctx.user.id, opportunityId, rest);
        return { success: true } as const;
      } catch (error) {
        toTrpcError(error);
      }
    }),

  close: verifiedProcedure.input(z.object({ opportunityId: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
    try {
      await db.closeMyOpportunity(ctx.user.id, input.opportunityId);
      return { success: true } as const;
    } catch (error) {
      toTrpcError(error);
    }
  }),
});
