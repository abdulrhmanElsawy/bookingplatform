import { v2 as cloudinary } from 'cloudinary';

import { getEnv } from '../../config/env.js';

let configured = false;

function ensureConfigured(): void {
  const env = getEnv();
  if (!env.CLOUDINARY_CLOUD_NAME || !env.CLOUDINARY_API_KEY || !env.CLOUDINARY_API_SECRET) {
    throw new Error('CLOUDINARY_NOT_CONFIGURED');
  }
  if (!configured) {
    cloudinary.config({
      cloud_name: env.CLOUDINARY_CLOUD_NAME,
      api_key: env.CLOUDINARY_API_KEY,
      api_secret: env.CLOUDINARY_API_SECRET,
    });
    configured = true;
  }
}

export function isCloudinaryConfigured(): boolean {
  const e = getEnv();
  return Boolean(e.CLOUDINARY_CLOUD_NAME && e.CLOUDINARY_API_KEY && e.CLOUDINARY_API_SECRET);
}

export function resetCloudinaryConfig(): void {
  configured = false;
}

/** Upload a WebP buffer; returns HTTPS URL and Cloudinary public_id. */
export async function uploadWebpImage(
  buffer: Buffer,
): Promise<{ url: string; publicId: string }> {
  ensureConfigured();
  const folder = getEnv().CLOUDINARY_UPLOAD_FOLDER ?? 'growth-world';

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'image',
        format: 'webp',
      },
      (err, result) => {
        if (err) {
          reject(err);
          return;
        }
        if (!result?.secure_url || !result.public_id) {
          reject(new Error('Cloudinary returned empty result'));
          return;
        }
        resolve({ url: result.secure_url, publicId: result.public_id });
      },
    );
    stream.end(buffer);
  });
}
