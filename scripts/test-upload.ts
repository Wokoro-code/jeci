import "dotenv/config";
import express from "express";
import { uploadRouter } from "../server/_core/upload";
import { registerLocalAccount } from "../server/db/users";
import { createSessionToken } from "../server/_core/context";
import { COOKIE_NAME } from "../shared/const";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(`ÉCHEC: ${message}`);
  console.log(`OK: ${message}`);
}

async function main() {
  const app = express();
  app.use(express.json());
  app.use("/api/upload", uploadRouter);
  const server = app.listen(0);
  const port = (server.address() as { port: number }).port;

  const suffix = Date.now();
  const user = await registerLocalAccount({ email: `upload.${suffix}@cspp.test`, password: "motdepasse123", name: "Upload Test" });
  const token = await createSessionToken(user.openId);

  const formData = new FormData();
  formData.append("purpose", "avatar");
  formData.append("file", new Blob([Buffer.from("fake-png-bytes")], { type: "image/png" }), "avatar.png");

  const response = await fetch(`http://localhost:${port}/api/upload`, {
    method: "POST",
    headers: { Cookie: `${COOKIE_NAME}=${token}` },
    body: formData,
  });
  const data = await response.json();
  console.log("Réponse upload:", data);

  assert(response.ok, "la requête d'upload réussit (statut 2xx)");
  assert(typeof data.storageKey === "string" && data.storageKey.startsWith("avatar/"), "storageKey renvoyée avec le bon préfixe");
  assert(data.url === `/uploads/${data.storageKey}`, "url renvoyée cohérente avec la clé");

  // Type de fichier non autorisé pour l'usage "avatar" -> doit être rejeté.
  const badFormData = new FormData();
  badFormData.append("purpose", "avatar");
  badFormData.append("file", new Blob([Buffer.from("%PDF-1.4 fake")], { type: "application/pdf" }), "doc.pdf");
  const badResponse = await fetch(`http://localhost:${port}/api/upload`, {
    method: "POST",
    headers: { Cookie: `${COOKIE_NAME}=${token}` },
    body: badFormData,
  });
  assert(badResponse.status === 400, "un PDF est refusé pour un usage avatar (400)");

  // Sans cookie de session -> doit être rejeté.
  const anonResponse = await fetch(`http://localhost:${port}/api/upload`, { method: "POST", body: formData });
  assert(anonResponse.status === 401, "un upload sans session est refusé (401)");

  server.close();
  console.log("\nTOUS LES TESTS D'UPLOAD SONT PASSÉS ✅");
  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
