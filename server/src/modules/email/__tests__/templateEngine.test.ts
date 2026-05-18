import { escapeHtml, renderTemplate } from '../templateEngine';

describe('templateEngine', () => {
  it('escapes HTML in interpolated values', () => {
    expect(escapeHtml('<script>')).not.toContain('<');
  });

  it('renders verification template with OTP', () => {
    const html = renderTemplate('verification-code.en.html', {
      otp: '123456',
      userName: 'Sara',
    });
    expect(html).toContain('123456');
    expect(html).toContain('Sara');
    expect(html).toContain('dir="ltr"');
  });

  it('renders Arabic verification template with RTL', () => {
    const html = renderTemplate('verification-code.ar.html', {
      otp: '999888',
      userName: 'خالد',
    });
    expect(html).toContain('999888');
    expect(html).toContain('dir="rtl"');
    expect(html).toContain('Tajawal');
  });
});
