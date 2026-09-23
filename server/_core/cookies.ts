import { ONE_YEAR_MS } from "@shared/const";

type CookieAwareRequest = { protocol: string };

/**
 * Options du cookie de session, dérivées du protocole de la requête :
 * - en HTTPS (production, tunnels de prévisualisation) : `Secure` + `SameSite=None`,
 *   nécessaire si le front et l'API ne partagent pas exactement la même origine.
 * - en HTTP (développement local sur localhost) : pas de `Secure` et
 *   `SameSite=Lax`, comportement standard et suffisant en local.
 */
export function getSessionCookieOptions(req: CookieAwareRequest) {
  const isHttps = req.protocol === "https";

  return {
    httpOnly: true,
    secure: isHttps,
    sameSite: (isHttps ? "none" : "lax") as "none" | "lax",
    path: "/",
    maxAge: ONE_YEAR_MS,
  };
}
