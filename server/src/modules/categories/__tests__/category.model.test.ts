import { connectMongo, disconnectMongo } from '../../../database/mongodb.js';
import { Category } from '../category.model.js';

describe('Category model', () => {
  beforeAll(async () => {
    await connectMongo(process.env.MONGODB_URI!);
    await Category.syncIndexes();
  });

  afterAll(async () => {
    await Category.deleteMany({});
    await disconnectMongo();
  });

  beforeEach(async () => {
    await Category.deleteMany({});
  });

  it('rejects name missing English', async () => {
    await expect(
      Category.create({
        name: { ar: 'عربي فقط' },
        slug: 'test-cat',
      }),
    ).rejects.toThrow();
  });

  it('rejects name missing Arabic', async () => {
    await expect(
      Category.create({
        name: { en: 'English only' },
        slug: 'test-cat',
      }),
    ).rejects.toThrow();
  });

  it('enforces unique slug', async () => {
    await Category.create({
      name: { ar: 'أ', en: 'A' },
      slug: 'unique-slug',
    });
    await expect(
      Category.create({
        name: { ar: 'ب', en: 'B' },
        slug: 'unique-slug',
      }),
    ).rejects.toThrow();
  });

  it('persists bilingual name and slug', async () => {
    const doc = await Category.create({
      name: { ar: 'صالات', en: 'Gyms' },
      slug: 'gyms-test',
    });
    expect(doc.name.ar).toBe('صالات');
    expect(doc.name.en).toBe('Gyms');
    expect(doc.slug).toBe('gyms-test');
  });
});
