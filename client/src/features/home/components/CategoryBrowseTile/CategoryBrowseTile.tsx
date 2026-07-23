import { useEffect, useState, type ReactNode } from 'react';
import { Link, type LinkProps } from 'react-router-dom';

import { CategoryComingSoon } from '../../../../components/shared/CategoryComingSoon';
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
  comingSoon?: boolean;
  children: ReactNode;
};

export function CategoryBrowseTile({
  slug,
  imageFromApi,
  to,
  className,
  labelClassName,
  comingSoon = false,
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

  const tileClassName = `${styles.tile} ${comingSoon ? styles.tileComingSoon : ''} ${className ?? ''}`.trim();

  const inner = (
    <>
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
      {comingSoon ? <CategoryComingSoon /> : null}
      <span className={labelClassName ?? styles.label}>{children}</span>
    </>
  );

  if (comingSoon) {
    return (
      <div className={tileClassName} aria-disabled="true">
        {inner}
      </div>
    );
  }

  return (
    <Link to={to} className={tileClassName}>
      {inner}
    </Link>
  );
}
