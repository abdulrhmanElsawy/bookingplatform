import { connectMongo, disconnectMongo } from '../../../database/mongodb.js';
import { Category } from '../../categories/category.model.js';
import { Listing } from '../listing.model.js';
import { User } from '../../users/user.model.js';

function geoPoint(lng: number, lat: number) {
  return { type: 'Point' as const, coordinates: [lng, lat] as [number, number] };
}

describe('Listing model', () => {
  let ownerId: string;
  let categoryId: string;

  beforeAll(async () => {
    await connectMongo(process.env.MONGODB_URI!);
    await Category.syncIndexes();
    await Listing.syncIndexes();
  });

  afterAll(async () => {
    await Listing.deleteMany({});
    await Category.deleteMany({});
    await User.deleteMany({});
    await disconnectMongo();
  });

  beforeEach(async () => {
    await Listing.deleteMany({});
    await Category.deleteMany({});
    await User.deleteMany({});

    const user = await User.create({
      email: `owner-${Date.now()}@example.com`,
      password: 'not-used-in-test',
      firstName: 'O',
      lastName: 'wner',
      isEmailVerified: true,
    });
    ownerId = String(user._id);

    const cat = await Category.create({
      name: { ar: 'تصنيف', en: 'Category' },
      slug: `cat-${Date.now()}`,
    });
    categoryId = String(cat._id);
  });

  function baseListing(overrides: Partial<Record<string, unknown>> = {}) {
    return {
      owner: ownerId,
      category: categoryId,
      name: { ar: 'منشأة', en: 'Venue' },
      slug: `venue-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      description: { ar: 'وصف', en: 'Description' },
      shortDescription: { ar: 'قصير', en: 'Short' },
      location: {
        address: { ar: 'شارع', en: 'Street' },
        city: { ar: 'الرياض', en: 'Riyadh' },
        district: { ar: 'حي', en: 'District' },
        coordinates: geoPoint(46.6753, 24.7136),
      },
      ...overrides,
    };
  }

  it('rejects name missing one locale', async () => {
    await expect(
      Listing.create(
        baseListing({
          name: { ar: 'بدون إنجليزي' },
        }),
      ),
    ).rejects.toThrow();
  });

  it('rejects invalid amenity key', async () => {
    await expect(
      Listing.create(
        baseListing({
          amenities: ['wifi', 'not-a-real-amenity'],
        }),
      ),
    ).rejects.toThrow(/Invalid amenity key/);
  });

  it('enforces unique slug', async () => {
    const slug = 'same-slug-listing';
    await Listing.create(baseListing({ slug }));
    await expect(Listing.create(baseListing({ slug }))).rejects.toThrow();
  });

  it('saves valid listing with known amenities', async () => {
    const doc = await Listing.create(
      baseListing({
        amenities: ['wifi', 'parking'],
        languages: ['ar', 'en'],
      }),
    );
    expect(doc.amenities).toEqual(['wifi', 'parking']);
    expect(doc.languages).toEqual(['ar', 'en']);
  });
});
