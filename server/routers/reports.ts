import { z } from "zod";
import { protectedProcedure, router, verifiedProcedure } from "../_core/trpc";
import * as db from "../db";

export const reportsRouter = router({
  mine: protectedProcedure.query(({ ctx }) => db.listMyReports(ctx.user.id)),
  create: verifiedProcedure
    .input(z.object({ targetType: z.enum(["post", "comment", "message", "profile", "opportunity", "event", "project"]), targetId: z.number().int().positive(), reason: z.string().min(2).max(120), details: z.string().max(2000).optional() }))
    .mutation(async ({ ctx, input }) => ({ reportId: await db.createReport(ctx.user.id, input) })),
});
