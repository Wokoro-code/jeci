import { COOKIE_NAME } from "@shared/const";
import type { Request, Response } from "express";
import * as cookie from "cookie";
import { jwtVerify } from "jose";
import { getUserByOpenId, toPublicUser, type PublicUser } from "../db";
import { ENV } from "./env";

export type TrpcContext = {
  user: PublicUser | null;
  req: Request;
  res: Response;
};

function getSecretKey() {
  return new TextEncoder().encode(ENV.jwtSecret);
}

/** Émet un jeton de session signé pour cet utilisateur (openId). */
export async function createSessionToken(openId: string): Promise<string> {
  const { SignJWT } = await import("jose");
  return new SignJWT({ sub: openId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("365d")
    .sign(getSecretKey());
}

function extractToken(req: Request): string | null {
  const rawCookie = req.headers.cookie;
  if (rawCookie) {
    const parsed = cookie.parse(rawCookie);
    const value = parsed[COOKIE_NAME];
    if (value) return value;
  }

  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.slice("Bearer ".length);
  }

  return null;
}

export async function createContext({
  req,
  res,
}: {
  req: Request;
  res: Response;
}): Promise<TrpcContext> {
  const token = extractToken(req);
  if (!token) {
    return { user: null, req, res };
  }

  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    const openId = typeof payload.sub === "string" ? payload.sub : null;
    if (!openId) return { user: null, req, res };

    const user = await getUserByOpenId(openId);
    return { user: user ? toPublicUser(user) : null, req, res };
  } catch {
    // Jeton invalide ou expiré : traité comme non-authentifié plutôt que
    // de faire échouer la requête.
    return { user: null, req, res };
  }
}
