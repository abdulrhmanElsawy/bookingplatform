import type { ReactNode } from 'react';
import { act, renderHook, waitFor } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';

import i18n from '../../i18n';
import { GW_LANGUAGE_CHANGED } from '../../lib/languageEvents';
import { useAuthStore } from '../../store/authStore';
import { formatNumber } from '../../utils/formatters';
import { useLanguage } from '../useLanguage';

function wrapper({ children }: { children: ReactNode }) {
  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}

describe('useLanguage', () => {
  beforeEach(async () => {
    localStorage.clear();
    useAuthStore.setState({
      sessionStatus: 'ready',
      isAuthenticated: false,
      user: null,
    });
    await i18n.changeLanguage('ar');
    document.documentElement.lang = 'ar';
    document.documentElement.dir = 'rtl';
    document.documentElement.setAttribute('data-lang', 'ar');
  });

  it('switches to English and updates dir, lang, localStorage', async () => {
    const dispatchSpy = jest.spyOn(window, 'dispatchEvent');
    const { result } = renderHook(() => useLanguage(), { wrapper });

    act(() => {
      void result.current.switchLanguage('en');
    });

    await waitFor(() => {
      expect(document.documentElement.lang).toBe('en');
      expect(document.documentElement.dir).toBe('ltr');
      expect(result.current.currentLang).toBe('en');
      expect(result.current.isRTL).toBe(false);
    });
    expect(formatNumber(42, result.current.currentLang)).toMatch(/42/);
    const langEvt = dispatchSpy.mock.calls.find(
      (c) => c[0] instanceof CustomEvent && c[0].type === GW_LANGUAGE_CHANGED,
    );
    expect(langEvt).toBeDefined();
    dispatchSpy.mockRestore();
    expect(document.documentElement.getAttribute('data-lang')).toBe('en');
    expect(localStorage.getItem('gw_language')).toBe('en');
  });

  it('switches to Arabic and updates dir to rtl', async () => {
    const { result } = renderHook(() => useLanguage(), { wrapper });

    act(() => {
      result.current.switchLanguage('en');
    });
    await waitFor(() => expect(document.documentElement.dir).toBe('ltr'));

    act(() => {
      result.current.switchLanguage('ar');
    });
    await waitFor(() => expect(document.documentElement.dir).toBe('rtl'));
    expect(localStorage.getItem('gw_language')).toBe('ar');
    await waitFor(() => {
      expect(result.current.isRTL).toBe(true);
    });
  });
});
