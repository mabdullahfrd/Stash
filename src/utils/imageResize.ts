/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

const ALLOWED_INPUT_MIME = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
]);

const MAX_RAW_FILE_BYTES = 20 * 1024 * 1024; // 20 MB before client downscaling
const MAX_DIMENSION_PX = 1600;
const JPEG_QUALITY = 0.8;

export function validateImageFile(file: File): string | null {
  const mime = (file.type || '').toLowerCase();
  if (mime && !ALLOWED_INPUT_MIME.has(mime) && !mime.startsWith('image/')) {
    return 'Please select a JPEG, PNG, or WebP image file.';
  }
  if (file.size <= 0) {
    return 'The selected image file appears to be empty.';
  }
  if (file.size > MAX_RAW_FILE_BYTES) {
    return 'Image file is larger than 20 MB. Please choose a smaller photo.';
  }
  return null;
}

export async function resizeImageFileToDataUrl(file: File): Promise<string> {
  const validationError = validateImageFile(file);
  if (validationError) {
    throw new Error(validationError);
  }

  const rawDataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Failed to read the selected image file.'));
    reader.readAsDataURL(file);
  });

  if (typeof document === 'undefined' || typeof Image === 'undefined') {
    return rawDataUrl;
  }

  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const element = new Image();
      element.onload = () => resolve(element);
      element.onerror = () => reject(new Error('Could not decode this image file.'));
      element.src = rawDataUrl;
    });

    const longestSide = Math.max(img.naturalWidth || img.width, img.naturalHeight || img.height);
    const scale = longestSide > MAX_DIMENSION_PX ? MAX_DIMENSION_PX / longestSide : 1;
    const width = Math.max(1, Math.round((img.naturalWidth || img.width) * scale));
    const height = Math.max(1, Math.round((img.naturalHeight || img.height) * scale));

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return rawDataUrl;

    ctx.drawImage(img, 0, 0, width, height);
    return canvas.toDataURL('image/jpeg', JPEG_QUALITY);
  } catch {
    return rawDataUrl;
  }
}
