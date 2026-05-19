import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

function scrollWindowToTop() {
  window.scrollTo(0, 0);
  document.documentElement.scrollTop = 0;
  document.body.scrollTop = 0;
}

/** Scroll to top on client-side route changes (pathname). */
export function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    scrollWindowToTop();
  }, [pathname]);

  return null;
}
