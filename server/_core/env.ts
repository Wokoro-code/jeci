import "dotenv/config";

/**
 * Point d'accès unique aux variables d'environnement du serveur.
 * Toutes les valeurs sont optionnelles : l'application doit pouvoir démarrer
 * sans base de données ni stockage S3 configurés (mode démo / UI seule).
 */
export const ENV = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  isProduction: process.env.NODE_ENV === "production",
  port: Number(process.env.PORT) || 3000,

  // Base de données (MySQL via Drizzle). Optionnelle : voir server/db.ts.
  databaseUrl: process.env.DATABASE_URL,

  // Secret de signature des sessions (JWT). À définir en production.
  jwtSecret: process.env.JWT_SECRET || "dev-insecure-secret-change-me",

  // openId de l'utilisateur qui doit automatiquement recevoir le rôle admin
  // lors de sa première connexion locale (ex: "local:admin@example.com").
  ownerOpenId: process.env.OWNER_OPEN_ID,

  // Stockage de fichiers optionnel sur S3 (ou compatible S3). Si absent,
  // server/storage.ts bascule automatiquement sur le disque local.
  s3Bucket: process.env.S3_BUCKET,
  s3Region: process.env.S3_REGION || "eu-west-3",
  s3Endpoint: process.env.S3_ENDPOINT,
  s3AccessKeyId: process.env.AWS_ACCESS_KEY_ID,
  s3SecretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  s3PublicBaseUrl: process.env.S3_PUBLIC_BASE_URL,

  // E-mails transactionnels optionnels via SMTP (voir server/email.ts). Si
  // absent, les e-mails sont simplement journalisés dans la console — utile
  // pour développer sans service d'envoi configuré.
  smtpHost: process.env.SMTP_HOST,
  smtpPort: Number(process.env.SMTP_PORT) || 587,
  smtpUser: process.env.SMTP_USER,
  smtpPassword: process.env.SMTP_PASSWORD,
  smtpFrom: process.env.SMTP_FROM || "JECI <no-reply@jec-network.local>",
  appBaseUrl: process.env.APP_BASE_URL || "http://localhost:3000",
};
