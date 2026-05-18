export const MAX_RAW_IMAGE_BYTES = 15 * 1024 * 1024;
export const MAX_OUTPUT_BYTES = 1_000_000;
export const MAX_EDGE_PX = 1200;

const ALLOWED_EXTENSIONS = new Set(['jpg', 'jpeg', 'png', 'webp']);
const ALLOWED_MIMES = new Set(['image/jpeg', 'image/png', 'image/webp']);

export type ListingImageValidationCode =
  | 'INVALID_EXTENSION'
  | 'INVALID_MIME'
  | 'FILE_TOO_LARGE'
  | 'INVALID_IMAGE'
  | 'PROCESS_FAILED';

export class ListingImageValidationError extends Error {
  constructor(readonly code: ListingImageValidationCode) {
    super(code);
    this.name = 'ListingImageValidationError';
  }
}

function extensionFromName(name: string): string | null {
  const base = name.trim().split(/[/\\]/).pop() ?? '';
  const match = base.match(/^[^./\\]+\.(jpe?g|png|webp)$/i);
  if (!match) return null;
  return match[1]!.toLowerCase().replace('jpeg', 'jpg');
}

export function sniffImageMime(buffer: ArrayBuffer): 'image/jpeg' | 'image/png' | 'image/webp' | null {
  const bytes = new Uint8Array(buffer.slice(0, 16));
  if (bytes.length < 3) return null;

  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return 'image/jpeg';
  }

  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  ) {
    return 'image/png';
  }

  if (
    bytes.length >= 12 &&
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    return 'image/webp';
  }

  return null;
}

async function readBlobBytes(blob: Blob): Promise<ArrayBuffer> {
  if (typeof blob.arrayBuffer === 'function') {
    return blob.arrayBuffer();
  }
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = () => reject(reader.error ?? new Error('READ_FAILED'));
    reader.readAsArrayBuffer(blob);
  });
}

export async function validateListingImageFile(file: File): Promise<void> {
  const ext = extensionFromName(file.name);
  const normalizedExt = ext === 'jpeg' ? 'jpg' : ext;
  if (!normalizedExt || !ALLOWED_EXTENSIONS.has(normalizedExt)) {
    throw new ListingImageValidationError('INVALID_EXTENSION');
  }

  if (!file.type || !ALLOWED_MIMES.has(file.type)) {
    throw new ListingImageValidationError('INVALID_MIME');
  }

  if (file.size > MAX_RAW_IMAGE_BYTES) {
    throw new ListingImageValidationError('FILE_TOO_LARGE');
  }

  const fileBuffer = await readBlobBytes(file);
  const sniffed = sniffImageMime(fileBuffer.slice(0, 16));
  if (!sniffed || sniffed !== file.type) {
    throw new ListingImageValidationError('INVALID_IMAGE');
  }
}

function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new ListingImageValidationError('INVALID_IMAGE'));
    };
    img.src = url;
  });
}

function scaleDimensions(
  width: number,
  height: number,
  maxEdge: number,
): { width: number; height: number } {
  const longest = Math.max(width, height);
  if (longest <= maxEdge) return { width, height };
  const ratio = maxEdge / longest;
  return {
    width: Math.max(1, Math.round(width * ratio)),
    height: Math.max(1, Math.round(height * ratio)),
  };
}

export type CanvasToBlobFn = (
  canvas: HTMLCanvasElement,
  type: string,
  quality?: number,
) => Promise<Blob | null>;

let canvasToBlobImpl: CanvasToBlobFn | null = null;

export function setCanvasToBlobForTests(fn: CanvasToBlobFn | null): void {
  canvasToBlobImpl = fn;
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality?: number,
): Promise<Blob | null> {
  if (canvasToBlobImpl) {
    return canvasToBlobImpl(canvas, type, quality);
  }
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), type, quality);
  });
}

async function encodeWebpUnderLimit(
  canvas: HTMLCanvasElement,
  maxBytes: number,
): Promise<Blob> {
  const qualities = [0.85, 0.75, 0.65, 0.55, 0.45, 0.35];
  for (const quality of qualities) {
    const blob = await canvasToBlob(canvas, 'image/webp', quality);
    if (blob && blob.size <= maxBytes) return blob;
  }

  let edge = Math.min(canvas.width, canvas.height);
  while (edge > 320) {
    edge = Math.round(edge * 0.85);
    const scaled = scaleDimensions(canvas.width, canvas.height, edge);
    const tmp = document.createElement('canvas');
    tmp.width = scaled.width;
    tmp.height = scaled.height;
    const ctx = tmp.getContext('2d');
    if (!ctx) break;
    ctx.drawImage(canvas, 0, 0, scaled.width, scaled.height);

    for (const quality of qualities) {
      const blob = await canvasToBlob(tmp, 'image/webp', quality);
      if (blob && blob.size <= maxBytes) return blob;
    }
  }

  const last = await canvasToBlob(canvas, 'image/webp', 0.35);
  if (!last) {
    throw new ListingImageValidationError('PROCESS_FAILED');
  }
  return last;
}

export type PreparedListingImage = {
  file: File;
  originalBytes: number;
  compressedBytes: number;
};

export async function prepareListingImage(file: File): Promise<PreparedListingImage> {
  await validateListingImageFile(file);
  const originalBytes = file.size;

  let img: HTMLImageElement;
  try {
    img = await loadImageFromFile(file);
  } catch (err) {
    if (err instanceof ListingImageValidationError) throw err;
    throw new ListingImageValidationError('INVALID_IMAGE');
  }

  const scaled = scaleDimensions(img.naturalWidth, img.naturalHeight, MAX_EDGE_PX);
  const canvas = document.createElement('canvas');
  canvas.width = scaled.width;
  canvas.height = scaled.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new ListingImageValidationError('PROCESS_FAILED');
  }
  ctx.drawImage(img, 0, 0, scaled.width, scaled.height);

  const blob = await encodeWebpUnderLimit(canvas, MAX_OUTPUT_BYTES);
  const id =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `img-${Date.now()}`;
  const outFile = new File([blob], `venue-${id}.webp`, { type: 'image/webp' });

  return {
    file: outFile,
    originalBytes,
    compressedBytes: outFile.size,
  };
}
