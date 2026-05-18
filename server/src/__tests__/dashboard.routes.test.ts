import request from 'supertest';

import app from '../app.js';
import { connectMongo, disconnectMongo } from '../database/mongodb.js';
import { signAccessToken } from '../lib/jwt.js';
import { hashPassword } from '../modules/auth/crypto.js';
import { Category } from '../modules/categories/category.model.js';
import { Listing } from '../modules/listings/listing.model.js';
import { User } from '../modules/users/user.model.js';

const riyadhPoint = {
  type: 'Point' as const,
  coordinates: [46.6753, 24.7136] as [number, number],
};

const baseLocation = {
  address: { ar: 'شارع 1', en: 'St 1' },
  city: { ar: 'الرياض', en: 'Riyadh' },
  district: { ar: 'العليا', en: 'Olaya' },
  coordinates: riyadhPoint,
};

describe('Dashboard API', () => {
  beforeAll(async () => {
    await connectMongo(process.env.MONGODB_URI!);
    await Listing.syncIndexes();
    await Category.syncIndexes();
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
  });

  it('GET /api/dashboard/overview returns aggregated stats for gym_owner', async () => {
    const password = await hashPassword('password12');
    const owner = await User.create({
      email: `dash-${Date.now()}@example.com`,
      password,
      firstName: 'G',
      lastName: 'O',
      role: 'gym_owner',
      isEmailVerified: true,
    });
    const cat = await Category.create({
      name: { ar: 'أندية', en: 'Gyms' },
      slug: `gyms-dash-${Date.now()}`,
      isActive: true,
      order: 0,
    });
    const catId = String(cat._id);
    await Listing.create({
      owner: owner._id,
      category: catId,
      name: { ar: 'أ', en: 'A' },
      slug: `dash-a-${Date.now()}`,
      description: { ar: 'و', en: 'D' },
      shortDescription: { ar: 'ق', en: 'S' },
      location: baseLocation,
      status: 'active',
      views: 100,
      contactClicks: 5,
      averageRating: 4,
      totalReviews: 2,
    });
    await Listing.create({
      owner: owner._id,
      category: catId,
      name: { ar: 'ب', en: 'B' },
      slug: `dash-b-${Date.now()}`,
      description: { ar: 'و', en: 'D' },
      shortDescription: { ar: 'ق', en: 'S' },
      location: baseLocation,
      status: 'draft',
      views: 20,
      contactClicks: 7,
      averageRating: 0,
      totalReviews: 0,
    });

    const token = signAccessToken(String(owner._id), 'gym_owner');
    const res = await request(app)
      .get('/api/dashboard/overview')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body.overview.totalViews).toBe(120);
    expect(res.body.overview.totalContactClicks).toBe(12);
    expect(res.body.overview.activeListings).toBe(1);
    expect(res.body.overview.totalListings).toBe(2);
    expect(res.body.overview.avgRating).toBe(4);
  });

  it('GET /api/dashboard/owner/listings returns only own listings for authenticated user', async () => {
    const password = await hashPassword('password12');
    const owner = await User.create({
      email: `list-owner-${Date.now()}@example.com`,
      password,
      firstName: 'G',
      lastName: 'O',
      role: 'gym_owner',
      isEmailVerified: true,
    });
    const other = await User.create({
      email: `list-other-${Date.now()}@example.com`,
      password,
      firstName: 'O',
      lastName: '2',
      role: 'gym_owner',
      isEmailVerified: true,
    });
    const cat = await Category.create({
      name: { ar: 'أندية', en: 'Gyms' },
      slug: `gyms-list-${Date.now()}`,
      isActive: true,
      order: 0,
    });
    const catId = String(cat._id);
    await Listing.create({
      owner: owner._id,
      category: catId,
      name: { ar: 'ملك', en: 'Mine' },
      slug: `mine-${Date.now()}`,
      description: { ar: 'و', en: 'D' },
      shortDescription: { ar: 'ق', en: 'S' },
      location: baseLocation,
      status: 'pending',
    });
    await Listing.create({
      owner: other._id,
      category: catId,
      name: { ar: 'غيري', en: 'Not mine' },
      slug: `other-${Date.now()}`,
      description: { ar: 'و', en: 'D' },
      shortDescription: { ar: 'ق', en: 'S' },
      location: baseLocation,
      status: 'active',
    });

    const token = signAccessToken(String(owner._id), 'gym_owner');
    const res = await request(app)
      .get('/api/dashboard/owner/listings')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body.listings).toHaveLength(1);
    expect(res.body.listings[0].name.en).toBe('Mine');
    expect(res.body.listings[0].status).toBe('pending');
    expect(res.body.listings[0].category?.slug).toBeTruthy();
  });

  it('GET /api/dashboard/owner/listings returns empty array for user with no venues', async () => {
    const password = await hashPassword('password12');
    const user = await User.create({
      email: `list-empty-${Date.now()}@example.com`,
      password,
      firstName: 'U',
      lastName: 'S',
      role: 'user',
      isEmailVerified: true,
    });
    const token = signAccessToken(String(user._id), 'user');
    const res = await request(app)
      .get('/api/dashboard/owner/listings')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(res.body.listings).toEqual([]);
  });

  it('GET /api/dashboard/overview returns 403 for non gym_owner', async () => {
    const password = await hashPassword('password12');
    const user = await User.create({
      email: `u-dash-${Date.now()}@example.com`,
      password,
      firstName: 'U',
      lastName: 'Ser',
      role: 'user',
      isEmailVerified: true,
    });
    const token = signAccessToken(String(user._id), 'user');
    await request(app)
      .get('/api/dashboard/overview')
      .set('Authorization', `Bearer ${token}`)
      .expect(403);
  });
});
