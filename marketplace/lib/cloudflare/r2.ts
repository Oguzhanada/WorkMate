/**
 * Cloudflare R2 — S3-compatible object storage client
 *
 * R2 is used for storing user-uploaded files (avatars, provider documents,
 * portfolio images) at lower cost than Supabase Storage for large files.
 *
 * R2 is S3-compatible — we use the AWS SDK v3 with a custom endpoint.
 *
 * Env vars:
 *   CLOUDFLARE_R2_ACCOUNT_ID   — Cloudflare account ID
 *   CLOUDFLARE_R2_ACCESS_KEY   — R2 API token Access Key ID
 *   CLOUDFLARE_R2_SECRET_KEY   — R2 API token Secret Access Key
 *   CLOUDFLARE_R2_BUCKET       — Bucket name (e.g. "workmate-uploads")
 *   CLOUDFLARE_R2_PUBLIC_URL   — Public bucket URL (e.g. https://pub-xxxx.r2.dev or custom domain)
 *
 * Dashboard: dash.cloudflare.com → R2 Object Storage
 *
 * NOTE: Install the required AWS SDK packages:
 *   npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
 */

import { S3Client, DeleteObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

export type R2UploadConfig = {
  /** Key (path) within the bucket, e.g. "avatars/user-123/avatar.webp" */
  key: string;
  /** MIME type of the file being uploaded */
  contentType: string;
  /** Max size in bytes enforced by R2 (via content-length-range condition) */
  maxSizeBytes?: number;
  /** Presigned URL expiry in seconds (default: 300 = 5 min) */
  expiresInSeconds?: number;
};

function getR2Client(): S3Client {
  const accountId = process.env.CLOUDFLARE_R2_ACCOUNT_ID;
  const accessKey = process.env.CLOUDFLARE_R2_ACCESS_KEY;
  const secretKey = process.env.CLOUDFLARE_R2_SECRET_KEY;

  if (!accountId || !accessKey || !secretKey) {
    throw new Error(
      'R2 is not configured. Set CLOUDFLARE_R2_ACCOUNT_ID, CLOUDFLARE_R2_ACCESS_KEY, and CLOUDFLARE_R2_SECRET_KEY.'
    );
  }

  return new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: accessKey,
      secretAccessKey: secretKey,
    },
  });
}

/**
 * Generate a presigned PUT URL for direct browser→R2 uploads.
 * The client uploads directly to R2 — the file never passes through the Next.js server.
 *
 * @returns { uploadUrl, publicUrl } — uploadUrl is used for the PUT request,
 *          publicUrl is the final URL to store in the database.
 */
export async function createR2PresignedUpload(config: R2UploadConfig): Promise<{
  uploadUrl: string;
  publicUrl: string;
}> {
  const bucket = process.env.CLOUDFLARE_R2_BUCKET;
  const publicBase = process.env.CLOUDFLARE_R2_PUBLIC_URL;

  if (!bucket) throw new Error('CLOUDFLARE_R2_BUCKET is not set.');
  if (!publicBase) throw new Error('CLOUDFLARE_R2_PUBLIC_URL is not set.');

  const client = getR2Client();
  const { key, contentType, expiresInSeconds = 300 } = config;

  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    ContentType: contentType,
  });

  const uploadUrl = await getSignedUrl(client, command, { expiresIn: expiresInSeconds });
  const publicUrl = `${publicBase.replace(/\/$/, '')}/${key}`;

  return { uploadUrl, publicUrl };
}

/**
 * Delete an object from R2.
 */
export async function deleteR2Object(key: string): Promise<void> {
  const bucket = process.env.CLOUDFLARE_R2_BUCKET;
  if (!bucket) throw new Error('CLOUDFLARE_R2_BUCKET is not set.');

  const client = getR2Client();
  await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
}

/**
 * Returns true if R2 is configured (all required env vars are set).
 */
export function isR2Configured(): boolean {
  return Boolean(
    process.env.CLOUDFLARE_R2_ACCOUNT_ID &&
      process.env.CLOUDFLARE_R2_ACCESS_KEY &&
      process.env.CLOUDFLARE_R2_SECRET_KEY &&
      process.env.CLOUDFLARE_R2_BUCKET &&
      process.env.CLOUDFLARE_R2_PUBLIC_URL
  );
}
