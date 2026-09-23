import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, router, verifiedProcedure } from "../_core/trpc";
import * as db from "../db";
import { MentorshipError } from "../db/mentorship";

function toTrpcError(error: unknown): never {
  if (error instanceof MentorshipError) throw new TRPCError({ code: "BAD_REQUEST", message: error.message });
  throw error;
}

export const mentorshipRouter = router({
  listMentors: protectedProcedure.input(z.object({ domain: z.string().max(60).optional(), country: z.string().max(100).optional(), language: z.string().max(40).optional(), search: z.string().max(120).optional() }).optional()).query(({ input }) => db.listMentors(input ?? {})),
  myRequestsAsMentee: verifiedProcedure.query(({ ctx }) => db.listMyMentorshipAsMentee(ctx.user.id)),
  myRequestsAsMentor: verifiedProcedure.query(({ ctx }) => db.listMyMentorshipAsMentor(ctx.user.id)),

  request: verifiedProcedure
    .input(z.object({ mentorId: z.number().int().positive(), topic: z.string().min(3).max(200), message: z.string().max(1000).optional() }))
    .mutation(async ({ ctx, input }) => {
      try {
        const { mentorId, ...rest } = input;
        return { requestId: await db.requestMentorship(ctx.user.id, mentorId, rest) };
      } catch (error) {
        toTrpcError(error);
      }
    }),

  respond: verifiedProcedure.input(z.object({ requestId: z.number().int().positive(), decision: z.enum(["accepted", "declined"]) })).mutation(async ({ ctx, input }) => {
    try {
      await db.respondToMentorship(ctx.user.id, input.requestId, input.decision);
      return { success: true } as const;
    } catch (error) {
      toTrpcError(error);
    }
  }),

  cancel: verifiedProcedure.input(z.object({ requestId: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
    try {
      await db.cancelMentorshipRequest(ctx.user.id, input.requestId);
      return { success: true } as const;
    } catch (error) {
      toTrpcError(error);
    }
  }),
});
