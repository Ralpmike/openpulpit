/**
 * Shrinks a photo in the browser before upload (a 4 MB phone photo becomes
 * ~40 KB), so preachers on mobile data upload fast and listeners download little.
 */
export async function resizeImage(file: File, { size = 512, quality = 0.82 } = {}): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, size / Math.max(bitmap.width, bitmap.height));
  const side = { width: Math.round(bitmap.width * scale), height: Math.round(bitmap.height * scale) };
  const canvas = document.createElement("canvas");
  canvas.width = side.width;
  canvas.height = side.height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas is not available");
  context.drawImage(bitmap, 0, 0, side.width, side.height);
  bitmap.close();
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", quality));
  if (!blob) throw new Error("Could not encode the image");
  return blob;
}
