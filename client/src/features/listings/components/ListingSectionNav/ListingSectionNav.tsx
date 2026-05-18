import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import styles from './ListingSectionNav.module.css';

const SECTION_IDS = ['overview', 'packages', 'facilities', 'reviews', 'faq', 'rules'] as const;

export type SectionId = (typeof SECTION_IDS)[number];

export function ListingSectionNav() {
  const { t } = useTranslation('listings');
  const [active, setActive] = useState<SectionId>('overview');

  const labels: Record<SectionId, string> = {
    overview: t('navOverview'),
    packages: t('navPackages'),
    facilities: t('navFacilities'),
    reviews: t('navReviews'),
    faq: t('navFaq'),
    rules: t('navHouseRules'),
  };

  useEffect(() => {
    const observers: IntersectionObserver[] = [];
    for (const id of SECTION_IDS) {
      const el = document.getElementById(`section-${id}`);
      if (!el) continue;
      const obs = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting) {
              setActive(id);
            }
          }
        },
        { rootMargin: '-40% 0px -50% 0px', threshold: 0 },
      );
      obs.observe(el);
      observers.push(obs);
    }
    return () => observers.forEach((o) => o.disconnect());
  }, []);

  function scrollTo(id: SectionId): void {
    document.getElementById(`section-${id}`)?.scrollIntoView({ behavior: 'smooth' });
    setActive(id);
  }

  return (
    <nav className={styles.nav} aria-label={t('listingDetail')}>
      {SECTION_IDS.map((id) => (
        <button
          key={id}
          type="button"
          className={`${styles.link} ${active === id ? styles.active : ''}`}
          onClick={() => scrollTo(id)}
        >
          {labels[id]}
        </button>
      ))}
    </nav>
  );
}
