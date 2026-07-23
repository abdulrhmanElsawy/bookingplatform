export type EmailLang = 'ar' | 'en';

export interface EmailUser {
  email: string;
  firstName: string;
  preferences: { language: EmailLang };
}

export interface EmailJob {
  to: string;
  subject: string;
  html: string;
  template: string;
  lang: EmailLang;
  replyTo?: string;
}
