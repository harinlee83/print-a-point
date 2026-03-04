import { uploadPngToR2 } from "~~/server/utils/r2";

export default defineEventHandler(async (event) => {
  const formData = await readMultipartFormData(event);
  const file = formData?.find((entry) => entry.name === "file");

  if (!file || !file.data || file.data.length === 0) {
    throw createError({
      statusCode: 400,
      statusMessage: "PNG file is required",
    });
  }

  const contentType = String(file.type ?? "").toLowerCase();
  if (contentType && contentType !== "image/png") {
    throw createError({
      statusCode: 400,
      statusMessage: "Only PNG uploads are supported",
    });
  }

  const url = await uploadPngToR2(Buffer.from(file.data));

  return { url };
});
