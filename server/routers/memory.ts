import { z } from "zod";
import { adminProcedure, moderatorProcedure, protectedProcedure, router, verifiedProcedure } from "../_core/trpc";
import * as db from "../db";

export const memoryRouter = router({
  list: protectedProcedure.input(z.object({ unitId: z.number().int().positive().optional() }).optional()).query(({ input }) => db.listMemoryEntries(input ?? {})),
  submit: verifiedProcedure
    .input(z.object({ unitId: z.number().int().positive().optional(), title: z.string().min(3).max(200), periodLabel: z.string().max(80).optional(), body: z.string().max(4000).optional(), mediaStorageKey: z.string().max(512).optional(), mediaMimeType: z.string().max(100).optional(), linkUrl: z.string().url().max(500).optional() }))
    .mutation(async ({ ctx, input }) => ({ entryId: await db.submitMemoryEntry(ctx.user.id, input) })),
  pending: moderatorProcedure.query(() => db.listPendingMemoryEntries()),
  decide: adminProcedure.input(z.object({ entryId: z.number().int().positive(), decision: z.enum(["published", "rejected"]) })).mutation(async ({ ctx, input }) => {
    await db.decideMemoryEntry(ctx.user.id, input.entryId, input.decision);
    return { success: true } as const;
  }),
});
