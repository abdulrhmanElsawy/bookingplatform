import request from 'supertest';

import app from '../app';

describe('API foundation', () => {
  it('GET /api/health returns ok', async () => {
    const res = await request(app).get('/api/health').expect(200);
    expect(res.body).toEqual({ status: 'ok' });
  });

  it('returns Arabic notFound by default', async () => {
    const res = await request(app).get('/api/does-not-exist').expect(404);
    expect(res.body.error.message).toBe('الصفحة غير موجودة');
  });

  it('returns English notFound when Accept-Language is en', async () => {
    const res = await request(app)
      .get('/api/missing')
      .set('Accept-Language', 'en-US')
      .expect(404);
    expect(res.body.error.message).toBe('Page not found');
  });

  it('error handler uses Arabic server message by default', async () => {
    const res = await request(app).get('/api/test-boom').expect(500);
    expect(res.body.error.message).toBe('حدث خطأ في الخادم');
  });

  it('error handler uses English server message when Accept-Language is en', async () => {
    const res = await request(app)
      .get('/api/test-boom')
      .set('Accept-Language', 'en')
      .expect(500);
    expect(res.body.error.message).toBe('Internal server error');
  });

  it('serves Swagger UI at /api/docs', async () => {
    const res = await request(app).get('/api/docs/').expect(200);
    expect(res.text).toContain('swagger');
  });
});
