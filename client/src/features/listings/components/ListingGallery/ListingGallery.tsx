import { getLocalizedValue } from '@growth-world/shared';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useLanguage } from '../../../../hooks/useLanguage';
import { resolveUploadUrl } from '../../../../utils/resolveUploadUrl';
import styles from './ListingGallery.module.css';

export type GalleryImage = {
  url: string;
  alt?: { ar: string; en: string };
};

export type ListingGalleryProps = {
  images: GalleryImage[];
  listingName: string;
};

export function ListingGallery({ images, listingName }: ListingGalleryProps) {
  const { t } = useTranslation('listings');
  const { t: tCommon } = useTranslation('common');
  const { currentLang } = useLanguage();
  const [lightboxOpen, setLightboxOpen] = useState(false);

  if (!images.length) return null;

  const main = images[0];
  const thumbs = images.slice(1, 5);
  const mainAlt = main.alt ? getLocalizedValue(main.alt, currentLang) : listingName;

  return (
    <>
      <div className={styles.gallery} data-testid="listing-gallery">
        <button
          type="button"
          className={styles.mainWrap}
          onClick={() => setLightboxOpen(true)}
          aria-label={t('showAllPhotos')}
        >
          <img
            className={styles.main}
            src={resolveUploadUrl(main.url)}
            alt={mainAlt}
            fetchPriority="high"
          />
        </button>
        <div className={styles.thumbs}>
          {thumbs.map((img, idx) => (
            <button
              key={`${img.url}-${idx}`}
              type="button"
              className={styles.thumbBtn}
              onClick={() => setLightboxOpen(true)}
            >
              <img
                src={resolveUploadUrl(img.url)}
                alt={img.alt ? getLocalizedValue(img.alt, currentLang) : listingName}
                loading="lazy"
              />
            </button>
          ))}
          {images.length > 1 ? (
            <button
              type="button"
              className={styles.showAll}
              onClick={() => setLightboxOpen(true)}
            >
              {t('showAllPhotos')}
            </button>
          ) : null}
        </div>
      </div>
      {lightboxOpen ? (
        <div
          className={styles.lightbox}
          role="dialog"
          aria-modal="true"
          aria-label={t('detailGallery')}
        >
          <button
            type="button"
            className={styles.lightboxClose}
            onClick={() => setLightboxOpen(false)}
            aria-label={tCommon('close')}
          >
            ×
          </button>
          <div className={styles.lightboxGrid}>
            {images.map((img, idx) => (
              <img
                key={`${img.url}-${idx}`}
                src={resolveUploadUrl(img.url)}
                alt={img.alt ? getLocalizedValue(img.alt, currentLang) : listingName}
              />
            ))}
          </div>
        </div>
      ) : null}
    </>
  );
}
