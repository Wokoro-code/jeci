import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, router, verifiedProcedure } from "../_core/trpc";
import * as db from "../db";
import { ConnectionError } from "../db/connections";

function toTrpcError(error: unknown): never {
  if (error instanceof ConnectionError) throw new TRPCError({ code: "BAD_REQUEST", message: error.message });
  throw error;
}

export const networkRouter = router({
  list: protectedProcedure.query(({ ctx }) => db.listConnections(ctx.user.id)),
  pending: protectedProcedure.query(({ ctx }) => db.listPendingRequests(ctx.user.id)),
  // « Vous connaissez peut-être » (cahier §17, §42).
  suggestions: protectedProcedure.query(({ ctx }) => db.listConnectionSuggestions(ctx.user.id)),

  sendRequest: verifiedProcedure
    .input(z.object({ userId: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      try {
        await db.sendConnectionRequest(ctx.user.id, input.userId);
        return { success: true } as const;
      } catch (error) {
        toTrpcError(error);
      }
    }),

  respond: verifiedProcedure
    .input(z.object({ requesterId: z.number().int().positive(), decision: z.enum(["accepted", "declined"]) }))
    .mutation(async ({ ctx, input }) => {
      try {
        await db.respondToConnectionRequest(ctx.user.id, input.requesterId, input.decision);
        return { success: true } as const;
      } catch (error) {
        toTrpcError(error);
      }
    }),

  cancel: verifiedProcedure.input(z.object({ userId: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
    await db.cancelOrRemoveConnection(ctx.user.id, input.userId);
    return { success: true } as const;
  }),

  block: verifiedProcedure.input(z.object({ userId: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
    await db.blockUser(ctx.user.id, input.userId);
    return { success: true } as const;
  }),
});
