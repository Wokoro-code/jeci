import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import * as db from "../db";

export const notificationsRouter = router({
  list: protectedProcedure.input(z.object({ onlyUnread: z.boolean().optional() })).query(({ ctx, input }) => db.listNotifications(ctx.user.id, input.onlyUnread)),
  unreadCount: protectedProcedure.query(({ ctx }) => db.countUnread(ctx.user.id)),
  markRead: protectedProcedure.input(z.object({ notificationId: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
    await db.markNotificationRead(ctx.user.id, input.notificationId);
    return { success: true } as const;
  }),
  markAllRead: protectedProcedure.mutation(async ({ ctx }) => {
    await db.markAllRead(ctx.user.id);
    return { success: true } as const;
  }),
  markByType: protectedProcedure.input(z.object({ types: z.array(z.string()).min(1) })).mutation(async ({ ctx, input }) => {
    await db.markNotificationsByTypeRead(ctx.user.id, input.types);
    return { success: true } as const;
  }),
});
