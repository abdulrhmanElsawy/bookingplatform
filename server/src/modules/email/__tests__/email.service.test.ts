import * as transport from '../email.transport';
import { emailQueueDefaultJobOptions } from '../email.queue';
import { sendVerificationEmail } from '../email.service';

describe('email.queue config', () => {
  it('uses three attempts for queued jobs', () => {
    expect(emailQueueDefaultJobOptions.attempts).toBe(3);
  });
});

describe('email.service language selection', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('sends Arabic subject and RTL HTML for ar preference', async () => {
    const spy = jest.spyOn(transport, 'sendMailDirect').mockResolvedValue();
    await sendVerificationEmail(
      {
        email: 'a@example.com',
        firstName: 'خالد',
        preferences: { language: 'ar' },
      },
      '654321',
    );
    expect(spy).toHaveBeenCalledTimes(1);
    const arg = spy.mock.calls[0][0];
    expect(arg.subject).toContain('رمز');
    expect(arg.html).toContain('dir="rtl"');
    expect(arg.lang).toBe('ar');
    expect(arg.to).toBe('a@example.com');
  });

  it('sends English subject and LTR HTML for en preference', async () => {
    const spy = jest.spyOn(transport, 'sendMailDirect').mockResolvedValue();
    await sendVerificationEmail(
      {
        email: 'b@example.com',
        firstName: 'Sara',
        preferences: { language: 'en' },
      },
      '111222',
    );
    const arg = spy.mock.calls[0][0];
    expect(arg.subject.toLowerCase()).toContain('verification');
    expect(arg.html).toContain('dir="ltr"');
    expect(arg.lang).toBe('en');
  });
});
