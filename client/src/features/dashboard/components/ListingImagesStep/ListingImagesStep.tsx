import { useCallback, useEffect, useId, useRef, type Dispatch, type SetStateAction } from 'react';
import { useTranslation } from 'react-i18next';

import {
  ListingImageUploadError,
  uploadListingImage,
} from '../../../listings/api/listingImageUploadApi';
import {
  ListingImageValidationError,
  prepareListingImage,
} from '../../../../utils/prepareListingImage';
import { resolveUploadUrl } from '../../../../utils/resolveUploadUrl';
import styles from './ListingImagesStep.module.css';

export const MAX_LISTING_PHOTOS = 12;

export type ListingImageDraftStatus =
  | 'processing'
  | 'uploading'
  | 'ready'
  | 'error';

export type ListingImageDraft = {
  id: string;
  url?: string;
  publicId?: string;
  altAr: string;
  altEn: string;
  isMain: boolean;
  order: number;
  status: ListingImageDraftStatus;
  previewUrl?: string;
  originalBytes?: number;
  compressedBytes?: number;
  errorMessage?: string;
};

export type ListingImagesStepProps = {
  images: ListingImageDraft[];
  onChange: Dispatch<SetStateAction<ListingImageDraft[]>>;
  nameAr: string;
  nameEn: string;
  disabled?: boolean;
};

function commitImages(
  onChange: Dispatch<SetStateAction<ListingImageDraft[]>>,
  updater: (prev: ListingImageDraft[]) => ListingImageDraft[],
): void {
  onChange((prev) => ensureSingleMain(normalizeOrders(updater(prev))));
}

function newId(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `img-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function normalizeOrders(items: ListingImageDraft[]): ListingImageDraft[] {
  return items
    .slice()
    .sort((a, b) => a.order - b.order)
    .map((item, index) => ({ ...item, order: index }));
}

function ensureSingleMain(items: ListingImageDraft[]): ListingImageDraft[] {
  if (items.length === 0) return items;
  const mainIndex = items.findIndex((i) => i.isMain);
  const idx = mainIndex >= 0 ? mainIndex : 0;
  return items.map((item, i) => ({ ...item, isMain: i === idx }));
}

export function listingImagesFromDto(
  rows: {
    url: string;
    publicId?: string;
    isMain?: boolean;
    order?: number;
    alt: { ar: string; en: string };
  }[],
): ListingImageDraft[] {
  const sorted = rows.slice().sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  return ensureSingleMain(
    sorted.map((row, index) => ({
      id: newId(),
      url: row.url,
      publicId: row.publicId,
      altAr: row.alt.ar,
      altEn: row.alt.en,
      isMain: Boolean(row.isMain),
      order: row.order ?? index,
      status: 'ready' as const,
      previewUrl: row.url,
    })),
  );
}

export function listingImagesToPayload(
  images: ListingImageDraft[],
): {
  url: string;
  publicId?: string;
  isMain?: boolean;
  order?: number;
  alt: { ar: string; en: string };
}[] {
  const ready = normalizeOrders(images.filter((i) => i.status === 'ready' && i.url));
  const withMain = ensureSingleMain(ready);
  return withMain.map((item, index) => ({
    url: item.url!,
    ...(item.publicId ? { publicId: item.publicId } : {}),
    isMain: item.isMain,
    order: index,
    alt: { ar: item.altAr.trim(), en: item.altEn.trim() },
  }));
}

export function hasPendingImageUploads(images: ListingImageDraft[]): boolean {
  return images.some((i) => i.status === 'processing' || i.status === 'uploading');
}

export function hasImageUploadErrors(images: ListingImageDraft[]): boolean {
  return images.some((i) => i.status === 'error');
}

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(2)} MB`;
}

