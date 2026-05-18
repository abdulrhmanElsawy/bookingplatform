import { buildListingJsonLd } from '../listingJsonLd';

describe('buildListingJsonLd', () => {
  it('builds SportsActivityLocation with bilingual fields', () => {
    const listing = {
      _id: '1',
      slug: 'test-gym',
      name: { ar: 'صالة تجريبية', en: 'Test Gym' },
      description: { ar: 'وصف', en: 'Desc' },
      shortDescription: { ar: 'قصير', en: 'Short' },
      location: {
        address: { ar: 'شارع 1', en: 'St 1' },
        city: { ar: 'الرياض', en: 'Riyadh' },
        district: { ar: 'حي', en: 'Dist' },
      },
      amenities: [],
    };

    const json = buildListingJsonLd({
      listing,
      canonicalUrl: 'https://growthworldapp.com/listings/test-gym',
      name: 'Test Gym',
      description: 'Short',
    });

    expect(json['@type']).toBe('SportsActivityLocation');
    expect(json.inLanguage).toEqual(['ar', 'en']);
    expect(json.url).toBe('https://growthworldapp.com/listings/test-gym');
    expect(json.alternateName).toEqual(['صالة تجريبية', 'Test Gym']);
    expect((json.address as { addressLocality?: string }).addressLocality).toBe('الرياض');
  });
});
