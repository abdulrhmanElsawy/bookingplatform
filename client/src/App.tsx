import { QueryClientProvider } from '@tanstack/react-query';
import { I18nextProvider } from 'react-i18next';
import { BrowserRouter } from 'react-router-dom';

import { NotificationsSocketRoot } from './components/NotificationsSocketRoot';
import { LanguageDocumentSync } from './components/layout/LanguageDocumentSync';
import { LanguageLiveRegion } from './components/layout/LanguageLiveRegion';
import { ScrollToTop } from './components/layout/ScrollToTop';
import { AuthBootstrap } from './features/auth/components/AuthBootstrap';
import i18n from './i18n';
import { createAppQueryClient } from './queryClient';
import { AppRouter } from './router/AppRouter';

const queryClient = createAppQueryClient();

export default function App() {
  return (
    <I18nextProvider i18n={i18n}>
      <LanguageDocumentSync />
      <LanguageLiveRegion />
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <ScrollToTop />
          <AuthBootstrap />
          <NotificationsSocketRoot />
          <AppRouter />
        </BrowserRouter>
      </QueryClientProvider>
    </I18nextProvider>
  );
}
