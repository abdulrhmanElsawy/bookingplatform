import request from 'supertest';

import app from '../app.js';
import { connectMongo, disconnectMongo } from '../database/mongodb.js';
import { signAccessToken } from '../lib/jwt.js';
import { hashPassword } from '../modules/auth/crypto.js';
import { Category } from '../modules/categories/category.model.js';
import { Listing } from '../modules/listings/listing.model.js';
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

describe('Owner reviews API', () => {
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
    await User.deleteMany({});
    await disconnectMongo();
  });

  beforeEach(async () => {
    await Review.deleteMany({});
    await Listing.deleteMany({});
    await Category.deleteMany({});
    await User.deleteMany({});
  });

  it('GET /api/reviews/for-owner returns reviews for owner listings', async () => {
    const password = await hashPassword('password12');
    const owner = await User.create({
      email: `own-r-${Date.now()}@example.com`,
      password,
      firstName: 'O',
      lastName: 'W',
      role: 'gym_owner',
      isEmailVerified: true,
    });
    const reviewer = await User.create({
      email: `rev-r-${Date.now()}@example.com`,
      password,
      firstName: 'R',
      lastName: 'V',
      role: 'user',
      isEmailVerified: true,
    });
    const cat = await Category.create({
      name: { ar: 'أندية', en: 'Gyms' },
      slug: `gyms-or-${Date.now()}`,
      isActive: true,
      order: 0,
    });
    const listing = await Listing.create({
      owner: owner._id,
      category: cat._id,
      name: { ar: 'صالة', en: 'Gym X' },
      slug: `gym-owner-rev-${Date.now()}`,
      description: { ar: 'و', en: 'D' },
      shortDescription: { ar: 'ق', en: 'S' },
      location: baseLocation,
      status: 'active',
    });
    await Review.create({
      listing: listing._id,
      user: reviewer._id,
      rating: { overall: 5, staff: 5, cleanliness: 5, facilities: 5, value: 5 },
      title: 'Great',
      content: 'Nice place',
      visitDate: new Date('2025-06-01'),
      visitType: 'individual',
      status: 'approved',
    });

    const token = signAccessToken(String(owner._id), 'gym_owner');
    const res = await request(app)
      .get('/api/reviews/for-owner')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body.total).toBe(1);
    expect(res.body.reviews[0].title).toBe('Great');
    expect(res.body.reviews[0].listingInfo.slug).toBe(listing.slug);
  });

  it('PATCH /api/reviews/:id/reply adds owner reply', async () => {
    const password = await hashPassword('password12');
    const owner = await User.create({
      email: `own-r2-${Date.now()}@example.com`,
      password,
      firstName: 'O',
      lastName: 'W',
      role: 'gym_owner',
      isEmailVerified: true,
    });
    const reviewer = await User.create({
      email: `rev-r2-${Date.now()}@example.com`,
      password,
      firstName: 'R',
      lastName: 'V',
      role: 'user',
      isEmailVerified: true,
    });
    const cat = await Category.create({
      name: { ar: 'أندية', en: 'Gyms' },
      slug: `gyms-or2-${Date.now()}`,
      isActive: true,
      order: 0,
    });
    const listing = await Listing.create({
      owner: owner._id,
      category: cat._id,
      name: { ar: 'صالة', en: 'Gym Y' },
      slug: `gym-owner-rev2-${Date.now()}`,
      description: { ar: 'و', en: 'D' },
      shortDescription: { ar: 'ق', en: 'S' },
      location: baseLocation,
      status: 'active',
    });
    const rev = await Review.create({
      listing: listing._id,
      user: reviewer._id,
      rating: { overall: 4, staff: 4, cleanliness: 4, facilities: 4, value: 4 },
      title: 'Ok',
      content: 'Ok place',
      visitDate: new Date('2025-06-01'),
      visitType: 'individual',
      status: 'approved',
    });

    const token = signAccessToken(String(owner._id), 'gym_owner');
    const res = await request(app)
      .patch(`/api/reviews/${String(rev._id)}/reply`)
      .set('Authorization', `Bearer ${token}`)
      .send({ content: 'Thanks for visiting!' })
      .expect(200);

    expect(res.body.review.ownerReply.content).toBe('Thanks for visiting!');
    const db = await Review.findById(rev._id).lean();
    expect(db?.ownerReply?.content).toBe('Thanks for visiting!');
  });

  it('PATCH /api/reviews/:id/reply returns 403 for another user', async () => {
    const password = await hashPassword('password12');
    const owner = await User.create({
      email: `own-r3-${Date.now()}@example.com`,
      password,
      firstName: 'O',
      lastName: 'W',
      role: 'gym_owner',
      isEmailVerified: true,
    });
    const otherOwner = await User.create({
      email: `own-r3b-${Date.now()}@example.com`,
      password,
      firstName: 'X',
      lastName: 'Y',
      role: 'gym_owner',
      isEmailVerified: true,
    });
    const reviewer = await User.create({
      email: `rev-r3-${Date.now()}@example.com`,
      password,
      firstName: 'R',
      lastName: 'V',
      role: 'user',
      isEmailVerified: true,
    });
    const cat = await Category.create({
      name: { ar: 'أندية', en: 'Gyms' },
      slug: `gyms-or3-${Date.now()}`,
      isActive: true,
      order: 0,
    });
    const listing = await Listing.create({
      owner: owner._id,
      category: cat._id,
      name: { ar: 'صالة', en: 'Gym Z' },
      slug: `gym-owner-rev3-${Date.now()}`,
      description: { ar: 'و', en: 'D' },
      shortDescription: { ar: 'ق', en: 'S' },
      location: baseLocation,
      status: 'active',
    });
    const rev = await Review.create({
      listing: listing._id,
      user: reviewer._id,
      rating: { overall: 4, staff: 4, cleanliness: 4, facilities: 4, value: 4 },
      title: 'Ok',
      content: 'Ok',
      visitDate: new Date('2025-06-01'),
      visitType: 'individual',
      status: 'approved',
    });

    const token = signAccessToken(String(otherOwner._id), 'gym_owner');
    await request(app)
      .patch(`/api/reviews/${String(rev._id)}/reply`)
      .set('Authorization', `Bearer ${token}`)
      .send({ content: 'Hijack' })
      .expect(403);
  });
});
