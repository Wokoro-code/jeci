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

let _s3: S3Client | null = null;

function getS3Client(): S3Client {
  if (!_s3) {
    const endpoint = ENV.s3Endpoint?.replace(/\/+$/, "");

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
    await getS3Client().send(
      new PutObjectCommand({
        Bucket: ENV.s3Bucket!,
        Key: key,
        Body: body,
        ContentType: contentType,
      }),
    );

    const publicBase = ENV.s3PublicBaseUrl?.replace(/\/+$/, "");

    return {
      key,
      url: publicBase
        ? `${publicBase}/${key}`
        : `/uploads/${key}`,
    };
  }

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

