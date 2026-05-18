import {
  configurePublicEnv,
  getApiUrl,
  getCloudinaryUploadPreset,
  getDefaultAppLanguage,
  getGoogleMapsKey,
  getSocketUrl,
  getSupportedAppLanguages,
  normalizeApiBase,
} from '../publicEnv';

describe('publicEnv', () => {
  afterEach(() => {
    configurePublicEnv({
      apiUrl: '',
      siteUrl: '',
      socketUrl: '',
      googleMapsKey: '',
      cloudinaryUploadPreset: '',
      defaultLanguage: 'ar',
      supportedLanguages: 'ar,en',
    });
  });

  it('normalizeApiBase removes trailing /api', () => {
    expect(normalizeApiBase('http://localhost:5000/api')).toBe('http://localhost:5000');
    expect(normalizeApiBase('http://localhost:5000/api/')).toBe('http://localhost:5000');
    expect(normalizeApiBase('http://localhost:4000')).toBe('http://localhost:4000');
  });

  it('configurePublicEnv parses language and integration fields', () => {
    configurePublicEnv({
      apiUrl: 'http://host/api/',
      siteUrl: 'https://example.com/',
      socketUrl: 'http://socket:5000/',
      googleMapsKey: ' gkey ',
      cloudinaryUploadPreset: ' preset ',
      defaultLanguage: 'en',
      supportedLanguages: 'en, ar',
    });
    expect(getApiUrl()).toBe('http://host');
    expect(getSocketUrl()).toBe('http://socket:5000');
    expect(getGoogleMapsKey()).toBe('gkey');
    expect(getCloudinaryUploadPreset()).toBe('preset');
    expect(getDefaultAppLanguage()).toBe('en');
    expect(getSupportedAppLanguages()).toEqual(['en', 'ar']);
  });

  it('falls back default language into supported list', () => {
    configurePublicEnv({
      apiUrl: '',
      defaultLanguage: 'en',
      supportedLanguages: 'ar',
    });
    expect(getDefaultAppLanguage()).toBe('ar');
    expect(getSupportedAppLanguages()).toEqual(['ar']);
  });
});
