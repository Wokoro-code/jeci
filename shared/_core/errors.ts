/**
 * Petits types d'erreurs partagés entre le client et le serveur.
 * Le serveur tRPC renvoie des TRPCError standard (code + message) ; ces types
 * aident le client à discriminer les erreurs métier sans dépendre du serveur.
 */

export type ErrorCode =
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "BAD_REQUEST"
  | "CONFLICT"
  | "INTERNAL_SERVER_ERROR";

export interface AppErrorShape {
  code: ErrorCode;
  message: string;
}

export class AppError extends Error implements AppErrorShape {
  code: ErrorCode;

  constructor(code: ErrorCode, message: string) {
    super(message);
    this.name = "AppError";
    this.code = code;
  }
}

export function isAppErrorShape(value: unknown): value is AppErrorShape {
  return (
    typeof value === "object" &&
    value !== null &&
    "code" in value &&
    "message" in value
  );
}
