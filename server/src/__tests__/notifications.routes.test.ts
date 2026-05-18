import request from 'supertest';

import app from '../app.js';
import { connectMongo, disconnectMongo } from '../database/mongodb.js';
import { signAccessToken } from '../lib/jwt.js';
import { hashPassword } from '../modules/auth/crypto.js';
import { Notification } from '../modules/notifications/notification.model.js';
import { User } from '../modules/users/user.model.js';

describe('Notifications API', () => {
  beforeAll(async () => {
    await connectMongo(process.env.MONGODB_URI!);
  });

  afterAll(async () => {
    await Notification.deleteMany({});
    await User.deleteMany({});
    await disconnectMongo();
  });

  beforeEach(async () => {
    await Notification.deleteMany({});
    await User.deleteMany({});
  });

  async function seedUserWithToken(): Promise<{ token: string; userId: string }> {
    const password = await hashPassword('password12');
    const user = await User.create({
      email: `n-${Date.now()}@example.com`,
      password,
      firstName: 'A',
      lastName: 'B',
      role: 'user',
      isEmailVerified: true,
    });
    const userId = String(user._id);
    const token = signAccessToken(userId, 'user');
    await Notification.create([
      {
        userId: user._id,
        type: 'new_review',
        title: { ar: 'تقييم جديد', en: 'New review' },
        body: { ar: 'محتوى عربي', en: 'English body' },
        read: false,
      },
      {
        userId: user._id,
        type: 'system_announcement',
        title: { ar: 'إعلان', en: 'Announcement' },
        body: { ar: 'نص', en: 'Text' },
        read: true,
      },
    ]);
    return { token, userId };
  }

  it('GET /api/notifications returns bilingual fields and unreadCount', async () => {
    const { token } = await seedUserWithToken();

    const res = await request(app)
      .get('/api/notifications')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body.unreadCount).toBe(1);
    expect(res.body.total).toBe(2);
    expect(res.body.notifications).toHaveLength(2);
    const unread = res.body.notifications.find((n: { read: boolean }) => !n.read);
    expect(unread.title.ar).toBe('تقييم جديد');
    expect(unread.title.en).toBe('New review');
  });

  it('GET /api/notifications/unread-count returns count', async () => {
    const { token } = await seedUserWithToken();

    const res = await request(app)
      .get('/api/notifications/unread-count')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body.unreadCount).toBe(1);
  });

  it('PATCH /api/notifications/:id/read marks one read', async () => {
    const { token, userId } = await seedUserWithToken();
    const n = await Notification.findOne({ userId, read: false }).lean();
    const id = String(n!._id);

    const res = await request(app)
      .patch(`/api/notifications/${id}/read`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body.notification.read).toBe(true);

    const count = await request(app)
      .get('/api/notifications/unread-count')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(count.body.unreadCount).toBe(0);
  });

  it('POST /api/notifications/mark-all-read updates unread', async () => {
    const { token } = await seedUserWithToken();

    await request(app)
      .post('/api/notifications/mark-all-read')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const res = await request(app)
      .get('/api/notifications/unread-count')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(res.body.unreadCount).toBe(0);
  });

  it('DELETE /api/notifications/:id removes notification', async () => {
    const { token, userId } = await seedUserWithToken();
    const n = await Notification.findOne({ userId }).lean();
    const id = String(n!._id);

    await request(app)
      .delete(`/api/notifications/${id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(204);

    const left = await Notification.countDocuments({ userId });
    expect(left).toBe(1);
  });
});
