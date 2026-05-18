import { act, cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { I18nextProvider } from 'react-i18next';

import i18n from '../../../i18n';
import { LanguageSwitcher } from '../LanguageSwitcher';

function renderSwitcher() {
  return render(
    <I18nextProvider i18n={i18n}>
      <LanguageSwitcher />
    </I18nextProvider>,
  );
}

describe('LanguageSwitcher', () => {
  afterEach(() => {
    cleanup();
  });

  it('switches to English when EN is clicked', async () => {
    const user = userEvent.setup();
    await act(async () => {
      await i18n.changeLanguage('ar');
    });
    document.documentElement.dir = 'rtl';

    renderSwitcher();
    await user.click(screen.getByRole('button', { name: 'EN' }));

    await act(async () => {});
    expect(i18n.language.startsWith('en')).toBe(true);
    expect(document.documentElement.lang).toBe('en');
    expect(document.documentElement.dir).toBe('ltr');
  });

  it('switches to Arabic when AR is clicked', async () => {
    const user = userEvent.setup();
    await act(async () => {
      await i18n.changeLanguage('en');
    });
    document.documentElement.dir = 'ltr';

    renderSwitcher();
    await user.click(screen.getByRole('button', { name: 'AR' }));

    await act(async () => {});
    expect(i18n.language.startsWith('ar')).toBe(true);
    expect(document.documentElement.lang).toBe('ar');
    expect(document.documentElement.dir).toBe('rtl');
  });
});
