import { CreateListingBodySchema } from '../listings.schemas.js';

describe('CreateListingBodySchema bilingual fields', () => {
  const minimalValid = {
    category: '507f1f77bcf86cd799439011',
    name: { ar: 'صالة', en: 'Gym' },
    description: { ar: 'وصف', en: 'Desc' },
    shortDescription: { ar: 'قصير', en: 'Short' },
    location: {
      address: { ar: '١', en: '1' },
      city: { ar: 'الرياض', en: 'Riyadh' },
      district: { ar: 'حي', en: 'Dist' },
      googleMapsUrl: 'https://maps.google.com/?q=24.7,46.7',
    },
  };

  it('accepts complete bilingual name', () => {
    const r = CreateListingBodySchema.safeParse(minimalValid);
    expect(r.success).toBe(true);
  });

  it('rejects name missing English', () => {
    const r = CreateListingBodySchema.safeParse({
      ...minimalValid,
      name: { ar: 'صالة', en: '' },
    });
    expect(r.success).toBe(false);
  });

  it('rejects name missing Arabic', () => {
    const r = CreateListingBodySchema.safeParse({
      ...minimalValid,
      name: { ar: '', en: 'Gym' },
    });
    expect(r.success).toBe(false);
  });

  it('rejects name with only one locale key', () => {
    const r = CreateListingBodySchema.safeParse({
      ...minimalValid,
      name: { ar: 'صالة' },
    });
    expect(r.success).toBe(false);
  });

  it('accepts optional branches with bilingual fields', () => {
    const r = CreateListingBodySchema.safeParse({
      ...minimalValid,
      branches: [
        {
          name: { ar: 'فرع الياسمين', en: 'Al Yasmin Branch' },
          address: { ar: '١', en: '1' },
          city: { ar: 'الرياض', en: 'Riyadh' },
          district: { ar: 'الياسمين', en: 'Al Yasmin' },
          googleMapsUrl: 'https://maps.google.com/?q=24.7,46.7',
          isMain: true,
        },
      ],
    });
    expect(r.success).toBe(true);
  });

  it('rejects branch missing googleMapsUrl', () => {
    const r = CreateListingBodySchema.safeParse({
      ...minimalValid,
      branches: [
        {
          name: { ar: 'فرع', en: 'Branch' },
          address: { ar: '١', en: '1' },
          city: { ar: 'الرياض', en: 'Riyadh' },
          district: { ar: 'حي', en: 'Dist' },
        },
      ],
    });
    expect(r.success).toBe(false);
  });
});
