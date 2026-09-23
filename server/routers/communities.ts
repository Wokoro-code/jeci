import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure, router, verifiedProcedure } from "../_core/trpc";
import * as db from "../db";
import { CommunityError } from "../db/organization";
import { MessagingError } from "../db/messaging";

function toTrpcError(error: unknown): never {
  if (error instanceof CommunityError) throw new TRPCError({ code: "FORBIDDEN", message: error.message });
  if (error instanceof MessagingError) throw new TRPCError({ code: "BAD_REQUEST", message: error.message });
  throw error;
}

export const communitiesRouter = router({
  list: protectedProcedure.input(z.object({ scope: z.enum(["international", "regional", "national", "professional", "thematic"]).optional(), unitId: z.number().int().positive().optional() }).optional()).query(({ input }) => db.listCommunities(input ?? {})),
  get: protectedProcedure.input(z.object({ communityId: z.number().int().positive() })).query(({ ctx, input }) => db.getCommunity(input.communityId, ctx.user.id)),

  // Les communautés officielles (internationales/régionales/nationales) restent créées par l'administration ; une communauté thématique/professionnelle ne peut être créée que par un responsable actuel (cahier : rôle métier, pas un rôle RBAC).
  create: verifiedProcedure
    .input(z.object({ name: z.string().min(2).max(160), description: z.string().max(2000).optional(), scope: z.enum(["professional", "thematic"]).default("thematic"), unitId: z.number().int().positive().optional(), imageStorageKey: z.string().max(512).optional() }))
    .mutation(async ({ ctx, input }) => {
      try {
        return { communityId: await db.createCommunity(ctx.user.id, input) };
      } catch (error) {
        toTrpcError(error);
      }
    }),

  // Adhésion soumise à validation par un administrateur de la communauté.
  requestToJoin: verifiedProcedure.input(z.object({ communityId: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
    await db.requestToJoinCommunity(ctx.user.id, input.communityId);
    return { success: true } as const;
  }),
  leave: protectedProcedure.input(z.object({ communityId: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
    await db.leaveCommunity(ctx.user.id, input.communityId);
    return { success: true } as const;
  }),
  decideMembership: verifiedProcedure
    .input(z.object({ communityId: z.number().int().positive(), userId: z.number().int().positive(), decision: z.enum(["approved", "rejected"]) }))
    .mutation(async ({ ctx, input }) => {
      try {
        await db.decideCommunityMembership(ctx.user.id, input.communityId, input.userId, input.decision);
        return { success: true } as const;
      } catch (error) {
        toTrpcError(error);
      }
    }),

  // --- Documents (cahier §15) ---
  documents: protectedProcedure.input(z.object({ communityId: z.number().int().positive() })).query(({ input }) => db.listCommunityDocuments(input.communityId)),
  addDocument: verifiedProcedure
    .input(z.object({ communityId: z.number().int().positive(), title: z.string().min(1).max(200), storageKey: z.string().min(1).max(512), mimeType: z.string().max(100).optional() }))
    .mutation(async ({ ctx, input }) => {
      const { communityId, ...rest } = input;
      try {
        return { documentId: await db.addCommunityDocument(ctx.user.id, communityId, rest) };
      } catch (error) {
        toTrpcError(error);
      }
    }),

  // --- Discussion de la communauté (cahier §15) ---
  joinChat: verifiedProcedure.input(z.object({ communityId: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
    try {
      const conversationId = await db.getOrJoinCommunityConversation(ctx.user.id, input.communityId);
      return { conversationId } as const;
    } catch (error) {
      toTrpcError(error);
    }
  }),
});
