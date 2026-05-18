import { Outlet, useLocation } from 'react-router-dom';

import { Footer } from './Footer';
import { Header } from './Header';
import styles from './Layout.module.css';

export function Layout() {
  const location = useLocation();

  return (
    <div className={styles.shell}>
      <Header />
      <main key={location.pathname} className={`${styles.main} ${styles.pageEnter}`}>
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
