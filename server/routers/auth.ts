import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { COOKIE_NAME } from "@shared/const";
import { createSessionToken } from "../_core/context";
import { getSessionCookieOptions } from "../_core/cookies";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { AuthError, changePassword, loginWithPassword, registerLocalAccount, toPublicUser } from "../db/users";

const passwordSchema = z.string().min(8, "Le mot de passe doit contenir au moins 8 caractères.").max(200);

export const authRouter = router({
  me: publicProcedure.query((opts) => opts.ctx.user),

  /** Inscription (module 3.1 user_accounts) : crée le compte en statut "pending_verification". */
  register: publicProcedure
    .input(z.object({ email: z.string().email(), password: passwordSchema, name: z.string().min(1).max(120) }))
    .mutation(async ({ ctx, input }) => {
      try {
        const user = await registerLocalAccount(input);
        const openId = user.openId;
        const token = await createSessionToken(openId);
        ctx.res.cookie(COOKIE_NAME, token, getSessionCookieOptions(ctx.req));
        return { success: true, user: toPublicUser(user) } as const;
      } catch (error) {
        if (error instanceof AuthError) throw new TRPCError({ code: "BAD_REQUEST", message: error.message });
        throw error;
      }
    }),

  login: publicProcedure
    .input(z.object({ email: z.string().email(), password: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      try {
        const user = await loginWithPassword(input);
        const token = await createSessionToken(user.openId);
        ctx.res.cookie(COOKIE_NAME, token, getSessionCookieOptions(ctx.req));
        return { success: true, user: toPublicUser(user) } as const;
      } catch (error) {
        if (error instanceof AuthError) throw new TRPCError({ code: "UNAUTHORIZED", message: error.message });
        throw error;
      }
    }),

  changePassword: protectedProcedure
    .input(z.object({ currentPassword: z.string().min(1), newPassword: passwordSchema }))
    .mutation(async ({ ctx, input }) => {
      try {
        await changePassword(ctx.user.id, input.currentPassword, input.newPassword);
        return { success: true } as const;
      } catch (error) {
        if (error instanceof AuthError) throw new TRPCError({ code: "BAD_REQUEST", message: error.message });
        throw error;
      }
    }),

  logout: publicProcedure.mutation(({ ctx }) => {
    const cookieOptions = getSessionCookieOptions(ctx.req);
    ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
    return { success: true } as const;
  }),
});
