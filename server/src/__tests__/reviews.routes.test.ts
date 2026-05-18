import request from 'supertest';

import app from '../app.js';
import { connectMongo, disconnectMongo } from '../database/mongodb.js';
import { signAccessToken } from '../lib/jwt.js';
import { hashPassword } from '../modules/auth/crypto.js';
import { Category } from '../modules/categories/category.model.js';
import { Listing } from '../modules/listings/listing.model.js';
import { Notification } from '../modules/notifications/notification.model.js';
import { Review } from '../modules/reviews/review.model.js';
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

async function seedReviewer() {
  const email = `rev-${Date.now()}-${Math.random().toString(16).slice(2)}@example.com`;
  const password = await hashPassword('password12');
  const user = await User.create({
    email,
    password,
    firstName: 'Rev',
    lastName: 'Viewer',
    role: 'user',
    isEmailVerified: true,
  });
  const token = signAccessToken(String(user._id), 'user');
  return { user, token };
}

describe('Reviews API', () => {
  beforeAll(async () => {
    await connectMongo(process.env.MONGODB_URI!);
    await Review.syncIndexes();
    await Listing.syncIndexes();
    await Category.syncIndexes();
  });

  afterAll(async () => {
    await Review.deleteMany({});
    await Listing.deleteMany({});
    await Category.deleteMany({});
    await Notification.deleteMany({});
    await User.deleteMany({});
    await disconnectMongo();
  });

  beforeEach(async () => {
    await Review.deleteMany({});
    await Listing.deleteMany({});
    await Category.deleteMany({});
    await Notification.deleteMany({});
    await User.deleteMany({});
  });

  function reviewPayload(listingSlug: string) {
    return {
      listing: listingSlug,
      rating: {
        overall: 5,
        staff: 4,
        cleanliness: 3,
        facilities: 5,
        value: 4,
      },
      title: 'Great venue',
      content: 'Had a solid workout session.',
      visitDate: '2025-06-01',
      visitType: 'individual',
    };
  }

  it('creates an in-app notification for the listing owner when a review is posted', async () => {
    const categoryId = await seedCategory();
    const owner = await User.create({
      email: `own-notif-${Date.now()}@example.com`,
      password: await hashPassword('password12'),
      firstName: 'Own',
      lastName: 'Er',
      role: 'gym_owner',
      isEmailVerified: true,
    });
    await Listing.create({
      owner: owner._id,
      category: categoryId,
      name: { ar: 'صالة الأبطال', en: 'Hero Gym' },
      slug: 'venue-rev-notif',
      description: { ar: 'وصف', en: 'Desc' },
      shortDescription: { ar: 'ق', en: 'S' },
      location: baseLocation,
      status: 'active',
    });
    const reviewer = await User.create({
      email: `rev-notif-${Date.now()}@example.com`,
      password: await hashPassword('password12'),
      firstName: 'R',
      lastName: 'V',
      role: 'user',
      isEmailVerified: true,
    });
    const token = signAccessToken(String(reviewer._id), 'user');
    await request(app)
      .post('/api/reviews')
      .set('Authorization', `Bearer ${token}`)
      .send(reviewPayload('venue-rev-notif'))
      .expect(201);

    const notifs = await Notification.find({ userId: owner._id }).lean();
    expect(notifs).toHaveLength(1);
    expect(notifs[0].type).toBe('new_review');
    expect(notifs[0].title).toMatchObject({ ar: expect.any(String), en: expect.any(String) });
  });

  it('GET /api/reviews requires listing query', async () => {
    const res = await request(app).get('/api/reviews').expect(400);
    expect(res.body.error).toBeDefined();
  });

  it('GET /api/reviews returns paginated reviews for a listing', async () => {
    const categoryId = await seedCategory();
    const owner = await User.create({
      email: `own-list-${Date.now()}@example.com`,
      password: await hashPassword('password12'),
      firstName: 'Own',
      lastName: 'Er',
      role: 'gym_owner',
      isEmailVerified: true,
    });
    await Listing.create({
      owner: owner._id,
      category: categoryId,
      name: { ar: 'منشأة', en: 'Venue List' },
      slug: 'venue-rev-list',
      description: { ar: 'وصف', en: 'Desc' },
      shortDescription: { ar: 'ق', en: 'S' },
      location: baseLocation,
      status: 'active',
    });
    const reviewer = await User.create({
      email: `list-${Date.now()}@example.com`,
      password: await hashPassword('password12'),
      firstName: 'L',
      lastName: 'ist',
      role: 'user',
      isEmailVerified: true,
    });
    const token = signAccessToken(String(reviewer._id), 'user');
    await request(app)
      .post('/api/reviews')
      .set('Authorization', `Bearer ${token}`)
      .send(reviewPayload('venue-rev-list'))
      .expect(201);

    const res = await request(app)
      .get('/api/reviews')
      .query({ listing: 'venue-rev-list' })
      .expect(200);
    expect(res.body.total).toBe(1);
    expect(Array.isArray(res.body.reviews)).toBe(true);
    expect(res.body.reviews[0].title).toBe('Great venue');
  });

  it('POST then duplicate POST returns 409', async () => {
    const categoryId = await seedCategory();
    const owner = await User.create({
      email: `own-${Date.now()}@example.com`,
      password: await hashPassword('password12'),
      firstName: 'Own',
      lastName: 'Er',
      role: 'gym_owner',
      isEmailVerified: true,
    });
    await Listing.create({
      owner: owner._id,
      category: categoryId,
      name: { ar: 'منشأة', en: 'Venue Rev' },
      slug: 'venue-rev-dup',
      description: { ar: 'وصف', en: 'Desc' },
      shortDescription: { ar: 'ق', en: 'S' },
      location: baseLocation,
      status: 'active',
    });

    const { token } = await seedReviewer();
    const body = reviewPayload('venue-rev-dup');
    await request(app)
      .post('/api/reviews')
      .set('Authorization', `Bearer ${token}`)
      .send(body)
      .expect(201);

    await request(app)
      .post('/api/reviews')
      .set('Authorization', `Bearer ${token}`)
      .send(body)
      .expect(409);
  });

  it('updates listing averageRating after an approved review', async () => {
    const categoryId = await seedCategory();
    const owner = await User.create({
      email: `own2-${Date.now()}@example.com`,
      password: await hashPassword('password12'),
      firstName: 'Own',
      lastName: 'Er',
      role: 'gym_owner',
      isEmailVerified: true,
    });
    await Listing.create({
      owner: owner._id,
      category: categoryId,
      name: { ar: 'منشأة', en: 'Venue Rate' },
      slug: 'venue-rev-rate',
      description: { ar: 'وصف', en: 'Desc' },
      shortDescription: { ar: 'ق', en: 'S' },
      location: baseLocation,
      status: 'active',
      averageRating: 0,
      totalReviews: 0,
    });

    const reviewer = await User.create({
      email: `u2-${Date.now()}@example.com`,
      password: await hashPassword('password12'),
      firstName: 'U',
      lastName: 'Two',
      role: 'user',
      isEmailVerified: true,
    });
    const token = signAccessToken(String(reviewer._id), 'user');

    await request(app)
      .post('/api/reviews')
      .set('Authorization', `Bearer ${token}`)
      .send(reviewPayload('venue-rev-rate'))
      .expect(201);

    const res = await request(app).get('/api/listings/venue-rev-rate').expect(200);
    expect(res.body.listing.totalReviews).toBe(1);
    expect(res.body.listing.averageRating).toBe(4.2);
  });
});
