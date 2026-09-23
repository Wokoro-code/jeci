import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, router, verifiedProcedure } from "../_core/trpc";
import * as db from "../db";
import { MessagingError } from "../db/messaging";

function toTrpcError(error: unknown): never {
  if (error instanceof MessagingError) throw new TRPCError({ code: "BAD_REQUEST", message: error.message });
  throw error;
}

export const messagingRouter = router({
  conversations: protectedProcedure.query(({ ctx }) => db.listConversations(ctx.user.id)),

  messages: protectedProcedure.input(z.object({ conversationId: z.number().int().positive(), before: z.number().int().optional() })).query(async ({ ctx, input }) => {
    try {
      return await db.listMessages(ctx.user.id, input.conversationId, input.before);
    } catch (error) {
      toTrpcError(error);
    }
  }),

  startConversation: verifiedProcedure.input(z.object({ userId: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
    try {
      const conversationId = await db.startOrGetDirectConversation(ctx.user.id, input.userId);
      return { conversationId } as const;
    } catch (error) {
      toTrpcError(error);
    }
  }),

  send: verifiedProcedure
    .input(
      z.object({
        conversationId: z.number().int().positive(),
        body: z.string().max(4000).optional(),
        attachments: z.array(z.object({ storageKey: z.string().max(512), originalName: z.string().max(255), mimeType: z.string().max(100), sizeBytes: z.number().int().positive() })).max(5).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const messageId = await db.sendMessage(ctx.user.id, input.conversationId, input);
        return { messageId } as const;
      } catch (error) {
        toTrpcError(error);
      }
    }),

  markRead: protectedProcedure.input(z.object({ conversationId: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
    try {
      await db.markConversationRead(ctx.user.id, input.conversationId);
      return { success: true } as const;
    } catch (error) {
      toTrpcError(error);
    }
  }),

  // --- Chat de groupe officiel d'une structure organisationnelle ---
  joinUnitChat: verifiedProcedure.input(z.object({ unitId: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
    try {
      const conversationId = await db.getOrJoinUnitConversation(ctx.user.id, input.unitId);
      return { conversationId } as const;
    } catch (error) {
      toTrpcError(error);
    }
  }),
  conversationMembers: protectedProcedure.input(z.object({ conversationId: z.number().int().positive() })).query(({ input }) => db.listConversationMembers(input.conversationId)),

  // Qui a reçu / lu / pas lu un message de groupe (structure ou communauté), façon "infos sur le message" WhatsApp.
  messageReceipts: protectedProcedure.input(z.object({ conversationId: z.number().int().positive(), messageId: z.number().int().positive() })).query(async ({ ctx, input }) => {
    try {
      return await db.getMessageReceipts(ctx.user.id, input.conversationId, input.messageId);
    } catch (error) {
      toTrpcError(error);
    }
  }),
});
