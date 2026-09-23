import { and, eq, isNull } from "drizzle-orm";
import { roles, userRoles, users } from "../../drizzle/schema";
import { getDb } from "./client";
import { logAction } from "./audit";

/**
 * Rôles RBAC de l'application (cahier §28). "member" n'est jamais géré ici :
 * il est attribué automatiquement à la création du compte, sans périmètre.
 * "super_admin" reste le seul rôle qui synchronise aussi `users.role`
 * (compatibilité avec l'ancien flag admin/user et les procédures tRPC
 * héritées qui le lisent directement).
 */
export type AssignableRoleCode = "mentor" | "moderator" | "verification_officer" | "community_admin" | "local_admin" | "national_admin" | "regional_admin" | "international_admin" | "super_admin";
export type RoleScope = { scopeType: "global" | "unit" | "community"; scopeId?: number };

/**
 * Attribution ou retrait d'un rôle, avec un périmètre d'exercice optionnel
 * (une structure organisationnelle ou une communauté). Un administrateur
 * national du Togo n'obtient ainsi de droits que sur le périmètre "unit"
 * correspondant à JEC Togo, jamais sur un autre mouvement (cahier §28).
 * Autorisation minimale : administrateur habilité sur le périmètre
 * concerné ; toute attribution est journalisée.
 */
export async function assignRole(actorId: number, targetUserId: number, roleCode: AssignableRoleCode, reason: string, scope: RoleScope = { scopeType: "global" }) {
  const db = await getDb();
  if (!db) throw new Error("Base de données indisponible");
  const [role] = await db.select().from(roles).where(eq(roles.code, roleCode)).limit(1);
  if (!role) throw new Error("Rôle inconnu.");

  await db
    .insert(userRoles)
    .values({ userId: targetUserId, roleId: role.id, scopeType: scope.scopeType, scopeId: scope.scopeId ?? null, assignedBy: actorId, reason })
    .onDuplicateKeyUpdate({ set: { revokedAt: null, assignedBy: actorId, reason } });

  if (roleCode === "super_admin") {
    await db.update(users).set({ role: "admin" }).where(eq(users.id, targetUserId));
  }

  await logAction({ actorId, action: "role.assign", entityType: "user", entityId: targetUserId, reason, after: { roleCode, scope } });
}

export async function revokeRole(actorId: number, targetUserId: number, roleCode: AssignableRoleCode, reason: string, scope: RoleScope = { scopeType: "global" }) {
  const db = await getDb();
  if (!db) throw new Error("Base de données indisponible");
  const [role] = await db.select().from(roles).where(eq(roles.code, roleCode)).limit(1);
  if (!role) throw new Error("Rôle inconnu.");

  await db.update(userRoles).set({ revokedAt: new Date(), reason }).where(and(eq(userRoles.userId, targetUserId), eq(userRoles.roleId, role.id), eq(userRoles.scopeType, scope.scopeType), scope.scopeId ? eq(userRoles.scopeId, scope.scopeId) : isNull(userRoles.scopeId)));

  if (roleCode === "super_admin") {
    await db.update(users).set({ role: "user" }).where(eq(users.id, targetUserId));
  }

  await logAction({ actorId, action: "role.revoke", entityType: "user", entityId: targetUserId, reason, before: { roleCode, scope } });
}

export async function listRoleAssignments() {  const db = await getDb();
  if (!db) return [];
  return db
    .select({
      userId: users.id,
      name: users.name,
      email: users.email,
      accountStatus: users.accountStatus,
      roleCode: roles.code,
      roleLabel: roles.label,
      scopeType: userRoles.scopeType,
      scopeId: userRoles.scopeId,
      assignedAt: userRoles.assignedAt,
    })
    .from(userRoles)
    .innerJoin(users, eq(userRoles.userId, users.id))
    .innerJoin(roles, eq(userRoles.roleId, roles.id))
    .where(isNull(userRoles.revokedAt));
}

/**
 * Rôles actifs d'un utilisateur avec leur périmètre — utilisé par les
 * procédures tRPC scopées (ex : un national_admin ne peut agir que sur son
 * unitId, cahier §28).
 */
export async function getActiveRoleAssignments(userId: number) {
  const db = await getDb();
  if (!db) return [] as { code: string; scopeType: "global" | "unit" | "community"; scopeId: number | null }[];
  const rows = await db
    .select({ code: roles.code, scopeType: userRoles.scopeType, scopeId: userRoles.scopeId })
    .from(userRoles)
    .innerJoin(roles, eq(userRoles.roleId, roles.id))
    .where(and(eq(userRoles.userId, userId), isNull(userRoles.revokedAt)));
  return rows;
}
