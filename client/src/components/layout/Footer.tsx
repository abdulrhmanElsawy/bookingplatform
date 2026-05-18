import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, createSearchParams } from 'react-router-dom';

import { BrandLogo } from '../brand/BrandLogo';
import { useLanguage } from '../../hooks/useLanguage';
import { useListYourGymPath } from '../../hooks/useListYourGymPath';
import { useAuthStore } from '../../store/authStore';
import { HOME_CITIES } from '../../features/home/data/homeCities';
import { CATEGORY_PILLS } from './headerCategoryPills';
import styles from './Footer.module.css';

const FOOTER_CITIES = HOME_CITIES.slice(0, 4);

function PlaceholderLegalLink({ children }: { children: string }) {
  return (
    <a
      href="#"
      className={styles.linkMuted}
      onClick={(e) => e.preventDefault()}
      aria-disabled="true"
    >
      {children}
    </a>
  );
}

function InstagramIcon({ size = 18 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

function XIcon({ size = 18 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
    >
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

export function Footer() {
  const { t } = useTranslation('common');
  const { t: tListings } = useTranslation('listings');
  const { t: tAuth } = useTranslation('auth');
  const { currentLang } = useLanguage();
  const listYourGymPath = useListYourGymPath();
  const hydrateFromServer = useAuthStore((s) => s.hydrateFromServer);
  const sessionStatus = useAuthStore((s) => s.sessionStatus);
  const year = new Date().getFullYear();

  useEffect(() => {
    if (sessionStatus === 'pending') {
      void hydrateFromServer();
    }
  }, [sessionStatus, hydrateFromServer]);

  function cityLabel(city: (typeof FOOTER_CITIES)[number]): string {
    return currentLang === 'ar' ? city.ar : city.en;
  }

  return (
    <footer className={styles.footer} data-testid="site-footer">
      <div className={styles.inner}>
        <div className={styles.top}>
          <div className={styles.brandBlock}>
            <Link to="/" className={styles.brandLink}>
              <BrandLogo variant="footer" />
            </Link>
            <p className={styles.tagline}>{t('tagline')}</p>
            <p className={styles.about}>{t('footerAbout')}</p>
          </div>
          <aside className={styles.ctaCard} aria-labelledby="footer-cta-heading">
            <h2 id="footer-cta-heading" className={styles.ctaTitle}>
              {tListings('listYourGymTitle')}
            </h2>
            <p className={styles.ctaDesc}>{tListings('listYourGymDesc')}</p>
            <Link className={`btnPrimary ${styles.ctaBtn}`} to={listYourGymPath} data-testid="footer-list-your-gym-cta">
              {tListings('listYourGymBtn')}
            </Link>
          </aside>
        </div>

        <div className={styles.grid}>
          <nav className={styles.col} aria-labelledby="footer-heading-explore">
            <h2 id="footer-heading-explore" className={styles.colTitle}>
              {t('footerExplore')}
            </h2>
            <ul className={styles.list}>
              <li>
                <Link className={styles.link} to="/">
                  {t('home')}
                </Link>
              </li>
              <li>
                <Link className={styles.link} to="/listings">
                  {t('search')}
                </Link>
              </li>
              {CATEGORY_PILLS.map((pill) => (
                <li key={pill.slug}>
                  <Link
                    className={styles.link}
                    to={{
                      pathname: '/listings',
                      search: createSearchParams({ category: pill.slug }).toString(),
                    }}
                  >
                    {t(pill.labelKey)}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav className={styles.col} aria-labelledby="footer-heading-cities">
            <h2 id="footer-heading-cities" className={styles.colTitle}>
              {t('footerPopularCities')}
            </h2>
            <ul className={styles.list}>
              {FOOTER_CITIES.map((city) => (
                <li key={city.slug}>
                  <Link
                    className={styles.link}
                    to={{
                      pathname: '/listings',
                      search: createSearchParams({ search: cityLabel(city) }).toString(),
                    }}
                  >
                    {cityLabel(city)}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav className={styles.col} aria-labelledby="footer-heading-venues">
            <h2 id="footer-heading-venues" className={styles.colTitle}>
              {t('footerForVenues')}
            </h2>
            <ul className={styles.list}>
              <li>
                <Link className={styles.link} to={listYourGymPath} data-testid="footer-list-your-gym-link">
                  {t('listYourGym')}
                </Link>
              </li>
              <li>
                <Link className={styles.link} to="/login">
                  {tAuth('signInCta')}
                </Link>
              </li>
              <li>
                <Link className={styles.link} to="/listings">
                  {t('help')}
                </Link>
              </li>
            </ul>
          </nav>

          <div className={styles.col} aria-labelledby="footer-heading-legal">
            <h2 id="footer-heading-legal" className={styles.colTitle}>
              {t('footerLegalSocial')}
            </h2>
            <ul className={styles.list}>
              <li>
                <PlaceholderLegalLink>{t('privacyPolicy')}</PlaceholderLegalLink>
              </li>
              <li>
                <PlaceholderLegalLink>{t('termsOfService')}</PlaceholderLegalLink>
              </li>
              <li>
                <PlaceholderLegalLink>{t('cookiePolicy')}</PlaceholderLegalLink>
              </li>
            </ul>
            <p className={styles.socialLabel}>{t('footerSocial')}</p>
            <div className={styles.socialRow}>
              <a
                className={styles.socialBtn}
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                data-testid="footer-social-instagram"
                aria-label={t('socialInstagram')}
              >
                <InstagramIcon size={18} />
                <span className="visuallyHidden">{t('socialInstagram')}</span>
              </a>
              <a
                className={styles.socialBtn}
                href="https://x.com"
                target="_blank"
                rel="noopener noreferrer"
                data-testid="footer-social-x"
                aria-label={t('socialX')}
              >
                <XIcon size={18} />
                <span className="visuallyHidden">{t('socialX')}</span>
              </a>
            </div>
          </div>
        </div>

        <div className={styles.bottomBar}>
          <p className={styles.copyright}>{t('footerCopyright', { year })}</p>
        </div>
      </div>
    </footer>
  );
}
