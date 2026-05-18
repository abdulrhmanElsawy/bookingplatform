import { BilingualFieldSchema } from '../schemas/common';
import { RegisterSchema } from '../schemas/authSchemas';
import { getLocalizedValue } from '../types/common';
import { ListingCreateSchema } from '../schemas/listingSchemas';
import { UserPreferencesSchema } from '../schemas/userSchemas';

describe('shared Zod schemas', () => {
  it('parses bilingual fields', () => {
    const parsed = BilingualFieldSchema.parse({
      ar: 'الرياض',
      en: 'Riyadh',
    });
    expect(parsed.en).toBe('Riyadh');
  });

  it('rejects register when passwords mismatch', () => {
    const result = RegisterSchema.safeParse({
      email: 'a@b.com',
      password: 'password1',
      confirmPassword: 'password2',
      firstName: 'A',
      lastName: 'B',
    });
    expect(result.success).toBe(false);
  });

  it('getLocalizedValue falls back to Arabic', () => {
    const field = { ar: 'مرحبا', en: '' };
    expect(getLocalizedValue(field, 'en')).toBe('مرحبا');
  });

  it('parses listing create payload', () => {
    const parsed = ListingCreateSchema.parse({
      name: { ar: 'نادي', en: 'Gym' },
      description: { ar: 'وصف', en: 'Desc' },
      city: { ar: 'الرياض', en: 'Riyadh' },
      categoryId: 'cat_1',
    });
    expect(parsed.categoryId).toBe('cat_1');
  });

  it('parses user preferences language', () => {
    const parsed = UserPreferencesSchema.parse({ language: 'ar' });
    expect(parsed.language).toBe('ar');
  });
});
