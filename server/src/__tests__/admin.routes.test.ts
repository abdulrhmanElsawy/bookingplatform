import request from 'supertest';

import app from '../app.js';
import { connectMongo, disconnectMongo } from '../database/mongodb.js';
import { signAccessToken } from '../lib/jwt.js';
import { hashPassword } from '../modules/auth/crypto.js';
import { Category } from '../modules/categories/category.model.js';
import { Listing } from '../modules/listings/listing.model.js';
import { Notification } from '../modules/notifications/notification.model.js';
import { Review } from '../modules/reviews/review.model.js';
import { AdminAuditLog } from '../modules/admin/adminAuditLog.model.js';
import { SiteSettings } from '../modules/settings/siteSettings.model.js';
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

describe('Admin API', () => {
  beforeAll(async () => {
    await connectMongo(process.env.MONGODB_URI!);
    await Listing.syncIndexes();
    await Category.syncIndexes();
    await Review.syncIndexes();
    await Notification.syncIndexes();
    await AdminAuditLog.syncIndexes();
    await SiteSettings.syncIndexes();
  });

  afterAll(async () => {
    await AdminAuditLog.deleteMany({});
    await SiteSettings.deleteMany({});
    await Notification.deleteMany({});
    await Review.deleteMany({});
    await Listing.deleteMany({});
    await Category.deleteMany({});
    await User.deleteMany({});
    await disconnectMongo();
  });

  beforeEach(async () => {
    await AdminAuditLog.deleteMany({});
    await SiteSettings.deleteMany({});
    await Notification.deleteMany({});
    await Review.deleteMany({});
    await Listing.deleteMany({});
    await Category.deleteMany({});
    await User.deleteMany({});
  });

  it('GET /api/admin/overview returns 403 for gym_owner', async () => {
    const password = await hashPassword('password12');
    const owner = await User.create({
      email: `own-${Date.now()}@example.com`,
      password,
      firstName: 'G',
      lastName: 'O',
      role: 'gym_owner',
      isEmailVerified: true,
    });
    const token = signAccessToken(String(owner._id), 'gym_owner');
    const res = await request(app)
      .get('/api/admin/overview')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
  });

  it('GET /api/admin/overview returns counts and pending listing rows for admin', async () => {
    const { token } = await seedAdmin();
    const password = await hashPassword('password12');
    const owner = await User.create({
      email: `own-${Date.now()}@example.com`,
      password,
      firstName: 'G',
      lastName: 'O',
      role: 'gym_owner',
      isEmailVerified: true,
    });
    const cat = await Category.create({
      name: { ar: 'أندية', en: 'Gyms' },
      slug: `gyms-adm-${Date.now()}`,
      isActive: true,
      order: 0,
    });
    await Listing.create({
      owner: owner._id,
      category: cat._id,
      name: { ar: 'منشأة معلقة', en: 'Pending venue' },
      slug: `pend-${Date.now()}`,
      description: { ar: 'و', en: 'D' },
      shortDescription: { ar: 'ق', en: 'S' },
      location: baseLocation,
      status: 'pending',
    });
    await Listing.create({
      owner: owner._id,
      category: cat._id,
      name: { ar: 'نشط', en: 'Active one' },
      slug: `act-${Date.now()}`,
      description: { ar: 'و', en: 'D' },
      shortDescription: { ar: 'ق', en: 'S' },
      location: baseLocation,
      status: 'active',
    });

    const res = await request(app)
      .get('/api/admin/overview')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.overview).toBeDefined();
    expect(res.body.overview.totalUsers).toBeGreaterThanOrEqual(2);
    expect(res.body.overview.totalListings).toBe(2);
    expect(res.body.overview.pendingListings).toBe(1);
    expect(res.body.overview.pendingListingRows).toHaveLength(1);
    expect(res.body.overview.pendingListingRows[0].slug).toContain('pend');
    expect(res.body.overview.pendingListingRows[0].ownerEmail).toBe(owner.email);
  });

  it('GET /api/admin/users returns 403 for gym_owner', async () => {
    const password = await hashPassword('password12');
    const u = await User.create({
      email: `u-${Date.now()}@example.com`,
      password,
      firstName: 'A',
      lastName: 'B',
      role: 'gym_owner',
      isEmailVerified: true,
    });
    const token = signAccessToken(String(u._id), 'gym_owner');
    const res = await request(app)
      .get('/api/admin/users')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
  });

  it('GET /api/admin/users lists users for admin', async () => {
    const { token } = await seedAdmin();
    const password = await hashPassword('password12');
    await User.create({
      email: `member-${Date.now()}@example.com`,
      password,
      firstName: 'M',
      lastName: '1',
      role: 'user',
      isEmailVerified: true,
    });
    const res = await request(app)
      .get('/api/admin/users')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.users)).toBe(true);
    expect(res.body.users.length).toBeGreaterThanOrEqual(2);
    expect(res.body.total).toBeGreaterThanOrEqual(2);
  });

  it('PATCH /api/admin/users/:id toggles isActive', async () => {
    const { token } = await seedAdmin();
    const password = await hashPassword('password12');
    const target = await User.create({
      email: `tgt-${Date.now()}@example.com`,
      password,
      firstName: 'T',
      lastName: 'G',
      role: 'user',
      isEmailVerified: true,
      isActive: true,
    });
    const res = await request(app)
      .patch(`/api/admin/users/${String(target._id)}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ isActive: false });
    expect(res.status).toBe(200);
    expect(res.body.user.isActive).toBe(false);
  });

  it('PATCH /api/admin/users/:id returns 403 when admin targets super_admin', async () => {
    const { token } = await seedAdmin();
    const password = await hashPassword('password12');
    const superU = await User.create({
      email: `su-${Date.now()}@example.com`,
      password,
      firstName: 'S',
      lastName: 'U',
      role: 'super_admin',
      isEmailVerified: true,
    });
    const res = await request(app)
      .patch(`/api/admin/users/${String(superU._id)}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ isActive: false });
    expect(res.status).toBe(403);
  });

  it('POST /api/admin/broadcast delivers system announcements', async () => {
    const { token } = await seedAdmin();
    const password = await hashPassword('password12');
    await User.create({
      email: `a-${Date.now()}@example.com`,
      password,
      firstName: 'A',
      lastName: '1',
      role: 'user',
      isEmailVerified: true,
    });
    await User.create({
      email: `b-${Date.now()}@example.com`,
      password,
      firstName: 'B',
      lastName: '2',
      role: 'gym_owner',
      isEmailVerified: true,
    });
    const res = await request(app)
      .post('/api/admin/broadcast')
      .set('Authorization', `Bearer ${token}`)
      .send({
        scope: 'all',
        title: { ar: 'عنوان', en: 'Title' },
        body: { ar: 'نص', en: 'Body text' },
      });
    expect(res.status).toBe(201);
    expect(res.body.recipients).toBeGreaterThanOrEqual(3);
    const count = await Notification.countDocuments({ type: 'system_announcement' });
    expect(count).toBeGreaterThanOrEqual(3);
  });

  it('GET /api/admin/listings returns paginated listings for admin', async () => {
    const { token } = await seedAdmin();
    const password = await hashPassword('password12');
    const owner = await User.create({
      email: `own2-${Date.now()}@example.com`,
      password,
      firstName: 'O',
      lastName: '2',
      role: 'gym_owner',
      isEmailVerified: true,
    });
    const cat = await Category.create({
      name: { ar: 'ف', en: 'C' },
      slug: `c-adm-${Date.now()}`,
      isActive: true,
    });
    await Listing.create({
      owner: owner._id,
      category: cat._id,
      name: { ar: 'ل', en: 'L' },
      slug: `lst-adm-${Date.now()}`,
      description: { ar: 'و', en: 'D' },
      shortDescription: { ar: 'ق', en: 'S' },
      location: baseLocation,
      status: 'active',
      isPremium: true,
    });
    const res = await request(app)
      .get('/api/admin/listings?isPremium=true')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.listings.length).toBeGreaterThanOrEqual(1);
    expect(res.body.listings[0].isPremium).toBe(true);
  });

  it('PATCH /api/admin/reviews/:id/status approves pending review', async () => {
    const { token, user: admin } = await seedAdmin();
    const password = await hashPassword('password12');
    const reviewer = await User.create({
      email: `rev-${Date.now()}@example.com`,
      password,
      firstName: 'R',
      lastName: '1',
      role: 'user',
      isEmailVerified: true,
    });
    const owner = await User.create({
      email: `own3-${Date.now()}@example.com`,
      password,
      firstName: 'O',
      lastName: '3',
      role: 'gym_owner',
      isEmailVerified: true,
    });
    const cat = await Category.create({
      name: { ar: 'ف', en: 'C' },
      slug: `c-rev-${Date.now()}`,
      isActive: true,
    });
    const listing = await Listing.create({
      owner: owner._id,
      category: cat._id,
      name: { ar: 'ل', en: 'L' },
      slug: `lst-rev-${Date.now()}`,
      description: { ar: 'و', en: 'D' },
      shortDescription: { ar: 'ق', en: 'S' },
      location: baseLocation,
      status: 'active',
    });
    const review = await Review.create({
      listing: listing._id,
      user: reviewer._id,
      rating: {
        overall: 5,
        staff: 5,
        cleanliness: 5,
        facilities: 5,
        value: 5,
      },
      title: 'Great',
      content: 'Nice place',
      visitDate: new Date(),
      visitType: 'individual',
      status: 'pending',
    });
    const res = await request(app)
      .patch(`/api/admin/reviews/${String(review._id)}/status`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'approved' });
    expect(res.status).toBe(204);
    const audit = await AdminAuditLog.findOne({
      actorId: admin._id,
      action: 'review.status',
    }).lean();
    expect(audit).toBeTruthy();
  });

  it('POST and PATCH /api/admin/categories works for admin', async () => {
    const { token } = await seedAdmin();
    const createRes = await request(app)
      .post('/api/admin/categories')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: { ar: 'سبا', en: 'Spa' },
        slug: `spa-${Date.now()}`,
        order: 5,
      });
    expect(createRes.status).toBe(201);
    const id = createRes.body.category._id;
    const patchRes = await request(app)
      .patch(`/api/admin/categories/${id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ isActive: false });
    expect(patchRes.status).toBe(200);
    expect(patchRes.body.category.isActive).toBe(false);
  });

  it('GET and PATCH /api/admin/settings returns singleton', async () => {
    const { token } = await seedAdmin();
    const getRes = await request(app)
      .get('/api/admin/settings')
      .set('Authorization', `Bearer ${token}`);
    expect(getRes.status).toBe(200);
    expect(getRes.body.settings.reviewsRequireModeration).toBe(false);
    const patchRes = await request(app)
      .patch('/api/admin/settings')
      .set('Authorization', `Bearer ${token}`)
      .send({ reviewsRequireModeration: true });
    expect(patchRes.status).toBe(200);
    expect(patchRes.body.settings.reviewsRequireModeration).toBe(true);
  });
});
