import request from 'supertest';

import app from '../app.js';
import { connectMongo, disconnectMongo } from '../database/mongodb.js';
import { signAccessToken } from '../lib/jwt.js';
import { hashPassword } from '../modules/auth/crypto.js';
import { Category } from '../modules/categories/category.model.js';
import { Favorite } from '../modules/favorites/favorite.model.js';
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

async function seedCategory(): Promise<string> {
  const cat = await Category.create({
    name: { ar: 'أندية', en: 'Gyms' },
    slug: `gyms-${Date.now()}`,
    isActive: true,
    order: 0,
  });
  return String(cat._id);
}

describe('Favorites API', () => {
  beforeAll(async () => {
    await connectMongo(process.env.MONGODB_URI!);
    await Favorite.syncIndexes();
    await Listing.syncIndexes();
    await Category.syncIndexes();
  });

  afterAll(async () => {
    await Favorite.deleteMany({});
    await Listing.deleteMany({});
    await Category.deleteMany({});
    await User.deleteMany({});
    await disconnectMongo();
  });

  beforeEach(async () => {
    await Favorite.deleteMany({});
    await Listing.deleteMany({});
    await Category.deleteMany({});
    await User.deleteMany({});
  });

  it('GET /api/favorites/status returns favorited false without auth', async () => {
    const res = await request(app)
      .get('/api/favorites/status')
      .query({ listing: 'any-slug' })
      .expect(200);
    expect(res.body.favorited).toBe(false);
  });

  it('POST favorite then status true; DELETE then false', async () => {
    const categoryId = await seedCategory();
    const owner = await User.create({
      email: `own-${Date.now()}@example.com`,
      password: await hashPassword('password12'),
      firstName: 'O',
      lastName: 'wner',
      role: 'gym_owner',
      isEmailVerified: true,
    });
    const fan = await User.create({
      email: `fan-${Date.now()}@example.com`,
      password: await hashPassword('password12'),
      firstName: 'F',
      lastName: 'an',
      role: 'user',
      isEmailVerified: true,
    });
    const token = signAccessToken(String(fan._id), 'user');
    await Listing.create({
      owner: owner._id,
      category: categoryId,
      name: { ar: 'منشأة', en: 'Venue Fav' },
      slug: 'venue-fav-one',
      description: { ar: 'وصف', en: 'Desc' },
      shortDescription: { ar: 'ق', en: 'S' },
      location: baseLocation,
      status: 'active',
    });

    await request(app)
      .post('/api/favorites')
      .set('Authorization', `Bearer ${token}`)
      .send({ listing: 'venue-fav-one' })
      .expect(201);

    const st = await request(app)
      .get('/api/favorites/status')
      .query({ listing: 'venue-fav-one' })
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(st.body.favorited).toBe(true);

    await request(app)
      .delete('/api/favorites')
      .query({ listing: 'venue-fav-one' })
      .set('Authorization', `Bearer ${token}`)
      .expect(204);

    const st2 = await request(app)
      .get('/api/favorites/status')
      .query({ listing: 'venue-fav-one' })
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(st2.body.favorited).toBe(false);
  });

  it('duplicate POST returns 409', async () => {
    const categoryId = await seedCategory();
    const owner = await User.create({
      email: `own2-${Date.now()}@example.com`,
      password: await hashPassword('password12'),
      firstName: 'O',
      lastName: 'wner',
      role: 'gym_owner',
      isEmailVerified: true,
    });
    const fan = await User.create({
      email: `fan2-${Date.now()}@example.com`,
      password: await hashPassword('password12'),
      firstName: 'F',
      lastName: 'an',
      role: 'user',
      isEmailVerified: true,
    });
    const token = signAccessToken(String(fan._id), 'user');
    await Listing.create({
      owner: owner._id,
      category: categoryId,
      name: { ar: 'منشأة', en: 'Venue Fav' },
      slug: 'venue-fav-dup',
      description: { ar: 'وصف', en: 'Desc' },
      shortDescription: { ar: 'ق', en: 'S' },
      location: baseLocation,
      status: 'active',
    });

    await request(app)
      .post('/api/favorites')
      .set('Authorization', `Bearer ${token}`)
      .send({ listing: 'venue-fav-dup' })
      .expect(201);
    await request(app)
      .post('/api/favorites')
      .set('Authorization', `Bearer ${token}`)
      .send({ listing: 'venue-fav-dup' })
      .expect(409);
  });
});
