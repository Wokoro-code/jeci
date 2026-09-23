import { NOT_ADMIN_ERR_MSG, UNAUTHED_ERR_MSG } from '@shared/const';
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import type { TrpcContext } from "./context";
import { requireActiveAccount, requireVerifiedAccount } from "../permissions";
import { getActiveRoleAssignments } from "../db";

const t = initTRPC.context<TrpcContext>().create({
  transformer: superjson,
});

export const router = t.router;
export const publicProcedure = t.procedure;

const requireUser = t.middleware(async opts => {
  const { ctx, next } = opts;

  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }

  // Un compte suspendu ou désactivé ne doit plus pouvoir agir, même les
  // actions normalement ouvertes en lecture (référentiel section 6).
  requireActiveAccount(ctx.user.accountStatus);

  touchPresence(ctx.user.id);

  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  });
});

// Présence approximative pour les accusés "connecté" façon WhatsApp : on ne réécrit
// lastActiveAt qu'une fois toutes les 30s par utilisateur pour ne pas alourdir chaque requête.
const lastTouchByUser = new Map<number, number>();
function touchPresence(userId: number) {
  const now = Date.now();
  const last = lastTouchByUser.get(userId) ?? 0;
  if (now - last < 30_000) return;
  lastTouchByUser.set(userId, now);
  import("../db/users").then(({ touchLastActive }) => touchLastActive(userId)).catch(() => {});
}

export const protectedProcedure = t.procedure.use(requireUser);

export const verifiedProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  requireVerifiedAccount(ctx.user.accountStatus);
  return next({ ctx });
});

/**
 * Procédure à rôle global : n'accorde l'accès que si l'un des rôles listés
 * est détenu avec une portée globale (scopeType "global"), ou si le compte
 * porte déjà le flag admin hérité. Les rôles à périmètre organisationnel
 * (national_admin, local_admin, etc.) passent par `scopedAdminProcedure`
 * ci-dessous, qui vérifie en plus l'unité concernée (cahier §28 : "un
 * administrateur national du Togo ne doit pas pouvoir modifier les membres
 * du Nigeria").
 */
const roleProcedure = (allowed: string[]) => protectedProcedure.use(async ({ ctx, next }) => {
  const assignments = await getActiveRoleAssignments(ctx.user.id);
  const hasGlobalRole = assignments.some((assignment) => allowed.includes(assignment.code) && assignment.scopeType === "global");
  if (!hasGlobalRole && !(allowed.includes("super_admin") && ctx.user.role === "admin")) throw new TRPCError({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
  return next({ ctx });
});

export const moderatorProcedure = roleProcedure(["moderator", "super_admin"]);
export const mentorProcedure = roleProcedure(["mentor", "super_admin"]);

/** Réservé au super administrateur (portée globale, cahier §27 "Administrateur international" / §28 SUPER_ADMIN). */
export const adminProcedure = roleProcedure(["super_admin"]);

/**
 * Autorise un rôle scopé (national_admin, regional_admin, local_admin,
 * community_admin) sur une unité/communauté précise, en plus du
 * super_admin global. `resolveScopeId` extrait l'identifiant de périmètre
 * depuis l'input de la requête — à utiliser pour les mutations qui portent
 * sur une structure ou une communauté particulière.
 */
export function scopedProcedure(allowedCodes: string[], resolveScopeId: (input: unknown) => number | undefined) {
  return protectedProcedure.use(async ({ ctx, next, getRawInput }) => {
    if (ctx.user.role === "admin") return next({ ctx });
    const assignments = await getActiveRoleAssignments(ctx.user.id);
    if (assignments.some((assignment) => assignment.code === "super_admin" && assignment.scopeType === "global")) return next({ ctx });
    const rawInput = await getRawInput();
    const scopeId = resolveScopeId(rawInput);
    const authorized = assignments.some((assignment) => allowedCodes.includes(assignment.code) && assignment.scopeType !== "global" && (scopeId === undefined || assignment.scopeId === scopeId));
    if (!authorized) throw new TRPCError({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
    return next({ ctx });
  });
}
