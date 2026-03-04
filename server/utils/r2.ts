import { randomUUID } from "node:crypto";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

let client: S3Client | null = null;

function getR2Client() {
  if (client) return client;

  const config = useRuntimeConfig();
  const accountId = process.env.NUXT_CF_ACCOUNT_ID || config.cfAccountId;
  const accessKeyId =
    process.env.NUXT_R2_ACCESS_KEY_ID || config.r2AccessKeyId;
  const secretAccessKey =
    process.env.NUXT_R2_SECRET_ACCESS_KEY || config.r2SecretAccessKey;
  const bucketName = process.env.NUXT_R2_BUCKET_NAME || config.r2BucketName;
  const publicUrl = process.env.NUXT_R2_PUBLIC_URL || config.r2PublicUrl;

  if (
    !accountId ||
    !accessKeyId ||
    !secretAccessKey ||
    !bucketName ||
    !publicUrl
  ) {
    throw createError({
      statusCode: 500,
      statusMessage: "Missing Cloudflare R2 configuration",
    });
  }

  client = new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });

  return client;
}

export async function uploadPngToR2(buffer: Buffer) {
  const config = useRuntimeConfig();
  const bucketName = process.env.NUXT_R2_BUCKET_NAME || config.r2BucketName;
  const publicUrl = process.env.NUXT_R2_PUBLIC_URL || config.r2PublicUrl;
  const r2 = getR2Client();

  const key = `orders/${randomUUID()}.png`;

  await r2.send(
    new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: buffer,
      ContentType: "image/png",
      CacheControl: "public, max-age=2592000, immutable",
    }),
  );

  return `${publicUrl.replace(/\/$/, "")}/${key}`;
}
