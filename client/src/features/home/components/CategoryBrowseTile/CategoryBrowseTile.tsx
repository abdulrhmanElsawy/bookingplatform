import { useEffect, useState, type ReactNode } from 'react';
import { Link, type LinkProps } from 'react-router-dom';

import {
  DEFAULT_CATEGORY_COVER,
  getCategoryCoverUrl,
} from '../../data/categoryCoverImages';
import styles from './CategoryBrowseTile.module.css';

export type CategoryBrowseTileProps = {
  slug: string;
  imageFromApi?: string | null;
  to: LinkProps['to'];
  className?: string;
  labelClassName?: string;
  children: ReactNode;
};

export function CategoryBrowseTile({
  slug,
  imageFromApi,
  to,
  className,
  labelClassName,
  children,
}: CategoryBrowseTileProps) {
  const coverUrl = getCategoryCoverUrl(slug, imageFromApi);
  const [imageSrc, setImageSrc] = useState(coverUrl);

  useEffect(() => {
    setImageSrc(getCategoryCoverUrl(slug, imageFromApi));
  }, [slug, imageFromApi]);

  function onImageError() {
    setImageSrc((current) =>
      current === DEFAULT_CATEGORY_COVER ? current : DEFAULT_CATEGORY_COVER,
    );
  }

  return (
    <Link
      to={to}
      className={`${styles.tile} ${className ?? ''}`.trim()}
    >
      <img
        className={styles.image}
        src={imageSrc}
        alt=""
        loading="lazy"
        decoding="async"
        aria-hidden
        onError={onImageError}
      />
      <span className={styles.overlay} aria-hidden />
      <span className={labelClassName ?? styles.label}>{children}</span>
    </Link>
  );
}
