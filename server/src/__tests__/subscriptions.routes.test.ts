import request from 'supertest';

import app from '../app.js';
import { connectMongo, disconnectMongo } from '../database/mongodb.js';
import { signAccessToken } from '../lib/jwt.js';
import { hashPassword } from '../modules/auth/crypto.js';
import { Category } from '../modules/categories/category.model.js';
import { Listing } from '../modules/listings/listing.model.js';
import { VenueSubscription } from '../modules/subscriptions/venueSubscription.model.js';
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

describe('Subscriptions API (venue)', () => {
  beforeAll(async () => {
    await connectMongo(process.env.MONGODB_URI!);
    await VenueSubscription.syncIndexes();
    await Listing.syncIndexes();
    await Category.syncIndexes();
  });

  afterAll(async () => {
    await VenueSubscription.deleteMany({});
    await Listing.deleteMany({});
    await Category.deleteMany({});
    await User.deleteMany({});
    await disconnectMongo();
  });

  beforeEach(async () => {
    await VenueSubscription.deleteMany({});
    await Listing.deleteMany({});
    await Category.deleteMany({});
    await User.deleteMany({});
  });

  async function seedListingWithPackage() {
    const password = await hashPassword('password12');
    const owner = await User.create({
      email: `owner-${Date.now()}@example.com`,
      password,
      firstName: 'Owner',
      lastName: 'Test',
      role: 'gym_owner',
      isEmailVerified: true,
    });
    const member = await User.create({
      email: `member-${Date.now()}@example.com`,
      password,
      firstName: 'Member',
      lastName: 'Test',
      role: 'user',
      isEmailVerified: true,
    });
    const cat = await Category.create({
      name: { ar: 'أندية', en: 'Gyms' },
      slug: `gyms-${Date.now()}`,
      isActive: true,
      order: 0,
    });
    const listing = await Listing.create({
      owner: owner._id,
      category: cat._id,
      name: { ar: 'مركز تجريبي', en: 'Demo Center' },
      slug: `demo-center-${Date.now()}`,
      description: { ar: 'وصف', en: 'Desc' },
      shortDescription: { ar: 'قصير', en: 'Short' },
      location: baseLocation,
      status: 'active',
      packages: [
        {
          name: { ar: 'شهري', en: 'Monthly' },
          description: { ar: 'وصف', en: 'Desc' },
          price: 199,
          currency: 'SAR',
          duration: 'month',
          features: [],
          isActive: true,
        },
      ],
    });
    const packageId = String(listing.packages![0]!._id);
    return { owner, member, listing, packageId };
  }

  it('POST /api/subscriptions/simulate returns 401 without token', async () => {
    const res = await request(app)
      .post('/api/subscriptions/simulate')
      .send({ listingSlug: 'x', packageId: '507f1f77bcf86cd799439011' });
    expect(res.status).toBe(401);
  });

  it('POST /api/subscriptions/simulate creates subscription for user', async () => {
    const { member, listing, packageId } = await seedListingWithPackage();
    const token = signAccessToken(String(member._id), 'user');
    const res = await request(app)
      .post('/api/subscriptions/simulate')
      .set('Authorization', `Bearer ${token}`)
      .send({ listingSlug: listing.slug, packageId });
    expect(res.status).toBe(201);
    expect(res.body.subscription.accessCode).toMatch(/^GW-[A-Z0-9]{8}$/);
    expect(res.body.subscription.listing.slug).toBe(listing.slug);
    const count = await VenueSubscription.countDocuments({ user: member._id });
    expect(count).toBe(1);
  });

  it('POST /api/subscriptions/simulate returns 404 for invalid package', async () => {
    const { member, listing } = await seedListingWithPackage();
    const token = signAccessToken(String(member._id), 'user');
    const res = await request(app)
      .post('/api/subscriptions/simulate')
      .set('Authorization', `Bearer ${token}`)
      .send({
        listingSlug: listing.slug,
        packageId: '507f1f77bcf86cd799439011',
      });
    expect(res.status).toBe(404);
  });

  it('POST /api/subscriptions/verify validates code for owner', async () => {
    const { owner, member, listing, packageId } = await seedListingWithPackage();
    const memberToken = signAccessToken(String(member._id), 'user');
    const checkout = await request(app)
      .post('/api/subscriptions/simulate')
      .set('Authorization', `Bearer ${memberToken}`)
      .send({ listingSlug: listing.slug, packageId });
    const code = checkout.body.subscription.accessCode as string;

    const ownerToken = signAccessToken(String(owner._id), 'gym_owner');
    const verify = await request(app)
      .post('/api/subscriptions/verify')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ accessCode: code, listingId: String(listing._id) });
    expect(verify.status).toBe(200);
    expect(verify.body.valid).toBe(true);
    expect(verify.body.subscription.memberName).toContain('Member');
  });

  it('POST /api/subscriptions/verify returns invalid for wrong code', async () => {
    const { owner, listing } = await seedListingWithPackage();
    const ownerToken = signAccessToken(String(owner._id), 'gym_owner');
    const verify = await request(app)
      .post('/api/subscriptions/verify')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ accessCode: 'GW-INVALID1', listingId: String(listing._id) });
    expect(verify.status).toBe(200);
    expect(verify.body.valid).toBe(false);
  });

  it('GET /api/subscriptions/mine lists user subscriptions', async () => {
    const { member, listing, packageId } = await seedListingWithPackage();
    const token = signAccessToken(String(member._id), 'user');
    await request(app)
      .post('/api/subscriptions/simulate')
      .set('Authorization', `Bearer ${token}`)
      .send({ listingSlug: listing.slug, packageId });
    const res = await request(app)
      .get('/api/subscriptions/mine')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.subscriptions.length).toBe(1);
    expect(res.body.total).toBe(1);
  });
});
