import request from 'supertest';

import app from '../app.js';
import { connectMongo, disconnectMongo } from '../database/mongodb.js';
import { getLiveCategoryIds } from '../lib/liveCategories.js';
import { signAccessToken } from '../lib/jwt.js';
import { hashPassword } from '../modules/auth/crypto.js';
import { Category } from '../modules/categories/category.model.js';
import { Listing } from '../modules/listings/listing.model.js';
import { Notification } from '../modules/notifications/notification.model.js';
import { User } from '../modules/users/user.model.js';

const riyadhPoint = {
  type: 'Point' as const,
  coordinates: [46.6753, 24.7136] as [number, number],
};

const GOOGLE_MAPS_URL = 'https://maps.google.com/?q=24.7136,46.6753';

const baseLocationApi = {
  address: { ar: 'شارع 1', en: 'St 1' },
  city: { ar: 'الرياض', en: 'Riyadh' },
  district: { ar: 'العليا', en: 'Olaya' },
  googleMapsUrl: GOOGLE_MAPS_URL,
};

const baseLocation = {
  ...baseLocationApi,
  coordinates: riyadhPoint,
};

async function seedGymOwner() {
  const email = `gw-${Date.now()}-${Math.random().toString(16).slice(2)}@example.com`;
  const password = await hashPassword('password12');
  const user = await User.create({
    email,
    password,
    firstName: 'Gym',
    lastName: 'Owner',
    role: 'gym_owner',
    isEmailVerified: true,
  });
  const token = signAccessToken(String(user._id), 'gym_owner');
  return { user, token };
}

async function seedRegularUser() {
  const email = `usr-${Date.now()}-${Math.random().toString(16).slice(2)}@example.com`;
  const password = await hashPassword('password12');
  const user = await User.create({
    email,
    password,
    firstName: 'Regular',
    lastName: 'User',
    role: 'user',
    isEmailVerified: true,
  });
  const token = signAccessToken(String(user._id), 'user');
  return { user, token };
}

async function seedAdmin() {
  const email = `adm-${Date.now()}@example.com`;
  const password = await hashPassword('password12');
  const user = await User.create({
    email,
    password,
    firstName: 'Admin',
    lastName: 'User',
    role: 'admin',
    isEmailVerified: true,
  });
  const token = signAccessToken(String(user._id), 'admin');
  return { user, token };
}

async function seedCategory(): Promise<string> {
  const cat = await Category.create({
    name: { ar: 'أندية', en: 'Gyms' },
    slug: 'gyms',
    isActive: true,
    order: 0,
  });
  return String(cat._id);
}

