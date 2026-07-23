import request from 'supertest';

import app from '../app.js';
import * as transport from '../modules/email/email.transport.js';

const validBody = {
  name: 'Test User',
  email: 'user@example.com',
  subject: 'Need help with booking',
  message: 'This is a test message for the support team.',
};

describe('POST /api/support/contact', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('queues email to SUPPORT_EMAIL on valid submission', async () => {
    const spy = jest.spyOn(transport, 'sendMailDirect').mockResolvedValue();
    const res = await request(app)
      .post('/api/support/contact')
      .set('Accept-Language', 'en')
      .send(validBody)
      .expect(200);

    expect(res.body).toEqual({ ok: true });
    expect(spy).toHaveBeenCalledTimes(1);
    const job = spy.mock.calls[0][0];
    expect(job.to).toBe('support@growth-world.local');
    expect(job.replyTo).toBe(validBody.email);
    expect(job.subject).toContain(validBody.subject);
    expect(job.html).toContain(validBody.message);
  });

  it('returns 400 for invalid payload', async () => {
    const res = await request(app)
      .post('/api/support/contact')
      .send({ ...validBody, message: 'short' })
      .expect(400);

    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('returns 400 when honeypot is filled', async () => {
    const res = await request(app)
      .post('/api/support/contact')
      .send({ ...validBody, website: 'https://spam.example' })
      .expect(400);

    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
});
