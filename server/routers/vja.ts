import { z } from "zod";
import { protectedProcedure, router, verifiedProcedure } from "../_core/trpc";
import * as db from "../db";

const vjaFields = {
  title: z.string().min(3).max(200),
  unitId: z.number().int().positive().optional(),
  seeReality: z.string().min(1).max(4000),
  judgeAnalysis: z.string().max(4000).optional(),
  judgeReflection: z.string().max(4000).optional(),
  actObjective: z.string().max(1000).optional(),
  actAction: z.string().max(2000).optional(),
  actResults: z.string().max(2000).optional(),
  actEvaluation: z.string().max(2000).optional(),
  mediaStorageKey: z.string().max(512).optional(),
  mediaMimeType: z.string().max(100).optional(),
  linkUrl: z.string().url().max(500).optional(),
  status: z.enum(["draft", "in_progress", "completed"]).optional(),
  visibility: z.enum(["network", "unit_only", "private"]).optional(),
};

export const vjaRouter = router({
  list: protectedProcedure.query(({ ctx }) => db.listVjaSheets(ctx.user.id)),
  get: protectedProcedure.input(z.object({ sheetId: z.number().int().positive() })).query(({ input }) => db.getVjaSheet(input.sheetId)),
  create: verifiedProcedure.input(z.object(vjaFields)).mutation(async ({ ctx, input }) => ({ sheetId: await db.createVjaSheet(ctx.user.id, input) })),
  update: verifiedProcedure
    .input(
      z.object({
        sheetId: z.number().int().positive(),
        title: z.string().min(3).max(200).optional(),
        unitId: z.number().int().positive().optional(),
        seeReality: z.string().max(4000).optional(),
        judgeAnalysis: z.string().max(4000).optional(),
        judgeReflection: z.string().max(4000).optional(),
        actObjective: z.string().max(1000).optional(),
        actAction: z.string().max(2000).optional(),
        actResults: z.string().max(2000).optional(),
        actEvaluation: z.string().max(2000).optional(),
        mediaStorageKey: z.string().max(512).optional(),
        mediaMimeType: z.string().max(100).optional(),
        linkUrl: z.string().url().max(500).optional(),
        status: z.enum(["draft", "in_progress", "completed"]).optional(),
        visibility: z.enum(["network", "unit_only", "private"]).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { sheetId, ...rest } = input;
      await db.updateVjaSheet(ctx.user.id, sheetId, rest);
      return { success: true } as const;
    }),
});
