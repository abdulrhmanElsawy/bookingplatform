import { isCategoryLive } from '@growth-world/shared';
import { Link, createSearchParams } from 'react-router-dom';

import { CategoryComingSoon } from '../shared/CategoryComingSoon';
import { CategoryIcon } from '../shared/icons/categoryIcons';
import type { CategoryPill } from './headerCategoryPills';
import headerStyles from './Header.module.css';

type CategoryNavPillProps = {
  pill: CategoryPill;
  label: string;
  active: boolean;
  onNavigate?: () => void;
};

export function CategoryNavPill({ pill, label, active, onNavigate }: CategoryNavPillProps) {
  const live = isCategoryLive(pill.slug);

  if (!live) {
    return (
      <span
        className={`${headerStyles.categoryPill} ${headerStyles.categoryPillComingSoon}`}
        aria-disabled="true"
        data-testid={`category-pill-${pill.slug}-coming-soon`}
      >
        <span className={headerStyles.categoryIcon} aria-hidden>
          <CategoryIcon slug={pill.slug} size={18} />
        </span>
        {label}
        <CategoryComingSoon className={headerStyles.categoryPillOverlay} />
      </span>
    );
  }

  return (
    <Link
      className={`${headerStyles.categoryPill} ${active ? headerStyles.categoryPillActive : ''}`}
      to={{
        pathname: '/listings',
        search: createSearchParams({ category: pill.slug }).toString(),
      }}
      onClick={onNavigate}
      data-testid={`category-pill-${pill.slug}`}
    >
      <span className={headerStyles.categoryIcon} aria-hidden>
        <CategoryIcon slug={pill.slug} size={18} />
      </span>
      {label}
    </Link>
  );
}
