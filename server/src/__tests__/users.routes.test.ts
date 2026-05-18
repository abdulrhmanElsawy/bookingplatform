import request from 'supertest';

import app from '../app.js';
import { connectMongo, disconnectMongo } from '../database/mongodb.js';
import { signAccessToken } from '../lib/jwt.js';
import { hashPassword } from '../modules/auth/crypto.js';
import { User } from '../modules/users/user.model.js';

describe('Users API', () => {
  beforeAll(async () => {
    await connectMongo(process.env.MONGODB_URI!);
  });

  afterAll(async () => {
    await User.deleteMany({});
    await disconnectMongo();
  });

  beforeEach(async () => {
    await User.deleteMany({});
  });

  it('PATCH /api/users/me/preferences updates language', async () => {
    const password = await hashPassword('password12');
    const user = await User.create({
      email: `u-${Date.now()}@example.com`,
      password,
      firstName: 'A',
      lastName: 'B',
      role: 'user',
      isEmailVerified: true,
    });
    const token = signAccessToken(String(user._id), 'user');

    const res = await request(app)
      .patch('/api/users/me/preferences')
      .set('Authorization', `Bearer ${token}`)
      .send({ language: 'en' })
      .expect(200);

    expect(res.body.user.preferences.language).toBe('en');
    const db = await User.findById(user._id).lean();
    expect(db?.preferences?.language).toBe('en');
  });

  it('PATCH /api/users/me updates name', async () => {
    const password = await hashPassword('password12');
    const user = await User.create({
      email: `u2-${Date.now()}@example.com`,
      password,
      firstName: 'A',
      lastName: 'B',
      role: 'user',
      isEmailVerified: true,
    });
    const token = signAccessToken(String(user._id), 'user');

    const res = await request(app)
      .patch('/api/users/me')
      .set('Authorization', `Bearer ${token}`)
      .send({ firstName: 'Zaid', lastName: 'Tester' })
      .expect(200);

    expect(res.body.user.firstName).toBe('Zaid');
    expect(res.body.user.lastName).toBe('Tester');
  });
});
