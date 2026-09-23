import path from "node:path";
import express from "express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { uploadRouter } from "./upload";
import { ENV } from "./env";

// On calcule la racine du projet à partir du répertoire de travail (celui
// depuis lequel `npm run dev` / `npm start` sont lancés), plutôt que depuis
// le chemin du fichier courant : après le bundling esbuild pour la
// production, ce fichier est déplacé dans dist/, ce qui casserait un calcul
// relatif à import.meta.url.
const PROJECT_ROOT = process.cwd();

async function startServer() {
  const app = express();
  app.use(express.json());

  // Fichiers uploadés en local (voir server/storage.ts). Sans effet si le
  // dossier n'existe pas encore.
  app.use("/uploads", express.static(path.join(PROJECT_ROOT, "uploads")));

  // Upload de fichiers (avatars, justificatifs de vérification, pièces
  // jointes de messagerie). Route Express classique (pas tRPC) car les
  // fichiers multipart s'y prêtent mieux ; protégée par la même session.
  app.use("/api/upload", uploadRouter);

  // API tRPC — toutes les routes commencent par /api/ pour rester cohérent
  // avec le reste du code (voir server/routers.ts).
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    }),
  );

  if (ENV.isProduction) {
    // Production : sert les fichiers statiques buildés par `vite build`.
    const staticPath = path.join(PROJECT_ROOT, "dist", "public");
    app.use(express.static(staticPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(staticPath, "index.html"));
    });
  } else {
    // Développement : Vite tourne en mode middleware à l'intérieur de ce
    // même process Express. Front (avec HMR) et API partagent ainsi la même
    // origine, sans configuration de proxy à gérer.
    const { createServer: createViteServer } = await import("vite");
    const { readFile } = await import("node:fs/promises");

    const vite = await createViteServer({
      root: path.join(PROJECT_ROOT, "client"),
      configFile: path.join(PROJECT_ROOT, "vite.config.ts"),
      server: { middlewareMode: true },
      appType: "custom",
    });

    app.use(vite.middlewares);

    app.use("*", async (req, res, next) => {
      try {
        const url = req.originalUrl;
        const indexPath = path.join(PROJECT_ROOT, "client", "index.html");
        let template = await readFile(indexPath, "utf-8");
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ "Content-Type": "text/html" }).end(template);
      } catch (error) {
        vite.ssrFixStacktrace(error as Error);
        next(error);
      }
    });
  }

  app.listen(ENV.port, () => {
    console.log(`Server running on http://localhost:${ENV.port}/`);
  });
}

startServer().catch(console.error);
