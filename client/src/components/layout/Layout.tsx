import { Outlet, useLocation } from 'react-router-dom';

import { BottomQuickNav } from './BottomQuickNav';
import { Footer } from './Footer';
import { Header } from './Header';
import styles from './Layout.module.css';

function isFullBleedPath(pathname: string): boolean {
  return /^\/listings\/[^/]+$/.test(pathname) || pathname === '/compare';
}

export function Layout() {
  const location = useLocation();
  const hideChrome = isFullBleedPath(location.pathname);

  return (
    <div className={styles.shell}>
      {!hideChrome ? <Header /> : null}
      <main
        key={location.pathname}
        className={`${styles.main} ${styles.pageEnter} ${hideChrome ? styles.mainListingDetail : ''}`}
      >
        <Outlet />
      </main>
      {!hideChrome ? <BottomQuickNav /> : null}
      {!hideChrome ? <Footer /> : null}
    </div>
  );
}