describe('Listings API', () => {
  beforeAll(async () => {
    await connectMongo(process.env.MONGODB_URI!);
    await Listing.syncIndexes();
    await Category.syncIndexes();
    await Notification.syncIndexes();
  });

  afterAll(async () => {
    await Notification.deleteMany({});
    await Listing.deleteMany({});
    await Category.deleteMany({});
    await User.deleteMany({});
    await disconnectMongo();
  });

  beforeEach(async () => {
    await Notification.deleteMany({});
    await Listing.deleteMany({});
    await Category.deleteMany({});
    await User.deleteMany({});
  });

  it('GET /api/categories/:slug/listings returns category and active listings', async () => {
    const categoryId = await seedCategory();
    const { user } = await seedGymOwner();
    await Listing.create({
      owner: user._id,
      category: categoryId,
      name: { ar: 'منشأة', en: 'Gym Venue' },
      slug: 'gym-venue-cat',
      description: { ar: 'وصف', en: 'Desc' },
      shortDescription: { ar: 'ق', en: 'S' },
      location: baseLocation,
      status: 'active',
    });
    const res = await request(app).get('/api/categories/gyms/listings').expect(200);
    expect(res.body.category.slug).toBe('gyms');
    expect(res.body.category.name.ar).toBeTruthy();
    expect(res.body.total).toBeGreaterThanOrEqual(1);
    expect(
      res.body.listings.some((l: { slug: string }) => l.slug === 'gym-venue-cat'),
    ).toBe(true);
  });

  it('GET /api/listings finds Arabic text and returns bilingual name fields', async () => {
    const categoryId = await seedCategory();
    const { user } = await seedGymOwner();
    await Listing.create({
      owner: user._id,
      category: categoryId,
      name: { ar: 'صالة الأبطال الخاصة', en: 'Hero Champions Gym' },
      slug: 'hero-gym-ar-search',
      description: { ar: 'تدريب الكمال', en: 'Strength coaching space' },
      shortDescription: { ar: 'قصير', en: 'Short blurb' },
      location: baseLocation,
      status: 'active',
      amenities: ['wifi'],
      languages: ['ar', 'en'],
    });

    const res = await request(app)
      .get('/api/listings')
      .query({ search: 'الأبطال' })
      .expect(200);

    expect(res.body.total).toBeGreaterThanOrEqual(1);
    const found = res.body.listings.find(
      (l: { slug: string }) => l.slug === 'hero-gym-ar-search',
    );
    expect(found).toBeTruthy();
    expect(found.name).toEqual(
      expect.objectContaining({
        ar: expect.any(String),
        en: expect.any(String),
      }),
    );
    expect(String(found.name.ar)).toContain('الأبطال');
    expect(String(found.name.en)).toContain('Hero');
  });

  it('GET /api/listings finds English text', async () => {
    const categoryId = await seedCategory();
    const { user } = await seedGymOwner();
    await Listing.create({
      owner: user._id,
      category: categoryId,
      name: { ar: 'منتجع', en: 'Blue Lagoon Pool' },
      slug: 'blue-pool-en-search',
      description: { ar: 'مسبح أولمبي', en: 'Olympic pool lanes' },
      shortDescription: { ar: 'قصير', en: 'Short' },
      location: baseLocation,
      status: 'active',
      amenities: ['pool'],
      languages: ['ar', 'en'],
    });

    const res = await request(app)
      .get('/api/listings')
      .query({ search: 'Blue Lagoon' })
      .expect(200);

    const found = res.body.listings.find(
      (l: { slug: string }) => l.slug === 'blue-pool-en-search',
    );
    expect(found).toBeTruthy();
    expect(String(found.name.en)).toContain('Blue');
  });

  it('GET /api/categories returns bilingual names', async () => {
    await seedCategory();
    const res = await request(app).get('/api/categories').expect(200);
    expect(Array.isArray(res.body.categories)).toBe(true);
    const gyms = res.body.categories.find((c: { slug: string }) => c.slug === 'gyms');
    expect(gyms.name.ar).toBeTruthy();
    expect(gyms.name.en).toBeTruthy();
  });

  it('GET /api/listings/:slug returns a listing with bilingual location', async () => {
    const categoryId = await seedCategory();
    const { user } = await seedGymOwner();
    await Listing.create({
      owner: user._id,
      category: categoryId,
      name: { ar: 'منشأة', en: 'Venue X' },
      slug: 'venue-x',
      description: { ar: 'وصف', en: 'Desc' },
      shortDescription: { ar: 'ق', en: 'S' },
      location: baseLocation,
      status: 'active',
    });
    const res = await request(app).get('/api/listings/venue-x').expect(200);
    expect(res.body.listing.slug).toBe('venue-x');
    expect(res.body.listing.location.city).toEqual(
      expect.objectContaining({ ar: expect.any(String), en: expect.any(String) }),
    );
  });

  it('POST /api/listings as user promotes to gym_owner and creates pending listing', async () => {
    const categoryId = await seedCategory();
    const { user, token } = await seedRegularUser();
    const payload = {
      category: categoryId,
      name: { ar: 'منشأة جديدة', en: 'New User Venue' },
      description: { ar: 'وصف طويل للمنشأة هنا', en: 'Long description for the venue' },
      shortDescription: { ar: 'قصير', en: 'Short' },
      location: baseLocationApi,
      status: 'pending',
    };
    const res = await request(app)
      .post('/api/listings')
      .set('Authorization', `Bearer ${token}`)
      .send(payload)
      .expect(201);
    expect(res.body.listing.status).toBe('pending');
    expect(res.body.listing.location.googleMapsUrl).toContain('google');
    const freshUser = await User.findById(user._id).lean();
    expect(freshUser?.role).toBe('gym_owner');
  });

  it('PUT /api/listings/:id sets active listing to pending for owner', async () => {
    const categoryId = await seedCategory();
    const { user, token } = await seedGymOwner();
    const listing = await Listing.create({
      owner: user._id,
      category: categoryId,
      name: { ar: 'نشط', en: 'Active gym' },
      slug: 'active-edit-test',
      description: { ar: 'وصف', en: 'Desc' },
      shortDescription: { ar: 'ق', en: 'S' },
      location: baseLocation,
      status: 'active',
    });
    const res = await request(app)
      .put(`/api/listings/${String(listing._id)}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: { ar: 'نشط محدث', en: 'Active gym updated' },
      })
      .expect(200);
    expect(res.body.listing.status).toBe('pending');
    const fresh = await Listing.findById(listing._id).lean();
    expect(fresh?.status).toBe('pending');
  });

  it('PUT /api/listings/:id keeps pending status for owner', async () => {
    const categoryId = await seedCategory();
    const { user, token } = await seedGymOwner();
    const listing = await Listing.create({
      owner: user._id,
      category: categoryId,
      name: { ar: 'معلق', en: 'Pending gym' },
      slug: 'pending-edit-test',
      description: { ar: 'وصف', en: 'Desc' },
      shortDescription: { ar: 'ق', en: 'S' },
      location: baseLocation,
      status: 'pending',
    });
    const res = await request(app)
      .put(`/api/listings/${String(listing._id)}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        shortDescription: { ar: 'قصير محدث', en: 'Short updated' },
      })
      .expect(200);
    expect(res.body.listing.status).toBe('pending');
  });

  it('POST /api/listings creates draft for gym_owner', async () => {
    const categoryId = await seedCategory();
    const { token } = await seedGymOwner();
    const payload = {
      category: categoryId,
      name: { ar: 'جديد', en: 'New Gym' },
      description: { ar: 'وصف طويل للمنشأة هنا', en: 'Long description for the venue' },
      shortDescription: { ar: 'قصير', en: 'Short' },
      location: baseLocationApi,
    };
    const res = await request(app)
      .post('/api/listings')
      .set('Authorization', `Bearer ${token}`)
      .send(payload)
      .expect(201);
    expect(res.body.listing.status).toBe('draft');
    expect(res.body.listing.location.coordinates.coordinates[0]).toBeCloseTo(46.6753, 3);
    expect(res.body.listing.slug).toMatch(/^new-gym/);
  });

  it('GET /api/listings/:id/analytics returns metrics for owner', async () => {
    const categoryId = await seedCategory();
    const { user, token } = await seedGymOwner();
    const listing = await Listing.create({
      owner: user._id,
      category: categoryId,
      name: { ar: 'أ', en: 'A' },
      slug: 'analytics-test',
      description: { ar: 'د', en: 'D' },
      shortDescription: { ar: 'ق', en: 'S' },
      location: baseLocation,
      status: 'draft',
      views: 12,
      clicks: 3,
      contactClicks: 2,
    });
    const res = await request(app)
      .get(`/api/listings/${String(listing._id)}/analytics`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(res.body.analytics).toEqual({
      views: 12,
      clicks: 3,
      contactClicks: 2,
    });
  });

  it('PATCH /api/listings/:id/status (admin) activates listing', async () => {
    const categoryId = await seedCategory();
    const { user } = await seedGymOwner();
    const { token: adminToken } = await seedAdmin();
    const listing = await Listing.create({
      owner: user._id,
      category: categoryId,
      name: { ar: 'أ', en: 'B' },
      slug: 'pending-one',
      description: { ar: 'د', en: 'D' },
      shortDescription: { ar: 'ق', en: 'S' },
      location: baseLocation,
      status: 'pending',
    });
    await request(app)
      .patch(`/api/listings/${String(listing._id)}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'active' })
      .expect(200);
    const fresh = await Listing.findById(listing._id).lean();
    expect(fresh?.status).toBe('active');
    const notif = await Notification.findOne({ userId: user._id }).lean();
    expect(notif?.type).toBe('listing_approved');
  });

  it('PATCH /api/listings/:id/status (admin) rejects with bilingual reason and notifies owner', async () => {
    const categoryId = await seedCategory();
    const { user } = await seedGymOwner();
    const { token: adminToken } = await seedAdmin();
    const listing = await Listing.create({
      owner: user._id,
      category: categoryId,
      name: { ar: 'مرفوض', en: 'Rejected gym' },
      slug: 'pending-reject',
      description: { ar: 'د', en: 'D' },
      shortDescription: { ar: 'ق', en: 'S' },
      location: baseLocation,
      status: 'pending',
    });
    await request(app)
      .patch(`/api/listings/${String(listing._id)}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        status: 'rejected',
        rejectionReason: { ar: 'الصور غير واضحة', en: 'Photos are unclear' },
      })
      .expect(200);
    const fresh = await Listing.findById(listing._id).lean();
    expect(fresh?.status).toBe('rejected');
    expect(fresh?.rejectionReason?.ar).toContain('الصور');
    const notif = await Notification.findOne({ userId: user._id }).lean();
    expect(notif?.type).toBe('listing_rejected');
    expect(String(notif?.body.ar)).toContain('الصور');
    expect(String(notif?.body.en)).toContain('Photos');
  });

  it('GET /api/listings?category=padel returns empty for non-live category', async () => {
    await Category.create({
      name: { ar: 'بادل', en: 'Padel' },
      slug: 'padel',
      isActive: true,
      order: 1,
    });
    const gymCategoryId = await seedCategory();
    const { user } = await seedGymOwner();
    await Listing.create({
      owner: user._id,
      category: gymCategoryId,
      name: { ar: 'صالة', en: 'Gym' },
      slug: 'gym-only-list',
      description: { ar: 'وصف', en: 'Desc' },
      shortDescription: { ar: 'ق', en: 'S' },
      location: baseLocation,
      status: 'active',
    });
    const res = await request(app).get('/api/listings?category=padel').expect(200);
    expect(res.body.listings).toEqual([]);
    expect(res.body.total).toBe(0);
  });

  it('GET /api/listings without category returns only live-category listings', async () => {
    const gymCategoryId = await seedCategory();
    const padelCat = await Category.create({
      name: { ar: 'بادل', en: 'Padel' },
      slug: 'padel',
      isActive: true,
      order: 1,
    });
    const { user } = await seedGymOwner();
    await Listing.create({
      owner: user._id,
      category: gymCategoryId,
      name: { ar: 'صالة', en: 'Gym' },
      slug: 'gym-live-only',
      description: { ar: 'وصف', en: 'Desc' },
      shortDescription: { ar: 'ق', en: 'S' },
      location: baseLocation,
      status: 'active',
    });
    await Listing.create({
      owner: user._id,
      category: padelCat._id,
      name: { ar: 'بادل', en: 'Padel venue' },
      slug: 'padel-hidden',
      description: { ar: 'وصف', en: 'Desc' },
      shortDescription: { ar: 'ق', en: 'S' },
      location: baseLocation,
      status: 'active',
    });
    const liveIds = await getLiveCategoryIds();
    expect(liveIds.length).toBeGreaterThanOrEqual(1);

    const res = await request(app).get('/api/listings').expect(200);
    expect(res.body.listings).toHaveLength(1);
    expect(res.body.listings[0].slug).toBe('gym-live-only');

    const padelOnly = await request(app).get('/api/listings?category=padel').expect(200);
    expect(padelOnly.body.listings).toHaveLength(0);
  });
});
