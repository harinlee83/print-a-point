import { createPresignedUploadUrl } from "~~/server/utils/r2";

export default defineEventHandler(async () => {
  const { uploadUrl, publicFileUrl } = await createPresignedUploadUrl();
  return { uploadUrl, publicFileUrl };
});
