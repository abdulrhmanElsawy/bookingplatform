import request from 'supertest';

import app from '../app.js';
import { connectMongo, disconnectMongo } from '../database/mongodb.js';
import { signAccessToken } from '../lib/jwt.js';
import { hashPassword } from '../modules/auth/crypto.js';
import { Notification } from '../modules/notifications/notification.model.js';
import { SimulatedPayment } from '../modules/payments/payment.model.js';
import { User } from '../modules/users/user.model.js';

describe('Payments API (simulated)', () => {
  beforeAll(async () => {
    await connectMongo(process.env.MONGODB_URI!);
    await SimulatedPayment.syncIndexes();
    await Notification.syncIndexes();
  });

  afterAll(async () => {
    await SimulatedPayment.deleteMany({});
    await Notification.deleteMany({});
    await User.deleteMany({});
    await disconnectMongo();
  });

  beforeEach(async () => {
    await SimulatedPayment.deleteMany({});
    await Notification.deleteMany({});
    await User.deleteMany({});
  });

  it('GET /api/payments/plans returns catalog without auth', async () => {
    const res = await request(app).get('/api/payments/plans');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.plans)).toBe(true);
    expect(res.body.plans.length).toBe(4);
    const keys = res.body.plans.map((p: { key: string }) => p.key).sort();
    expect(keys).toEqual(['basic', 'enterprise', 'free', 'pro']);
  });

  it('POST /api/payments/simulate returns 401 without token', async () => {
    const res = await request(app)
      .post('/api/payments/simulate')
      .send({ planKey: 'basic' });
    expect(res.status).toBe(401);
  });

  it('POST /api/payments/simulate returns 403 for regular user', async () => {
    const password = await hashPassword('password12');
    const u = await User.create({
      email: `u-${Date.now()}@example.com`,
      password,
      firstName: 'U',
      lastName: '1',
      role: 'user',
      isEmailVerified: true,
    });
    const token = signAccessToken(String(u._id), 'user');
    const res = await request(app)
      .post('/api/payments/simulate')
      .set('Authorization', `Bearer ${token}`)
      .send({ planKey: 'basic' });
    expect(res.status).toBe(403);
  });

  it('POST /api/payments/simulate creates transaction for gym_owner', async () => {
    const password = await hashPassword('password12');
    const owner = await User.create({
      email: `go-${Date.now()}@example.com`,
      password,
      firstName: 'G',
      lastName: 'O',
      role: 'gym_owner',
      isEmailVerified: true,
    });
    const token = signAccessToken(String(owner._id), 'gym_owner');
    const res = await request(app)
      .post('/api/payments/simulate')
      .set('Authorization', `Bearer ${token}`)
      .send({ planKey: 'pro' });
    expect(res.status).toBe(201);
    expect(res.body.transaction.planKey).toBe('pro');
    expect(res.body.transaction.amount).toBe(199);
    const count = await SimulatedPayment.countDocuments({ user: owner._id });
    expect(count).toBe(1);
  });

  it('GET /api/payments/transactions lists gym_owner payments', async () => {
    const password = await hashPassword('password12');
    const owner = await User.create({
      email: `go-${Date.now()}@example.com`,
      password,
      firstName: 'G',
      lastName: 'O',
      role: 'gym_owner',
      isEmailVerified: true,
    });
    const token = signAccessToken(String(owner._id), 'gym_owner');
    await request(app)
      .post('/api/payments/simulate')
      .set('Authorization', `Bearer ${token}`)
      .send({ planKey: 'free' });
    const res = await request(app)
      .get('/api/payments/transactions')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.transactions).toHaveLength(1);
    expect(res.body.transactions[0].planKey).toBe('free');
  });
});
