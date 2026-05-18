import { enqueueEmail } from './email.queue.js';
import type { EmailJob, EmailLang, EmailUser } from './email.types.js';
import { renderTemplate } from './templateEngine.js';

function langSuffix(lang: EmailLang): string {
  return lang;
}

function buildJob(
  user: EmailUser,
  templateBase: string,
  subjectAr: string,
  subjectEn: string,
  vars: Record<string, string | number | undefined>,
): EmailJob {
  const lang = user.preferences.language;
  const filename = `${templateBase}.${langSuffix(lang)}.html`;
  const html = renderTemplate(filename, vars);
  const subject = lang === 'ar' ? subjectAr : subjectEn;
  return {
    to: user.email,
    subject,
    html,
    template: templateBase,
    lang,
  };
}

export async function sendVerificationEmail(
  user: EmailUser,
  otp: string,
): Promise<void> {
  const job = buildJob(
    user,
    'verification-code',
    'رمز التحقق - Growth World',
    'Verification Code - Growth World',
    {
      otp,
      userName: user.firstName,
    },
  );
  await enqueueEmail(job);
}

export async function sendWelcomeEmail(user: EmailUser): Promise<void> {
  const job = buildJob(
    user,
    'welcome',
    'مرحباً بك في Growth World',
    'Welcome to Growth World',
    {
      userName: user.firstName,
    },
  );
  await enqueueEmail(job);
}

export async function sendPasswordResetEmail(
  user: EmailUser,
  otp: string,
): Promise<void> {
  const job = buildJob(
    user,
    'password-reset',
    'إعادة تعيين كلمة المرور - Growth World',
    'Password reset - Growth World',
    { otp, userName: user.firstName },
  );
  await enqueueEmail(job);
}

export async function sendPasswordChangedEmail(
  user: EmailUser,
  changedAt: string,
): Promise<void> {
  const job = buildJob(
    user,
    'password-changed',
    'تم تغيير كلمة المرور - Growth World',
    'Password changed - Growth World',
    { userName: user.firstName, changedAt },
  );
  await enqueueEmail(job);
}

export async function sendListingApprovedEmail(
  user: EmailUser,
  listingName: string,
): Promise<void> {
  const job = buildJob(
    user,
    'listing-approved',
    'تم اعتماد منشأتك - Growth World',
    'Your listing was approved - Growth World',
    { userName: user.firstName, listingName },
  );
  await enqueueEmail(job);
}

export async function sendListingRejectedEmail(
  user: EmailUser,
  listingName: string,
  reason: string,
): Promise<void> {
  const job = buildJob(
    user,
    'listing-rejected',
    'تم رفض منشأتك - Growth World',
    'Your listing was rejected - Growth World',
    { userName: user.firstName, listingName, reason },
  );
  await enqueueEmail(job);
}

export async function sendNewReviewEmail(
  user: EmailUser,
  listingName: string,
  rating: number,
  reviewerName: string,
): Promise<void> {
  const job = buildJob(
    user,
    'new-review',
    'تقييم جديد على منشأتك - Growth World',
    'New review on your listing - Growth World',
    { userName: user.firstName, listingName, rating, reviewerName },
  );
  await enqueueEmail(job);
}

export async function sendSubscriptionConfirmedEmail(
  user: EmailUser,
  amount: string,
  currency: string,
  accessCode?: string,
  venueName?: string,
): Promise<void> {
  const job = buildJob(
    user,
    'subscription-confirmed',
    'تم تأكيد الدفع - Growth World',
    'Payment confirmed - Growth World',
    { userName: user.firstName, amount, currency, accessCode, venueName },
  );
  await enqueueEmail(job);
}
