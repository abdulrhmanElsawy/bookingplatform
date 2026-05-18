import { mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

import request from 'supertest';
import sharp from 'sharp';

import app from '../app.js';
import { loadEnv, resetEnvCache } from '../config/env.js';
import { connectMongo, disconnectMongo } from '../database/mongodb.js';
import { signAccessToken } from '../lib/jwt.js';
import { hashPassword } from '../modules/auth/crypto.js';
import { User } from '../modules/users/user.model.js';

describe('POST /api/uploads/listing-image', () => {
  let tempDir: string;

  beforeAll(async () => {
    tempDir = mkdtempSync(join(tmpdir(), 'gw-upload-route-'));
    resetEnvCache();
    loadEnv({
      UPLOAD_DIR: tempDir,
      PUBLIC_UPLOAD_BASE_URL: 'http://localhost:4000',
    });
    await connectMongo(process.env.MONGODB_URI!);
  });

  afterAll(async () => {
    await User.deleteMany({});
    await disconnectMongo();
    rmSync(tempDir, { recursive: true, force: true });
    resetEnvCache();
  });

  async function ownerBearer(): Promise<string> {
    const email = `owner-${Date.now()}@example.com`;
    const user = await User.create({
      email,
      password: await hashPassword('password12'),
      firstName: 'Gym',
      lastName: 'Owner',
      role: 'gym_owner',
      isEmailVerified: true,
    });
    return signAccessToken(String(user._id), 'gym_owner');
  }

  it('returns 201 with local disk url for gym_owner', async () => {
    const token = await ownerBearer();
    const png = await sharp({
      create: { width: 64, height: 64, channels: 3, background: '#336699' },
    })
      .png()
      .toBuffer();

    const res = await request(app)
      .post('/api/uploads/listing-image')
      .set('Authorization', `Bearer ${token}`)
      .field('altAr', 'صورة')
      .field('altEn', 'Photo')
      .attach('file', png, { filename: 'venue.png', contentType: 'image/png' })
      .expect(201);

    expect(res.body.image.url).toMatch(
      /^http:\/\/localhost:4000\/uploads\/listings\/[0-9a-f-]{36}\.webp$/,
    );
    expect(res.body.image.publicId).toMatch(/^listings\/[0-9a-f-]{36}\.webp$/);
    expect(res.body.image.alt).toEqual({ ar: 'صورة', en: 'Photo' });

    await request(app).get(new URL(res.body.image.url).pathname).expect(200);
  });

  it('returns 401 without auth', async () => {
    const png = await sharp({
      create: { width: 32, height: 32, channels: 3, background: '#000' },
    })
      .png()
      .toBuffer();

    await request(app)
      .post('/api/uploads/listing-image')
      .attach('file', png, { filename: 'x.png', contentType: 'image/png' })
      .field('altAr', 'أ')
      .field('altEn', 'B')
      .expect(401);
  });
});
