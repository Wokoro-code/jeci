import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import * as db from "../db";

export const savedRouter = router({
  list: protectedProcedure.query(({ ctx }) => db.listSavedItemsWithContent(ctx.user.id)),
  ids: protectedProcedure.query(({ ctx }) => db.listSavedItemIds(ctx.user.id)),
  toggle: protectedProcedure.input(z.object({ itemType: z.enum(["post", "opportunity", "event", "project"]), itemId: z.number().int().positive() })).mutation(({ ctx, input }) => db.toggleSavedItem(ctx.user.id, input.itemType, input.itemId)),
});
