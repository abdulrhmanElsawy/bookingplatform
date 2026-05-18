import styles from './BrandLogo.module.css';

const LOGO_SRC = '/brand/logo-growth-world.png';

export type BrandLogoVariant = 'header' | 'auth' | 'footer';

export type BrandLogoProps = {
  variant?: BrandLogoVariant;
  className?: string;
};

export function BrandLogo({ variant = 'header', className }: BrandLogoProps) {
  const variantClass =
    variant === 'footer'
      ? styles.footer
      : variant === 'auth'
        ? styles.auth
        : styles.header;

  return (
    <img
      className={`${styles.logo} ${variantClass} ${className ?? ''}`.trim()}
      src={LOGO_SRC}
      alt="Growth World"
      width={200}
      height={48}
      decoding="async"
      data-testid="brand-logo"
    />
  );
}
