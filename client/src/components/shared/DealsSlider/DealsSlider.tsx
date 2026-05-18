import useEmblaCarousel from 'embla-carousel-react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import {
  Children,
  isValidElement,
  useCallback,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { useTranslation } from 'react-i18next';

import { useLanguage } from '../../../hooks/useLanguage';
import styles from './DealsSlider.module.css';

export type DealsSliderProps = {
  children: ReactNode;
  ariaLabel: string;
  title?: string;
  titleId?: string;
  className?: string;
};

export function DealsSlider({
  children,
  ariaLabel,
  title,
  titleId,
  className,
}: DealsSliderProps) {
  const { t } = useTranslation('common');
  const { isRTL } = useLanguage();
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  const [emblaRef, emblaApi] = useEmblaCarousel({
    direction: isRTL ? 'rtl' : 'ltr',
    align: 'start',
    containScroll: 'trimSnaps',
    dragFree: false,
    slidesToScroll: 1,
  });

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setCanScrollPrev(emblaApi.canScrollPrev());
    setCanScrollNext(emblaApi.canScrollNext());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on('select', onSelect);
    emblaApi.on('reInit', onSelect);
    return () => {
      emblaApi.off('select', onSelect);
      emblaApi.off('reInit', onSelect);
    };
  }, [emblaApi, onSelect]);

  useEffect(() => {
    emblaApi?.reInit();
  }, [emblaApi, isRTL]);

  useEffect(() => {
    if (!emblaApi) return;
    const mq = window.matchMedia('(max-width: 767px)');
    const onBreakpointChange = () => emblaApi.reInit();
    mq.addEventListener('change', onBreakpointChange);
    return () => mq.removeEventListener('change', onBreakpointChange);
  }, [emblaApi]);

  const scrollPrev = useCallback(() => {
    emblaApi?.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    emblaApi?.scrollNext();
  }, [emblaApi]);

  const goToPrev = isRTL ? scrollNext : scrollPrev;
  const goToNext = isRTL ? scrollPrev : scrollNext;
  const canGoPrev = isRTL ? canScrollNext : canScrollPrev;
  const canGoNext = isRTL ? canScrollPrev : canScrollNext;

  const PrevIcon = isRTL ? ChevronRight : ChevronLeft;
  const NextIcon = isRTL ? ChevronLeft : ChevronRight;

  const slides = Children.toArray(children).filter(isValidElement);

  return (
    <div className={`${styles.root} ${className ?? ''}`.trim()} data-testid="deals-slider">
      <div className={styles.head}>
        {title ? (
          <h2 id={titleId} className={styles.title}>
            {title}
          </h2>
        ) : (
          <span className={styles.titleSpacer} />
        )}
        <div className={styles.nav}>
          <button
            type="button"
            className={styles.navBtn}
            onClick={goToPrev}
            disabled={!canGoPrev}
            aria-label={t('previous')}
            data-testid="deals-slider-prev"
          >
            <PrevIcon size={20} strokeWidth={2} aria-hidden />
          </button>
          <button
            type="button"
            className={styles.navBtn}
            onClick={goToNext}
            disabled={!canGoNext}
            aria-label={t('next')}
            data-testid="deals-slider-next"
          >
            <NextIcon size={20} strokeWidth={2} aria-hidden />
          </button>
        </div>
        </div>

      <div
        className={styles.viewportWrap}
        role="region"
        aria-roledescription="carousel"
        aria-label={ariaLabel}
      >
        <div ref={emblaRef} className={styles.viewport}>
          <div className={styles.container} role="list">
            {slides.map((slide, index) => (
              <div
                key={slide.key ?? `slide-${index}`}
                className={styles.slide}
                role="listitem"
                aria-roledescription="slide"
              >
                {slide}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
