import request from 'supertest';

import app from '../app';
import { connectMongo, disconnectMongo } from '../database/mongodb.js';
import * as emailService from '../modules/email/email.service.js';
import { User } from '../modules/users/user.model.js';

function uniqueEmail(): string {
  return `user-${Date.now()}-${Math.random().toString(16).slice(2)}@example.com`;
}

const registerPayload = (email: string) => ({
  email,
  password: 'password12',
  confirmPassword: 'password12',
  firstName: 'Test',
  lastName: 'User',
});

describe('Auth routes', () => {
  beforeAll(async () => {
    await connectMongo(process.env.MONGODB_URI!);
  });

  afterAll(async () => {
    await User.deleteMany({});
    await disconnectMongo();
  });

  beforeEach(async () => {
    await User.deleteMany({});
    jest.restoreAllMocks();
    jest.spyOn(emailService, 'sendVerificationEmail').mockResolvedValue();
    jest.spyOn(emailService, 'sendWelcomeEmail').mockResolvedValue();
    jest.spyOn(emailService, 'sendPasswordResetEmail').mockResolvedValue();
    jest.spyOn(emailService, 'sendPasswordChangedEmail').mockResolvedValue();
  });

  it('POST /api/auth/register returns 201 and Arabic success by default', async () => {
    const email = uniqueEmail();
    const res = await request(app)
      .post('/api/auth/register')
      .send(registerPayload(email))
      .expect(201);
    expect(res.body.message).toBe(
      'تم إنشاء الحساب. تحقق من بريدك لتفعيل الحساب.',
    );
    expect(res.body.user.email).toBe(email);
    expect(res.body.user.isEmailVerified).toBe(false);
    expect(emailService.sendVerificationEmail).toHaveBeenCalled();
  });

  it('POST /api/auth/register duplicate returns localized emailExists', async () => {
    const email = uniqueEmail();
    await request(app).post('/api/auth/register').send(registerPayload(email));
    const resAr = await request(app)
      .post('/api/auth/register')
      .send(registerPayload(email))
      .expect(409);
    expect(resAr.body.error.message).toBe('البريد الإلكتروني مستخدم بالفعل');

    const resEn = await request(app)
      .post('/api/auth/register')
      .send(registerPayload(email))
      .set('Accept-Language', 'en')
      .expect(409);
    expect(resEn.body.error.message).toBe('Email address is already in use');
  });

  it('blocks login until email is verified', async () => {
    const email = uniqueEmail();
    await request(app).post('/api/auth/register').send(registerPayload(email));
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email, password: 'password12' })
      .expect(403);
    expect(res.body.error.message).toBe('يرجى تفعيل البريد الإلكتروني أولاً');
  });

  it('verify-email sets cookies and allows /me', async () => {
    const email = uniqueEmail();
    const agent = request.agent(app);
    await agent.post('/api/auth/register').send(registerPayload(email));
    const otp = (emailService.sendVerificationEmail as jest.Mock).mock
      .calls[0][1] as string;

    await agent
      .post('/api/auth/verify-email')
      .send({ email, code: '000000' })
      .expect(400);

    const verifyRes = await agent
      .post('/api/auth/verify-email')
      .send({ email, code: otp })
      .expect(200);
    expect(verifyRes.headers['set-cookie']).toEqual(
      expect.arrayContaining([
        expect.stringContaining('gw_access_token='),
        expect.stringContaining('gw_refresh_token='),
      ]),
    );

    const me = await agent.get('/api/auth/me').expect(200);
    expect(me.body.user.email).toBe(email);
    expect(me.body.user.isEmailVerified).toBe(true);
  });

  it('POST /api/auth/login sets cookies after verified user', async () => {
    const email = uniqueEmail();
    await request(app).post('/api/auth/register').send(registerPayload(email));
    const otp = (emailService.sendVerificationEmail as jest.Mock).mock
      .calls[0][1] as string;
    await request(app)
      .post('/api/auth/verify-email')
      .send({ email, code: otp });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email, password: 'password12' })
      .expect(200);
    expect(res.body.message).toBe('تم تسجيل الدخول بنجاح.');
    expect(res.headers['set-cookie']).toEqual(
      expect.arrayContaining([
        expect.stringContaining('gw_access_token='),
        expect.stringContaining('gw_refresh_token='),
      ]),
    );
  });

  it('POST /api/auth/refresh rotates session when cookies are sent', async () => {
    const email = uniqueEmail();
    const agent = request.agent(app);
    await agent.post('/api/auth/register').send(registerPayload(email));
    const otp = (emailService.sendVerificationEmail as jest.Mock).mock
      .calls[0][1] as string;
    await agent.post('/api/auth/verify-email').send({ email, code: otp });

    const refreshRes = await agent.post('/api/auth/refresh').expect(200);
    expect(refreshRes.body.message).toBe('تم تحديث الجلسة.');
    expect(refreshRes.headers['set-cookie']).toBeDefined();
  });

  it('POST /api/auth/logout clears cookies (optional auth)', async () => {
    const res = await request(app).post('/api/auth/logout').expect(200);
    expect(res.body.message).toBe('تم تسجيل الخروج بنجاح.');
  });

  it('forgot-password and reset-password flow', async () => {
    const email = uniqueEmail();
    await request(app).post('/api/auth/register').send(registerPayload(email));
    const regOtp = (emailService.sendVerificationEmail as jest.Mock).mock
      .calls[0][1] as string;
    await request(app)
      .post('/api/auth/verify-email')
      .send({ email, code: regOtp });

    jest.spyOn(emailService, 'sendPasswordResetEmail').mockResolvedValue();

    await request(app)
      .post('/api/auth/forgot-password')
      .send({ email })
      .expect(200);

    const resetOtp = (emailService.sendPasswordResetEmail as jest.Mock).mock
      .calls[0][1] as string;

    await request(app)
      .post('/api/auth/reset-password')
      .send({
        email,
        code: resetOtp,
        newPassword: 'newpass1234',
        confirmNewPassword: 'newpass1234',
      })
      .expect(200);

    await request(app)
      .post('/api/auth/login')
      .send({ email, password: 'password12' })
      .expect(401);

    await request(app)
      .post('/api/auth/login')
      .send({ email, password: 'newpass1234' })
      .expect(200);
  });

  it('POST /api/auth/resend-verification rejects already verified', async () => {
    const email = uniqueEmail();
    await request(app).post('/api/auth/register').send(registerPayload(email));
    const otp = (emailService.sendVerificationEmail as jest.Mock).mock
      .calls[0][1] as string;
    await request(app)
      .post('/api/auth/verify-email')
      .send({ email, code: otp });

    const res = await request(app)
      .post('/api/auth/resend-verification')
      .send({ email })
      .expect(400);
    expect(res.body.error.message).toBe('البريد الإلكتروني مفعّل بالفعل');
  });

  it('POST /api/auth/change-password requires auth', async () => {
    await request(app)
      .post('/api/auth/change-password')
      .send({
        currentPassword: 'password12',
        newPassword: 'newpass1234',
        confirmNewPassword: 'newpass1234',
      })
      .expect(401);
  });

  it('PATCH /api/auth/account-type updates role for verified session', async () => {
    const email = uniqueEmail();
    const agent = request.agent(app);
    await agent.post('/api/auth/register').send(registerPayload(email));
    const otp = (emailService.sendVerificationEmail as jest.Mock).mock
      .calls[0][1] as string;
    await agent.post('/api/auth/verify-email').send({ email, code: otp });
    const res = await agent
      .patch('/api/auth/account-type')
      .send({ role: 'gym_owner' })
      .expect(200);
    expect(res.body.user.role).toBe('gym_owner');
  });
});
