export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

/**
 * Redirige vers la page de connexion locale (voir client/src/pages/Login.tsx).
 * Remplace l'ancien flux OAuth Manus, qui n'existe pas en dehors de leur
 * plateforme.
 */
export const startLogin = () => {
  window.location.href = "/login";
};
