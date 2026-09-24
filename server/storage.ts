// Stockage de fichiers indépendant de toute plateforme externe.
//
// En production, Cloudflare R2 est utilisé via l'API compatible S3.
// En l'absence de configuration S3/R2, les fichiers sont stockés localement.

import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import tls from "node:tls";
import { ENV } from "./_core/env";

const UPLOADS_DIR = path.resolve(process.cwd(), "uploads");

function normalizeKey(relKey: string): string {
  return relKey.replace(/^\/+/, "");
}

function appendHashSuffix(relKey: string): string {
  const hash = randomUUID().replace(/-/g, "").slice(0, 8);
  const lastDot = relKey.lastIndexOf(".");

  if (lastDot === -1) {
    return `${relKey}_${hash}`;
  }

  return `${relKey.slice(0, lastDot)}_${hash}${relKey.slice(lastDot)}`;
}

function isS3Configured(): boolean {
  return Boolean(
    ENV.s3Bucket &&
      ENV.s3AccessKeyId &&
      ENV.s3SecretAccessKey,
  );
}

/**
 * Affiche uniquement des informations non sensibles
 * permettant de diagnostiquer la configuration R2.
 *
 * Aucune clé d'accès ni clé secrète n'est affichée.
 */
function logR2Configuration(): void {
  const endpoint = ENV.s3Endpoint?.replace(/\/+$/, "");

  console.log("[R2 Diagnostic] Configuration:");
  console.log(`  Bucket: ${ENV.s3Bucket ? ENV.s3Bucket : "(absent)"}`);
  console.log(`  Region: ${ENV.s3Region || "(absente)"}`);
  console.log(`  Endpoint: ${endpoint || "(absent)"}`);
  console.log(
    `  Access Key ID: ${ENV.s3AccessKeyId ? "présente" : "ABSENTE"}`,
  );
  console.log(
    `  Secret Access Key: ${ENV.s3SecretAccessKey ? "présente" : "ABSENTE"}`,
  );
  console.log(
    `  Public Base URL: ${
      ENV.s3PublicBaseUrl || "(absente)"
    }`,
  );

  console.log("[R2 Diagnostic] Node/TLS:");
  console.log(`  Node: ${process.version}`);
  console.log(`  OpenSSL: ${process.versions.openssl}`);
  console.log(
    `  TLS minimum Node: ${tls.DEFAULT_MIN_VERSION}`,
  );
  console.log(
    `  TLS maximum Node: ${tls.DEFAULT_MAX_VERSION}`,
  );
}

let _s3: S3Client | null = null;

function getS3Client(): S3Client {
  if (!_s3) {
    const endpoint = ENV.s3Endpoint?.replace(/\/+$/, "");

    logR2Configuration();

    _s3 = new S3Client({
      region: ENV.s3Region || "auto",
      endpoint,

      credentials: {
        accessKeyId: ENV.s3AccessKeyId!,
        secretAccessKey: ENV.s3SecretAccessKey!,
      },
    });
  }

  return _s3;
}

export async function storagePut(
  relKey: string,
  data: Buffer | Uint8Array | string,
  contentType = "application/octet-stream",
): Promise<{ key: string; url: string }> {
  const key = appendHashSuffix(normalizeKey(relKey));

  const body =
    typeof data === "string"
      ? Buffer.from(data)
      : Buffer.from(data);

  if (isS3Configured()) {
    const bucket = ENV.s3Bucket!;
    const endpoint = ENV.s3Endpoint?.replace(/\/+$/, "");

    console.log("[R2 Diagnostic] Début upload:");
    console.log(`  Bucket: ${bucket}`);
    console.log(`  Endpoint: ${endpoint || "(absent)"}`);
    console.log(`  Region: ${ENV.s3Region || "auto"}`);
    console.log(`  Key: ${key}`);
    console.log(`  Content-Type: ${contentType}`);
    console.log(`  Taille: ${body.length} octets`);

    try {
      await getS3Client().send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: key,
          Body: body,
          ContentType: contentType,
        }),
      );

      console.log("[R2 Diagnostic] Upload R2 réussi.");

      const publicBase = ENV.s3PublicBaseUrl?.replace(/\/+$/, "");

      return {
        key,
        url: publicBase
          ? `${publicBase}/${key}`
          : `/uploads/${key}`,
      };
    } catch (error) {
      console.error("[R2 Diagnostic] ÉCHEC upload R2.");

      if (error instanceof Error) {
        console.error(`  Name: ${error.name}`);
        console.error(`  Message: ${error.message}`);

        const awsError = error as Error & {
          code?: string;
          Code?: string;
          $metadata?: {
            httpStatusCode?: number;
            requestId?: string;
            extendedRequestId?: string;
          };
          cause?: unknown;
        };

        if (awsError.code) {
          console.error(`  Code: ${awsError.code}`);
        }

        if (awsError.Code) {
          console.error(`  AWS Code: ${awsError.Code}`);
        }

        if (awsError.$metadata) {
          console.error(
            `  HTTP Status: ${
              awsError.$metadata.httpStatusCode ?? "(absent)"
            }`,
          );

          console.error(
            `  Request ID: ${
              awsError.$metadata.requestId ?? "(absent)"
            }`,
          );

          console.error(
            `  Extended Request ID: ${
              awsError.$metadata.extendedRequestId ?? "(absent)"
            }`,
          );
        }

        if (awsError.cause instanceof Error) {
          console.error(
            `  Cause: ${awsError.cause.name}: ${awsError.cause.message}`,
          );
        }
      } else {
        console.error("  Erreur inconnue:", error);
      }

      throw error;
    }
  }

  console.log(
    "[Storage] R2 non configuré : utilisation du stockage local.",
  );

  const destination = path.join(UPLOADS_DIR, key);

  await mkdir(path.dirname(destination), {
    recursive: true,
  });

  await writeFile(destination, body);

  return {
    key,
    url: `/uploads/${key}`,
  };
}

export async function storageGet(
  relKey: string,
): Promise<{ key: string; url: string }> {
  const key = normalizeKey(relKey);

  if (isS3Configured()) {
    const publicBase = ENV.s3PublicBaseUrl?.replace(/\/+$/, "");

    return {
      key,
      url: publicBase
        ? `${publicBase}/${key}`
        : `/uploads/${key}`,
    };
  }

  return {
    key,
    url: `/uploads/${key}`,
  };
}

export async function storageGetSignedUrl(
  relKey: string,
): Promise<string> {
  const key = normalizeKey(relKey);

  if (isS3Configured()) {
    return getSignedUrl(
      getS3Client(),
      new GetObjectCommand({
        Bucket: ENV.s3Bucket!,
        Key: key,
      }),
      {
        expiresIn: 3600,
      },
    );
  }

  return `/uploads/${key}`;
}