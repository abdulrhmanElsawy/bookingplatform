import * as transport from '../email.transport';
import { enqueueEmail } from '../email.queue';
import { sendVerificationEmail } from '../email.service';
import type { EmailJob } from '../email.types';

describe('email.queue direct send', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('enqueueEmail sends mail directly', async () => {
    const spy = jest.spyOn(transport, 'sendMailDirect').mockResolvedValue();
    const job: EmailJob = {
      to: 'a@example.com',
      subject: 'Test',
      html: '<p>hi</p>',
      template: 'verification-code',
      lang: 'en',
    };
    await enqueueEmail(job);
    expect(spy).toHaveBeenCalledWith(job);
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
