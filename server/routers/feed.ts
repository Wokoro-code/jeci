import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, router, verifiedProcedure } from "../_core/trpc";
import * as db from "../db";
import { FeedError } from "../db/feed";

function toTrpcError(error: unknown): never {
  if (error instanceof FeedError) throw new TRPCError({ code: "BAD_REQUEST", message: error.message });
  throw error;
}

export const feedRouter = router({
  list: protectedProcedure.input(z.object({ cursor: z.number().int().optional(), communityId: z.number().int().positive().optional() })).query(({ ctx, input }) => db.listFeed(ctx.user.id, input.cursor, input.communityId)),

  getById: protectedProcedure.input(z.object({ postId: z.number().int().positive() })).query(({ ctx, input }) => db.getPostById(input.postId, ctx.user.id)),

  create: verifiedProcedure
    .input(z.object({ body: z.string().min(1).max(3000), communityId: z.number().int().positive().optional(), category: z.enum(["news", "testimony", "reflection", "project", "opportunity", "event", "training", "call_for_contribution", "skills_request", "volunteer_request"]).optional(), visibility: z.enum(["network", "unit_only", "public"]).optional(), attachmentStorageKey: z.string().max(512).optional(), attachmentMimeType: z.string().max(100).optional() }))
    .mutation(async ({ ctx, input }) => ({ postId: await db.createPost(ctx.user.id, input) })),

  update: verifiedProcedure.input(z.object({ postId: z.number().int().positive(), body: z.string().min(1).max(3000) })).mutation(async ({ ctx, input }) => {
    try {
      await db.updatePost(ctx.user.id, input.postId, input.body);
      return { success: true } as const;
    } catch (error) {
      toTrpcError(error);
    }
  }),

  delete: verifiedProcedure.input(z.object({ postId: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
    try {
      await db.deletePost(ctx.user.id, input.postId);
      return { success: true } as const;
    } catch (error) {
      toTrpcError(error);
    }
  }),

  react: verifiedProcedure.input(z.object({ postId: z.number().int().positive(), kind: z.enum(["like", "celebrate", "support", "insightful"]) })).mutation(({ ctx, input }) => db.toggleReaction(ctx.user.id, input.postId, input.kind)),

  comments: protectedProcedure.input(z.object({ postId: z.number().int().positive() })).query(({ input }) => db.listComments(input.postId)),

  addComment: verifiedProcedure.input(z.object({ postId: z.number().int().positive(), body: z.string().min(1).max(1000) })).mutation(async ({ ctx, input }) => ({ commentId: await db.addComment(ctx.user.id, input.postId, input.body) })),

  deleteComment: verifiedProcedure.input(z.object({ commentId: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
    try {
      await db.deleteComment(ctx.user.id, input.commentId);
      return { success: true } as const;
    } catch (error) {
      toTrpcError(error);
    }
  }),
});
