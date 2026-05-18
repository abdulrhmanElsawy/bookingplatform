import styles from './StarRating.module.css';

export type StarRatingSize = 'sm' | 'md' | 'lg';

export type StarRatingProps = {
  value: number;
  max?: number;
  size?: StarRatingSize;
  className?: string;
  'data-testid'?: string;
};

function StarIcon({ filled, half }: { filled: boolean; half: boolean }) {
  return (
    <span
      className={[styles.star, filled || half ? styles.starFilled : ''].filter(Boolean).join(' ')}
      aria-hidden
    >
      ★
      {half ? (
        <span className={styles.half} aria-hidden>
          ★
        </span>
      ) : null}
    </span>
  );
}

export function StarRating({
  value,
  max = 5,
  size = 'md',
  className,
  'data-testid': testId,
}: StarRatingProps) {
  const clamped = Math.max(0, Math.min(max, value));
  const stars = Array.from({ length: max }, (_, i) => {
    const remainder = clamped - i;
    if (remainder >= 1) return 'full' as const;
    if (remainder >= 0.25) return 'half' as const;
    return 'empty' as const;
  });

  return (
    <span
      className={[styles.root, styles[size], className].filter(Boolean).join(' ')}
      data-testid={testId}
      role="img"
      aria-label={`${clamped} / ${max}`}
    >
      {stars.map((kind, i) => (
        <StarIcon key={i} filled={kind === 'full'} half={kind === 'half'} />
      ))}
    </span>
  );
}
