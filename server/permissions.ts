import { TRPCError } from "@trpc/server";

export type AccountStatus = "pending_verification" | "verified" | "rejected" | "suspended" | "deactivated";

export function requireVerifiedAccount(status: AccountStatus) {
  if (status !== "verified") throw new TRPCError({ code: "FORBIDDEN", message: "Votre compte doit être vérifié pour effectuer cette action." });
}

export function requireActiveAccount(status: AccountStatus) {
  if (status === "suspended" || status === "deactivated") throw new TRPCError({ code: "FORBIDDEN", message: "Ce compte n’est pas autorisé à accéder à cette ressource." });
}