export function ListingImagesStep({
  images,
  onChange,
  nameAr,
  nameEn,
  disabled = false,
}: ListingImagesStepProps) {
  const { t } = useTranslation('dashboard');
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const imagesRef = useRef(images);
  imagesRef.current = images;

  useEffect(() => {
    return () => {
      for (const img of imagesRef.current) {
        if (img.previewUrl?.startsWith('blob:')) {
          URL.revokeObjectURL(img.previewUrl);
        }
      }
    };
  }, []);

  const validationMessage = useCallback(
    (code: string): string => {
      switch (code) {
        case 'INVALID_EXTENSION':
        case 'INVALID_MIME':
        case 'INVALID_IMAGE':
          return t('invalidImageFile');
        case 'FILE_TOO_LARGE':
          return t('imageTooLarge');
        default:
          return t('photoUploadError');
      }
    },
    [t],
  );

  const processAndUpload = useCallback(
    async (file: File, draftId: string) => {
      const defaultAltAr = nameAr.trim() || t('listingEditorTitle');
      const defaultAltEn = nameEn.trim() || t('listingEditorTitle');

      const patch = (id: string, partial: Partial<ListingImageDraft>) => {
        commitImages(onChange, (prev) =>
          prev.map((item) => (item.id === id ? { ...item, ...partial } : item)),
        );
      };

      try {
        const prepared = await prepareListingImage(file);
        const previewUrl = URL.createObjectURL(prepared.file);
        patch(draftId, {
          status: 'uploading',
          previewUrl,
          originalBytes: prepared.originalBytes,
          compressedBytes: prepared.compressedBytes,
          errorMessage: undefined,
        });

        const uploaded = await uploadListingImage(prepared.file, {
          ar: defaultAltAr,
          en: defaultAltEn,
        });

        if (previewUrl.startsWith('blob:')) {
          URL.revokeObjectURL(previewUrl);
        }

        patch(draftId, {
          status: 'ready',
          url: uploaded.url,
          publicId: uploaded.publicId,
          altAr: uploaded.alt.ar,
          altEn: uploaded.alt.en,
          previewUrl: uploaded.url,
          errorMessage: undefined,
        });
      } catch (err) {
        const message =
          err instanceof ListingImageValidationError
            ? validationMessage(err.code)
            : err instanceof ListingImageUploadError && err.status === 503
              ? t('uploadsNotConfigured')
              : err instanceof Error
                ? err.message
                : t('photoUploadError');
        patch(draftId, { status: 'error', errorMessage: message });
      }
    },
    [nameAr, nameEn, onChange, t, validationMessage],
  );

  const handleFiles = useCallback(
    (fileList: FileList | null) => {
      if (!fileList?.length || disabled) return;

      const current = imagesRef.current;
      const slots = MAX_LISTING_PHOTOS - current.length;
      if (slots <= 0) return;

      const files = Array.from(fileList).slice(0, slots);
      const newDrafts: ListingImageDraft[] = files.map((_file, i) => ({
        id: newId(),
        altAr: nameAr.trim(),
        altEn: nameEn.trim(),
        isMain: current.length === 0 && i === 0,
        order: current.length + i,
        status: 'processing' as const,
      }));

      commitImages(onChange, (prev) => [...prev, ...newDrafts]);

      for (let i = 0; i < files.length; i++) {
        void processAndUpload(files[i]!, newDrafts[i]!.id);
      }

      if (inputRef.current) {
        inputRef.current.value = '';
      }
    },
    [disabled, nameAr, nameEn, onChange, processAndUpload],
  );

  const removeImage = (id: string) => {
    const item = images.find((i) => i.id === id);
    if (item?.previewUrl?.startsWith('blob:')) {
      URL.revokeObjectURL(item.previewUrl);
    }
    commitImages(onChange, (prev) => prev.filter((i) => i.id !== id));
  };

  const setMain = (id: string) => {
    commitImages(onChange, (prev) =>
      prev.map((item) => ({ ...item, isMain: item.id === id })),
    );
  };

  const moveImage = (id: string, direction: -1 | 1) => {
    commitImages(onChange, (prev) => {
      const sorted = normalizeOrders(prev);
      const index = sorted.findIndex((i) => i.id === id);
      const target = index + direction;
      if (index < 0 || target < 0 || target >= sorted.length) return prev;
      const copy = [...sorted];
      const [removed] = copy.splice(index, 1);
      copy.splice(target, 0, removed!);
      return copy;
    });
  };

  const updateAlt = (id: string, field: 'altAr' | 'altEn', value: string) => {
    commitImages(onChange, (prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item)),
    );
  };

  const retryUpload = async (id: string) => {
    const item = images.find((i) => i.id === id);
    if (!item) return;
    commitImages(onChange, (prev) =>
      prev.map((i) =>
        i.id === id ? { ...i, status: 'processing' as const, errorMessage: undefined } : i,
      ),
    );
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/jpeg,image/png,image/webp';
    input.onchange = () => {
      const file = input.files?.[0];
      if (file) void processAndUpload(file, id);
    };
    input.click();
  };

  const atMax = images.length >= MAX_LISTING_PHOTOS;

  return (
    <div className={styles.root} data-testid="listing-images-step">
      <p className={styles.hint}>{t('imagesHint')}</p>

      <input
        ref={inputRef}
        id={inputId}
        type="file"
        className={styles.fileInput}
        accept="image/jpeg,image/png,image/webp"
        multiple
        disabled={disabled || atMax}
        onChange={(e) => handleFiles(e.target.files)}
        data-testid="listing-images-input"
      />

      <label
        htmlFor={inputId}
        className={`btnSecondary ${styles.addBtn} ${disabled || atMax ? styles.addBtnDisabled : ''}`}
        data-testid="listing-images-add-label"
      >
        {t('addPhotos')}
      </label>

      {atMax ? <p className={styles.limitNote}>{t('maxPhotosReached', { count: MAX_LISTING_PHOTOS })}</p> : null}

      {images.length === 0 ? (
        <p className={styles.empty}>{t('imagesEmpty')}</p>
      ) : (
        <ul className={styles.grid}>
          {normalizeOrders(images).map((item) => (
            <li key={item.id} className={styles.card} data-testid={`listing-image-card-${item.id}`}>
              <div className={styles.thumbWrap}>
                {item.previewUrl ? (
                  <img
                    src={resolveUploadUrl(item.previewUrl)}
                    alt=""
                    className={styles.thumb}
                  />
                ) : (
                  <div className={styles.thumbPlaceholder} aria-hidden />
                )}
                {item.isMain ? (
                  <span className={styles.mainBadge}>{t('mainPhotoBadge')}</span>
                ) : null}
              </div>

              {item.status === 'processing' || item.status === 'uploading' ? (
                <p className={styles.status}>{t('uploadingPhoto')}</p>
              ) : null}

              {item.status === 'error' ? (
                <p className={styles.error} role="alert">
                  {item.errorMessage ?? t('photoUploadError')}
                </p>
              ) : null}

              {item.originalBytes != null && item.compressedBytes != null ? (
                <p className={styles.compressNote}>
                  {t('compressionNote', {
                    original: formatBytes(item.originalBytes),
                    compressed: formatBytes(item.compressedBytes),
                  })}
                </p>
              ) : null}

              <div className={styles.altFields}>
                <label className={styles.altLabel}>
                  {t('photoAltAr')}
                  <input
                    className={styles.altInput}
                    value={item.altAr}
                    disabled={disabled || item.status !== 'ready'}
                    onChange={(e) => updateAlt(item.id, 'altAr', e.target.value)}
                  />
                </label>
                <label className={styles.altLabel}>
                  {t('photoAltEn')}
                  <input
                    className={styles.altInput}
                    value={item.altEn}
                    disabled={disabled || item.status !== 'ready'}
                    onChange={(e) => updateAlt(item.id, 'altEn', e.target.value)}
                  />
                </label>
              </div>

              <div className={styles.actions}>
                {!item.isMain && item.status === 'ready' ? (
                  <button
                    type="button"
                    className={styles.btnSmall}
                    disabled={disabled}
                    onClick={() => setMain(item.id)}
                  >
                    {t('setMainPhoto')}
                  </button>
                ) : null}
                <button
                  type="button"
                  className={styles.btnSmall}
                  disabled={disabled || item.order === 0}
                  onClick={() => moveImage(item.id, -1)}
                  aria-label={t('movePhotoUp')}
                >
                  ↑
                </button>
                <button
                  type="button"
                  className={styles.btnSmall}
                  disabled={disabled || item.order === images.length - 1}
                  onClick={() => moveImage(item.id, 1)}
                  aria-label={t('movePhotoDown')}
                >
                  ↓
                </button>
                {item.status === 'error' ? (
                  <button
                    type="button"
                    className={styles.btnSmall}
                    disabled={disabled}
                    onClick={() => void retryUpload(item.id)}
                  >
                    {t('retryPhotoUpload')}
                  </button>
                ) : null}
                <button
                  type="button"
                  className={styles.btnSmallDanger}
                  disabled={disabled || item.status === 'processing' || item.status === 'uploading'}
                  onClick={() => removeImage(item.id)}
                >
                  {t('removePhoto')}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
