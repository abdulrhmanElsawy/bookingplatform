# 📋 Growth World — Full Build Task List
# Complete Feature Specification for Cursor AI

> **Instructions**: Work through tasks sequentially. Each task = one focused implementation unit.
> After each task: run tests, fix errors, commit with a descriptive message.
> Never skip a task. Never mark done without tests passing.
> **Arabic is the primary language. Every UI string must come from translation files. Zero hardcoded text.**

---

## PHASE 0 — Project Scaffolding & Architecture

### TASK-001: Initialize Monorepo Structure
```
growth-world/
├── client/                    # React + Vite frontend
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   │   ├── shared/        # Reusable UI components
│   │   │   └── layout/        # Header, Footer, Sidebar
│   │   ├── features/          # Feature modules
│   │   │   ├── auth/
│   │   │   ├── listings/
│   │   │   ├── search/
│   │   │   ├── reviews/
│   │   │   ├── favorites/
│   │   │   ├── notifications/
│   │   │   ├── dashboard/
│   │   │   ├── admin/
│   │   │   ├── profile/
│   │   │   └── payments/
│   │   ├── hooks/             # Global hooks (useLanguage, useSEO, etc.)
│   │   ├── i18n/              # Translation files and i18next config
│   │   │   ├── index.ts
│   │   │   └── locales/
│   │   │       ├── ar/        # Arabic (PRIMARY)
│   │   │       └── en/        # English (secondary)
│   │   ├── services/          # API service layer
│   │   ├── store/             # Zustand stores
│   │   ├── styles/            # Global CSS, tokens, variables
│   │   ├── types/             # Global TypeScript types
│   │   ├── utils/             # Helpers, formatters (number/date/currency)
│   │   ├── router/            # React Router config
│   │   └── __tests__/         # Global test utilities
│   ├── public/
│   ├── index.html             # Preload Tajawal + Inter fonts here
│   ├── vite.config.ts
│   ├── tsconfig.json
│   └── jest.config.ts
│
├── server/                    # Node.js + Express backend
│   ├── src/
│   │   ├── config/
│   │   ├── i18n/              # Server-side error message translations
│   │   │   ├── ar.json        # Arabic error messages (DEFAULT)
│   │   │   └── en.json        # English error messages
│   │   ├── middleware/
│   │   ├── modules/
│   │   │   ├── auth/
│   │   │   ├── users/
│   │   │   ├── listings/
│   │   │   ├── categories/
│   │   │   ├── reviews/
│   │   │   ├── favorites/
│   │   │   ├── notifications/
│   │   │   ├── admin/
│   │   │   ├── payments/
│   │   │   └── analytics/
│   │   ├── shared/
│   │   ├── types/
│   │   └── app.ts
│   ├── tests/
│   ├── .env.example
│   ├── tsconfig.json
│   └── jest.config.ts
│
├── shared/                    # Shared types and Zod schemas (used by both)
│   ├── schemas/
│   └── types/
│       └── common.ts          # BilingualField interface lives here
│
├── docker-compose.yml
└── README.md
```

**Steps:**
1. `npm create vite@latest client -- --template react-ts`
2. Initialize `server/` with `npm init -y` + TypeScript config
3. Set up `shared/` package — define `BilingualField` type immediately
4. Configure `docker-compose.yml` with MongoDB + Redis services
5. Set up root `package.json` with workspace scripts
6. Install i18n packages in client: `react-i18next`, `i18next`, `i18next-browser-languagedetector`
7. Configure ESLint + Prettier for both client and server
8. Set up Husky pre-commit hooks (lint + test)
9. Create `.env.example` files for both client and server
10. In `client/index.html`: add Google Fonts preconnect + Tajawal (300,400,500,700,900) + Inter font link tags with `font-display=swap`
11. Set `<html lang="ar" dir="rtl">` as the default in `index.html` (Arabic/RTL first)

---

### TASK-002: i18n Setup & Translation Files

**Install:** `react-i18next`, `i18next`, `i18next-browser-languagedetector`

**Create `client/src/i18n/index.ts`** — full config as specified in CURSOR_PROMPT.md (Arabic default, fallback to Arabic)

**Create ALL translation JSON files** — both `ar/` and `en/` namespaces:

**`ar/common.json` (Arabic — PRIMARY, fill these first):**
```json
{
  "appName": "Growth World | عالم النمو",
  "tagline": "منصتك الرياضية المتكاملة في المملكة العربية السعودية",
  "search": "بحث",
  "searchPlaceholder": "ابحث عن نادٍ، ملعب، نشاط...",
  "viewDetails": "عرض التفاصيل",
  "viewAll": "عرض الكل",
  "save": "حفظ",
  "cancel": "إلغاء",
  "delete": "حذف",
  "edit": "تعديل",
  "confirm": "تأكيد",
  "loading": "جارٍ التحميل...",
  "noResults": "لا توجد نتائج",
  "error": "حدث خطأ",
  "retry": "إعادة المحاولة",
  "back": "رجوع",
  "next": "التالي",
  "previous": "السابق",
  "submit": "إرسال",
  "close": "إغلاق",
  "language": "اللغة",
  "arabic": "العربية",
  "english": "English",
  "riyal": "ر.س",
  "from": "من",
  "perMonth": "/ شهر",
  "verified": "موثّق",
  "featured": "مميز",
  "new": "جديد",
  "popular": "الأكثر طلباً",
  "rating": "التقييم",
  "reviews": "التقييمات",
  "review_one": "{{count}} تقييم",
  "review_other": "{{count}} تقييمات",
  "noReviews": "لا توجد تقييمات بعد",
  "home": "الرئيسية",
  "categories": "الفئات",
  "cities": "المدن",
  "about": "من نحن",
  "contact": "اتصل بنا",
  "profile": "الملف الشخصي",
  "dashboard": "لوحة التحكم",
  "adminPanel": "لوحة الإدارة",
  "logout": "تسجيل الخروج",
  "login": "تسجيل الدخول",
  "register": "إنشاء حساب",
  "favorites": "المفضلة",
  "notifications": "الإشعارات",
  "settings": "الإعدادات",
  "active": "مفعّل",
  "inactive": "غير مفعّل",
  "pending": "قيد المراجعة",
  "approved": "معتمد",
  "rejected": "مرفوض",
  "suspended": "موقوف",
  "draft": "مسودة",
  "today": "اليوم",
  "yesterday": "أمس",
  "thisWeek": "هذا الأسبوع",
  "thisMonth": "هذا الشهر"
}
```

**`en/common.json` (English — mirror structure):**
```json
{
  "appName": "Growth World",
  "tagline": "Your Integrated Sports Platform in Saudi Arabia",
  "search": "Search",
  "searchPlaceholder": "Search gyms, courts, activities...",
  "viewDetails": "View Details",
  "viewAll": "View All",
  "save": "Save",
  "cancel": "Cancel",
  "delete": "Delete",
  "edit": "Edit",
  "confirm": "Confirm",
  "loading": "Loading...",
  "noResults": "No results found",
  "error": "An error occurred",
  "retry": "Retry",
  "back": "Back",
  "next": "Next",
  "previous": "Previous",
  "submit": "Submit",
  "close": "Close",
  "language": "Language",
  "arabic": "العربية",
  "english": "English",
  "riyal": "SAR",
  "from": "From",
  "perMonth": "/ month",
  "verified": "Verified",
  "featured": "Featured",
  "new": "New",
  "popular": "Popular",
  "rating": "Rating",
  "reviews": "Reviews",
  "review_one": "{{count}} review",
  "review_other": "{{count}} reviews",
  "noReviews": "No reviews yet",
  "home": "Home",
  "categories": "Categories",
  "cities": "Cities",
  "about": "About Us",
  "contact": "Contact",
  "profile": "Profile",
  "dashboard": "Dashboard",
  "adminPanel": "Admin Panel",
  "logout": "Logout",
  "login": "Sign In",
  "register": "Create Account",
  "favorites": "Favorites",
  "notifications": "Notifications",
  "settings": "Settings",
  "active": "Active",
  "inactive": "Inactive",
  "pending": "Pending",
  "approved": "Approved",
  "rejected": "Rejected",
  "suspended": "Suspended",
  "draft": "Draft",
  "today": "Today",
  "yesterday": "Yesterday",
  "thisWeek": "This Week",
  "thisMonth": "This Month"
}
```

**Create complete `ar/auth.json` and `en/auth.json`** with all auth screen strings.
**Create complete `ar/listings.json` and `en/listings.json`** with all listing/search strings.
**Create remaining namespaces** (reviews, dashboard, admin, profile, notifications, payments, errors) in both languages.

**Create `client/src/hooks/useLanguage.ts`** — the single source of truth for language switching (see CURSOR_PROMPT.md spec).

**Create `client/src/utils/formatters.ts`** — number, currency, date, relative-time formatters using `Intl` API for both `ar-SA` and `en-US` locales.

**Write tests for:**
- `useLanguage` hook: language switches, `dir` attribute updates, localStorage persistence
- Formatters: currency in AR (`"١٥٠ ر.س"`), currency in EN (`"SAR 150"`), dates in both locales

---

### TASK-003: Design System & CSS Architecture

**File: `client/src/styles/tokens.css`**
```css
:root {
  /* Brand Colors — Booking.com inspired */
  --color-primary: #003580;
  --color-primary-light: #0057b8;
  --color-primary-dark: #00224f;
  --color-accent: #FF6B35;
  --color-accent-light: #FF8C5A;
  --color-success: #008234;
  --color-warning: #FFC107;
  --color-danger: #CC0000;
  --color-info: #0077CC;

  /* Neutrals */
  --color-white: #FFFFFF;
  --color-gray-50: #F8F9FA;
  --color-gray-100: #F1F3F5;
  --color-gray-200: #E9ECEF;
  --color-gray-300: #DEE2E6;
  --color-gray-400: #CED4DA;
  --color-gray-500: #ADB5BD;
  --color-gray-600: #6C757D;
  --color-gray-700: #495057;
  --color-gray-800: #343A40;
  --color-gray-900: #212529;
  --color-black: #000000;

  /* Typography — Tajawal is PRIMARY */
  --font-arabic: 'Tajawal', sans-serif;
  --font-english: 'Inter', 'Tajawal', sans-serif;
  --font-primary: var(--font-arabic);       /* Default: Tajawal */
  --font-mono: 'JetBrains Mono', monospace;

  /* Line heights — Arabic needs more space */
  --line-height-ar: 1.8;
  --line-height-en: 1.6;
  --line-height-body: var(--line-height-ar);

  /* Font sizes */
  --text-xs: 0.75rem;
  --text-sm: 0.875rem;
  --text-base: 1rem;
  --text-lg: 1.125rem;
  --text-xl: 1.25rem;
  --text-2xl: 1.5rem;
  --text-3xl: 1.875rem;
  --text-4xl: 2.25rem;

  /* Font weights */
  --font-light: 300;
  --font-normal: 400;
  --font-medium: 500;
  --font-bold: 700;
  --font-black: 900;

  /* Spacing */
  --space-1: 0.25rem;
  --space-2: 0.5rem;
  --space-3: 0.75rem;
  --space-4: 1rem;
  --space-5: 1.25rem;
  --space-6: 1.5rem;
  --space-8: 2rem;
  --space-10: 2.5rem;
  --space-12: 3rem;
  --space-16: 4rem;
  --space-20: 5rem;

  /* Border Radius */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-xl: 16px;
  --radius-full: 9999px;

  /* Shadows */
  --shadow-sm: 0 1px 3px rgba(0,0,0,0.08);
  --shadow-md: 0 4px 12px rgba(0,0,0,0.1);
  --shadow-lg: 0 8px 24px rgba(0,0,0,0.12);
  --shadow-xl: 0 16px 48px rgba(0,0,0,0.16);
  --shadow-card: 0 2px 8px rgba(0,53,128,0.08);

  /* Transitions */
  --transition-fast: 150ms ease;
  --transition-base: 250ms ease;
  --transition-slow: 350ms ease;

  /* Z-index layers */
  --z-dropdown: 100;
  --z-sticky: 200;
  --z-modal: 300;
  --z-notification: 400;
  --z-tooltip: 500;
}

/* Switch to English font stack when language is English */
[data-lang="en"] {
  --font-primary: var(--font-english);
  --line-height-body: var(--line-height-en);
}
```

**File: `client/src/styles/global.css`**
```css
@import './tokens.css';
@import './animations.css';

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

/* Tajawal is the universal default font */
html {
  font-family: var(--font-arabic);
  font-size: 16px;
  scroll-behavior: smooth;
}

body {
  font-family: var(--font-primary);
  line-height: var(--line-height-body);
  color: var(--color-gray-900);
  background-color: var(--color-white);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* English font override */
[data-lang="en"] body {
  font-family: var(--font-primary);  /* resolves to Inter in EN */
}

/* Always use Tajawal for Arabic text, even in EN mode */
:lang(ar) {
  font-family: var(--font-arabic);
}

/* Direction-aware scrollbar */
[dir="rtl"] ::-webkit-scrollbar { /* RTL scrollbar on left side handled by browser */ }

/* Directional icon flip — applies globally to marked icons */
[dir="rtl"] .flip-rtl {
  transform: scaleX(-1);
}

/* Focus ring */
:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

/* Selection color */
::selection {
  background-color: var(--color-primary);
  color: var(--color-white);
}
```

**File: `client/src/styles/animations.css`** — keyframe animations:
- `skeletonPulse` — skeleton shimmer effect
- `fadeIn` — opacity 0→1
- `slideUp` — translateY(16px)→0 + fadeIn
- `slideInStart` — slides from inline-start (works in both RTL/LTR)
- `slideInEnd` — slides from inline-end

**File: `client/src/styles/typography.css`** — heading hierarchy using Tajawal weights

**Write tests for:** CSS token values accessible via `getComputedStyle`, font-family switches on `[data-lang]` attribute change

---

### TASK-004: Backend Foundation
1. Set up Express app with all middleware:
   - `helmet()` — security headers
   - `cors()` — configured with allowed origins from env
   - `express-rate-limit` — 100 req/15min general, 10 req/15min on auth routes
   - `express-mongo-sanitize()` — NoSQL injection prevention
   - `morgan` — request logging
   - `compression()` — gzip
   - **`languageMiddleware`** — reads `Accept-Language` header, attaches `req.lang = 'ar' | 'en'` (defaults to `'ar'`)
2. MongoDB connection with Mongoose (retry logic, connection events)
3. Redis connection for session/cache
4. Environment validation with Zod on startup
5. Global error handler middleware — returns error messages in `req.lang`
6. 404 handler — message in `req.lang`
7. Swagger setup at `/api/docs`
8. Health check endpoint: `GET /api/health`

**Server-side i18n error messages:**
```json
// server/src/i18n/ar.json
{
  "notFound": "الصفحة غير موجودة",
  "unauthorized": "غير مصرح لك بالوصول",
  "forbidden": "ليس لديك صلاحية",
  "validationError": "خطأ في البيانات المدخلة",
  "serverError": "حدث خطأ في الخادم",
  "emailExists": "البريد الإلكتروني مستخدم بالفعل",
  "invalidCredentials": "البريد الإلكتروني أو كلمة المرور غير صحيحة",
  "accountLocked": "تم تعليق الحساب مؤقتاً، حاول مرة أخرى بعد {{minutes}} دقيقة",
  "otpExpired": "انتهت صلاحية الرمز، يرجى طلب رمز جديد",
  "otpInvalid": "الرمز غير صحيح",
  "emailNotVerified": "يرجى تفعيل البريد الإلكتروني أولاً"
}
```
```json
// server/src/i18n/en.json
{
  "notFound": "Page not found",
  "unauthorized": "Unauthorized access",
  "forbidden": "You do not have permission",
  "validationError": "Validation error",
  "serverError": "Internal server error",
  "emailExists": "Email address is already in use",
  "invalidCredentials": "Invalid email or password",
  "accountLocked": "Account temporarily locked. Try again in {{minutes}} minutes",
  "otpExpired": "OTP has expired. Please request a new one",
  "otpInvalid": "Invalid OTP code",
  "emailNotVerified": "Please verify your email address first"
}
```

**Write tests for:** Error handler returns Arabic messages by default, English when `Accept-Language: en` sent, health endpoint

---

### TASK-005: Shared Zod Schemas

Create `shared/schemas/` with bilingual-aware schemas:

```typescript
// shared/schemas/common.ts
export const BilingualFieldSchema = z.object({
  ar: z.string().min(1, 'Arabic text required'),
  en: z.string().min(1, 'English text required'),
});

// shared/types/common.ts
export interface BilingualField {
  ar: string;
  en: string;
}

// Utility: get field value in current language
export const getLocalizedValue = (
  field: BilingualField,
  lang: 'ar' | 'en'
): string => field[lang] || field.ar; // always fallback to Arabic
```

Create remaining schemas:
- `authSchemas.ts` — login, register (firstName/lastName bilingual not required), OTP, password reset
- `listingSchemas.ts` — create/update listing (name, description, city all BilingualField), search query
- `reviewSchemas.ts` — create review, reply
- `userSchemas.ts` — update profile, preferences (language: `'ar' | 'en'`)
- `notificationSchemas.ts`
- `paymentSchemas.ts`

---

## PHASE 1 — Authentication System

### TASK-006: User Model & Auth Middleware

**MongoDB User Model:**
```typescript
_id, email, password (hashed), firstName, lastName, phone, avatar,
role: enum['guest','user','gym_owner','admin','super_admin'],
isEmailVerified, emailVerificationCode, emailVerificationExpiry,
passwordResetCode, passwordResetExpiry, passwordResetAttempts,
refreshTokens: [{ token, device, createdAt, expiresAt }],
lastLogin, loginAttempts, lockUntil,
preferences: {
  language: { type: String, enum: ['ar', 'en'], default: 'ar' },  // Arabic default
  currency: { type: String, default: 'SAR' },
  notifications: { email: Boolean, inApp: Boolean }
},
isActive, isDeleted,
createdAt, updatedAt
```

**Middleware:**
- `authenticate.ts` — verify JWT, attach `req.user`
- `authorize.ts` — role-based access: `authorize('admin', 'super_admin')`
- `refreshToken.ts` — refresh token rotation
- `optionalAuth.ts` — attach user if logged in, don't fail if not
- **`languageMiddleware.ts`** — reads `Accept-Language` header, defaults to `'ar'`

**Write tests for:** All middleware with mocked tokens; test that language defaults to 'ar'

---

### TASK-007: Email Service & Bilingual Templates

**Nodemailer setup** with queue (Bull/Redis), retry logic (3 attempts).

**HTML Email Templates — ALL must be fully bilingual (Arabic primary, English below):**

Each template includes:
- Arabic content at the top (right-to-left section, Tajawal font via inline CSS)
- English content below (left-to-right section, system font)
- OR: send language-specific email based on user's `preferences.language`
- **Recommended: language-specific emails** — detect user's language preference and send in their language only

**Template language implementation:**
```typescript
// emailService.ts
const sendVerificationEmail = async (user: User, otp: string) => {
  const lang = user.preferences.language; // 'ar' or 'en'
  const template = await renderTemplate(`verification-code.${lang}.html`, { otp, userName: user.firstName });
  await send({ to: user.email, subject: lang === 'ar' ? 'رمز التحقق - Growth World' : 'Verification Code - Growth World', html: template });
};
```

**Email templates to create (each in `ar` and `en` versions):**
1. `verification-code.ar.html` / `verification-code.en.html` — OTP email
2. `welcome.ar.html` / `welcome.en.html` — Post-registration welcome
3. `password-reset.ar.html` / `password-reset.en.html` — Password reset OTP
4. `password-changed.ar.html` / `password-changed.en.html` — Security alert
5. `listing-approved.ar.html` / `listing-approved.en.html` — Listing approved
6. `listing-rejected.ar.html` / `listing-rejected.en.html` — Listing rejected with reason
7. `new-review.ar.html` / `new-review.en.html` — New review received
8. `subscription-confirmed.ar.html` / `subscription-confirmed.en.html` — Payment confirmed

**Arabic email template requirements:**
- `dir="rtl"` on the container `<div>`
- `font-family: 'Tajawal', Arial, sans-serif` via inline style (Google Fonts won't load in email clients)
- `text-align: right`

**Write tests for:** Email sent in user's preferred language, template rendering

---

### TASK-008: Auth API Routes

All API error responses use `req.lang` to return messages in the user's language.

**Endpoints:**
```
POST /api/auth/register
  - Validate input (Zod)
  - Check email uniqueness
  - Hash password (bcrypt, 12 rounds)
  - Set preferences.language = req.lang (detected from header)
  - Generate 6-digit OTP, store hashed with 15-min expiry
  - Send verification email in user's language
  - Return: { message (in req.lang), userId }

POST /api/auth/verify-email
  - Validate OTP
  - Mark email verified
  - Generate JWT (15m) + refresh token (7d)
  - Set httpOnly cookies
  - Send welcome email in user's language
  - Return: { user, accessToken }

POST /api/auth/resend-verification
  - Rate limited: max 3 per hour per email
  - Return: { message (in req.lang) }

POST /api/auth/login
  - Check account, validate password
  - Return: { user (with preferences.language), accessToken }

POST /api/auth/logout
POST /api/auth/refresh
POST /api/auth/forgot-password
POST /api/auth/reset-password
GET /api/auth/me
POST /api/auth/change-password
```

**Write tests for:** Every endpoint; verify Arabic error messages returned by default

---

### TASK-009: Auth Frontend — Register Flow

**All text via `useTranslation('auth')`** — zero hardcoded strings.

**`ar/auth.json`** (fill completely):
```json
{
  "registerTitle": "إنشاء حساب جديد",
  "registerSubtitle": "انضم إلى مجتمع Growth World الرياضي",
  "firstName": "الاسم الأول",
  "lastName": "اسم العائلة",
  "email": "البريد الإلكتروني",
  "phone": "رقم الجوال",
  "password": "كلمة المرور",
  "confirmPassword": "تأكيد كلمة المرور",
  "alreadyHaveAccount": "لديك حساب بالفعل؟",
  "loginLink": "تسجيل الدخول",
  "step1Title": "المعلومات الأساسية",
  "step2Title": "تفعيل البريد الإلكتروني",
  "step3Title": "نوع الحساب",
  "otpTitle": "أدخل رمز التحقق",
  "otpSubtitle": "أرسلنا رمزاً مكوناً من 6 أرقام إلى {{email}}",
  "otpResend": "إعادة إرسال الرمز",
  "otpResendIn": "إعادة الإرسال خلال {{seconds}} ثانية",
  "roleUser": "مستخدم",
  "roleUserDesc": "ابحث وقارن الخدمات الرياضية",
  "roleGymOwner": "صاحب نادٍ",
  "roleGymOwnerDesc": "أضف وأدر منشأتك الرياضية",
  "passwordWeak": "ضعيفة",
  "passwordFair": "مقبولة",
  "passwordGood": "جيدة",
  "passwordStrong": "قوية",
  "passwordRequirements": "يجب أن تحتوي كلمة المرور على 8 أحرف على الأقل، وتشمل أحرفاً وأرقاماً",
  "registerSuccess": "تم إنشاء الحساب بنجاح",
  "verificationSent": "تم إرسال رمز التحقق إلى بريدك الإلكتروني"
}
```

**`en/auth.json`** — English mirror.

**Components:**
1. `RegisterPage/` — Multi-step (3 steps): all labels from `t('auth:...')`
2. `OTPInput/` — 6-box input; resend countdown uses `t('auth:otpResendIn', { seconds })`
3. `PasswordStrengthMeter/` — strength labels from `t('auth:passwordWeak')` etc.
4. `RoleSelector/` — role card labels from translation

**CSS: `RegisterPage.module.css`** — use logical CSS properties only. The form layout must look correct in both RTL (Arabic) and LTR (English).

**Write tests for:** OTP input in RTL, form labels in Arabic/English, step transitions

---

### TASK-010: Auth Frontend — Login Flow

**All text via `useTranslation('auth')`.**

**Add to `ar/auth.json`:**
```json
{
  "loginTitle": "تسجيل الدخول",
  "loginSubtitle": "مرحباً بعودتك",
  "rememberMe": "تذكرني",
  "forgotPassword": "نسيت كلمة المرور؟",
  "noAccount": "ليس لديك حساب؟",
  "registerLink": "إنشاء حساب",
  "forgotPasswordTitle": "استعادة كلمة المرور",
  "forgotPasswordSubtitle": "أدخل بريدك الإلكتروني وسنرسل لك رمز الاستعادة",
  "newPasswordTitle": "كلمة المرور الجديدة",
  "resetSuccess": "تم تغيير كلمة المرور بنجاح",
  "accountLocked": "تم تعليق حسابك مؤقتاً بسبب محاولات تسجيل دخول متعددة",
  "invalidCredentials": "البريد الإلكتروني أو كلمة المرور غير صحيحة"
}
```

**Components:**
1. `LoginPage/` — form with `t('auth:loginTitle')`, `t('auth:email')` etc.
2. `ForgotPasswordPage/` — 3-step; all translated
3. `AuthGuard/` — redirects with translated toast message
4. `RoleGuard/` — 403 page with `t('errors:forbidden')`
5. `AuthLayout/` — split layout; hero tagline from `t('common:tagline')`

**LanguageSwitcher component** — must be visible on the AuthLayout:
```tsx
// Shows "AR | EN" toggle — clicking switches full app language
// Use useLanguage() hook for switching
```

**Zustand `useAuthStore`** — stores user with `preferences.language`; on hydration, calls `switchLanguage(user.preferences.language)`

**Write tests for:** Language switch on login (user prefers EN → app switches to EN), auth guards redirect with translated messages

---

## PHASE 2 — Listings System

### TASK-011: Listing & Category Models

**Category Model** — all content fields bilingual:
```typescript
_id,
name: { ar: String, en: String },   // BilingualField
slug: String,
icon: String,
description: { ar: String, en: String },
parentCategory: ref(Category),
image: String,
isActive: Boolean,
order: Number,
listingCount: Number,
seoTitle: { ar: String, en: String },
seoDescription: { ar: String, en: String },
createdAt, updatedAt
```

**Seed categories — with both Arabic and English names:**
```typescript
[
  { name: { ar: 'الأندية الرياضية والصالات', en: 'Gyms & Fitness Centers' }, slug: 'gyms' },
  { name: { ar: 'ملاعب البادل', en: 'Padel Courts' }, slug: 'padel' },
  { name: { ar: 'الملاكمة والفنون القتالية', en: 'Boxing & Martial Arts' }, slug: 'boxing' },
  { name: { ar: 'حمامات السباحة', en: 'Swimming Pools' }, slug: 'swimming' },
  { name: { ar: 'الأنشطة الرياضية', en: 'Sports Activities' }, slug: 'activities' },
  { name: { ar: 'المطاعم الصحية', en: 'Healthy Restaurants' }, slug: 'restaurants' },
  { name: { ar: 'التدريب الشخصي', en: 'Personal Training' }, slug: 'personal-training' },
  { name: { ar: 'إعادة التأهيل الرياضي', en: 'Sports Rehabilitation' }, slug: 'rehabilitation' },
]
```

**Listing Model** — all user-facing content fields bilingual:
```typescript
_id, owner: ref(User), category: ref(Category),
name: { ar: String, en: String },
slug: String,
description: { ar: String, en: String },
shortDescription: { ar: String, en: String },

location: {
  address: { ar: String, en: String },
  city: { ar: String, en: String },
  district: { ar: String, en: String },
  coordinates: { type: 'Point', coordinates: [lng, lat] },
  googleMapsUrl: String,
},

images: [{ url, publicId, isMain, order, alt: { ar: String, en: String } }],
videos: [{ url, thumbnail }],
virtualTourUrl: String,

amenities: [String],  // stored as keys e.g. 'wifi', 'parking' — translated in frontend
tags: [String],       // stored as keys — translated in frontend
languages: [String],  // 'ar', 'en' — languages spoken at facility

packages: [{
  _id,
  name: { ar: String, en: String },
  description: { ar: String, en: String },
  price: Number,
  currency: { type: String, default: 'SAR' },
  duration: enum['day','week','month','quarter','year'],
  features: [{ ar: String, en: String }],
  isPopular: Boolean,
  isActive: Boolean,
}],

averageRating: Number,
totalReviews: Number,
ratingBreakdown: { 1: Number, 2: Number, 3: Number, 4: Number, 5: Number },

contact: { phone, whatsapp, email, website, instagram, snapchat, twitter },

operatingHours: {
  // Keys: sunday through saturday
  // Values: { isOpen: Boolean, open: String, close: String }
},
is24Hours: Boolean,

status: enum['draft','pending','active','rejected','suspended'],
rejectionReason: { ar: String, en: String },
isVerified, isFeatured, isPremium,
views, clicks, contactClicks,
seoTitle: { ar: String, en: String },
seoDescription: { ar: String, en: String },
publishedAt, createdAt, updatedAt
```

**Amenity keys** (stored as string keys, translated in frontend via `t('listings:amenities.wifi')` etc.):
```
wifi, parking, locker, shower, cafe, pool, sauna, ac, elevator,
prayer_room, women_section, men_section, family_section, disabled_access,
towel_service, personal_trainer, nutrition_coaching, group_classes
```

**Add to `ar/listings.json`:**
```json
{
  "amenities": {
    "wifi": "واي فاي",
    "parking": "موقف سيارات",
    "locker": "خزانة شخصية",
    "shower": "دش",
    "cafe": "كافيتيريا",
    "pool": "مسبح",
    "sauna": "ساونا",
    "ac": "تكييف هواء",
    "prayer_room": "مصلى",
    "women_section": "قسم نسائي",
    "men_section": "قسم رجالي",
    "family_section": "قسم عائلي",
    "disabled_access": "وصول لذوي الاحتياجات الخاصة",
    "towel_service": "خدمة المناشف",
    "personal_trainer": "مدرب شخصي",
    "nutrition_coaching": "إرشاد غذائي",
    "group_classes": "حصص جماعية"
  },
  "duration": {
    "day": "يومي",
    "week": "أسبوعي",
    "month": "شهري",
    "quarter": "ربع سنوي",
    "year": "سنوي"
  }
}
```

**Write tests for:** Model validation, BilingualField required in both languages, slug uniqueness

---

### TASK-012: Listings API — CRUD & Search

All API responses include bilingual fields. The client reads `listing.name[currentLang]` to display.

**Endpoints** (same structure as original, with bilingual awareness):
```
GET /api/listings
  - Returns full listing objects with BilingualField for name, description, city, etc.
  - Text search searches BOTH ar and en name fields
  - Full-text index on: name.ar, name.en, description.ar, description.en

GET /api/listings/:slug
GET /api/listings/featured
GET /api/listings/nearby
POST /api/listings (gym_owner+)
PUT /api/listings/:id (owner or admin)
DELETE /api/listings/:id
PATCH /api/listings/:id/status (admin+)
  - rejectionReason sent as { ar, en } in request body
GET /api/listings/:id/analytics (owner+)
GET /api/categories
GET /api/categories/:slug/listings
```

**Utility on client:**
```typescript
// client/src/utils/listing.ts
import { getLocalizedValue } from '@shared/types/common';

export const getListingName = (listing: Listing, lang: 'ar' | 'en') =>
  getLocalizedValue(listing.name, lang);

export const getListingCity = (listing: Listing, lang: 'ar' | 'en') =>
  getLocalizedValue(listing.location.city, lang);
```

**Write tests for:** Search returns results matching Arabic text, search returns results matching English text, bilingual fields present in response

---

### TASK-013: Image Upload Service
(Same as original spec — no language-specific changes needed)
- Multer + Sharp pipeline (compress to WebP, max 1200px, quality 82)
- Upload to Cloudinary
- Store `alt: { ar, en }` for accessibility

**Write tests for:** Compression pipeline, file validation

---

### TASK-014: Listing Frontend — Listing Card

**`client/src/components/shared/ListingCard/`**

All displayed text uses translations:
```tsx
const { t } = useTranslation(['common', 'listings']);
const { currentLang } = useLanguage();

// Display bilingual fields:
<h3>{getListingName(listing, currentLang)}</h3>
<p>📍 {getListingCity(listing, currentLang)}</p>

// Translate amenity keys:
{listing.amenities.slice(0,3).map(key => (
  <span key={key}>{t(`listings:amenities.${key}`)}</span>
))}

// Format price in current locale:
<span>{t('common:from')} {formatCurrency(listing.packages[0].price, currentLang)}</span>

// Review count using plural:
<span>{t('common:review', { count: listing.totalReviews })}</span>
```

**CSS `ListingCard.module.css`** — all spacing via logical CSS properties. Test that card layout mirrors correctly in RTL.

**Skeleton variant** — `ListingCard.module.css` includes `.skeleton` class with pulse animation.

**Write tests for:** Renders Arabic name in AR mode, renders English name in EN mode, RTL layout test

---

### TASK-015: Listing Frontend — Search & Browse Pages

**`ar/listings.json`** additions:
```json
{
  "searchTitle": "نتائج البحث",
  "filterBy": "تصفية النتائج",
  "sortBy": "ترتيب حسب",
  "sortRelevance": "الأكثر صلة",
  "sortRating": "الأعلى تقييماً",
  "sortPriceLow": "السعر: من الأقل",
  "sortPriceHigh": "السعر: من الأعلى",
  "sortDistance": "الأقرب",
  "sortNewest": "الأحدث",
  "priceRange": "نطاق السعر",
  "minPrice": "الحد الأدنى",
  "maxPrice": "الحد الأقصى",
  "city": "المدينة",
  "district": "الحي",
  "category": "الفئة",
  "openNow": "مفتوح الآن",
  "verifiedOnly": "الموثّقة فقط",
  "clearFilters": "مسح الفلاتر",
  "applyFilters": "تطبيق",
  "showingResults": "عرض {{count}} نتيجة",
  "noResultsTitle": "لا توجد نتائج",
  "noResultsDesc": "جرّب تغيير معايير البحث أو تصفح الفئات",
  "mapView": "عرض الخريطة",
  "listView": "عرض القائمة",
  "loadMore": "تحميل المزيد"
}
```

**`SearchPage/`** — Filter sidebar labels all from `t('listings:...')`. Sort dropdown options translated. "No results" state fully translated.

**`ListingDetailPage/`** — ALL section labels, button text, operating hours labels, package features — everything from translation files.

**Operating hours display** — day names translated:
```json
// ar/listings.json
"days": {
  "sunday": "الأحد",
  "monday": "الاثنين",
  "tuesday": "الثلاثاء",
  "wednesday": "الأربعاء",
  "thursday": "الخميس",
  "friday": "الجمعة",
  "saturday": "السبت"
},
"openNowLabel": "مفتوح الآن",
"closedLabel": "مغلق الآن",
"opens": "يفتح الساعة",
"closes": "يغلق الساعة",
"open24Hours": "مفتوح ٢٤ ساعة"
```

**Write tests for:** Filter labels in AR and EN, search results show correct language name, sort dropdown translated

---

### TASK-016: Listing Frontend — Category & Home Pages

**`ar/listings.json`** additions for home page:
```json
{
  "heroTitle": "اكتشف أفضل الخدمات الرياضية",
  "heroSubtitle": "في المملكة العربية السعودية",
  "heroSearchBtn": "ابحث الآن",
  "featuredTitle": "الأكثر طلباً",
  "categoriesTitle": "تصفح حسب الفئة",
  "citiesTitle": "تصفح حسب المدينة",
  "howItWorksTitle": "كيف يعمل النظام؟",
  "step1Title": "ابحث",
  "step1Desc": "ابحث عن الخدمة الرياضية التي تناسبك",
  "step2Title": "قارن",
  "step2Desc": "قارن الأسعار والتقييمات والمرافق",
  "step3Title": "اشترك",
  "step3Desc": "تواصل مع النادي واشترك مباشرة",
  "statsGyms": "نادٍ رياضي",
  "statsUsers": "مستخدم",
  "statsReviews": "تقييم",
  "listYourGymTitle": "هل تمتلك منشأة رياضية؟",
  "listYourGymDesc": "انضم إلى Growth World وصل إلى آلاف العملاء المحتملين",
  "listYourGymBtn": "أضف منشأتك مجاناً",
  "newsletterTitle": "ابق على اطلاع بأحدث العروض",
  "newsletterPlaceholder": "أدخل بريدك الإلكتروني",
  "newsletterBtn": "اشترك"
}
```

**Cities data** — bilingual:
```typescript
const cities = [
  { ar: 'الرياض', en: 'Riyadh', slug: 'riyadh' },
  { ar: 'جدة', en: 'Jeddah', slug: 'jeddah' },
  { ar: 'الدمام', en: 'Dammam', slug: 'dammam' },
  { ar: 'مكة المكرمة', en: 'Makkah', slug: 'makkah' },
  { ar: 'المدينة المنورة', en: 'Madinah', slug: 'madinah' },
  { ar: 'الخبر', en: 'Khobar', slug: 'khobar' },
];
```

**Write tests for:** Hero search bar in AR mode, city names in current language

---

## PHASE 3 — Reviews System

### TASK-017: Review Model & API

**Review Model** — owner reply stored bilingually:
```typescript
_id, listing, user,
rating: { overall, staff, cleanliness, facilities, value },
title: String, content: String,  // user writes in their language
visitDate, visitType: enum['individual','group','family'],
images: [{ url, publicId }],
ownerReply: {
  content: String,  // owner writes in their language
  repliedAt: Date
},
helpful: [ref(User)],
isVerified, status: enum['pending','approved','rejected'],
rejectionReason: String,
isEdited, editedAt, createdAt, updatedAt
```

**Add to `ar/reviews.json`:**
```json
{
  "writeReview": "كتابة تقييم",
  "yourRating": "تقييمك العام",
  "staff": "الكادر والموظفون",
  "cleanliness": "النظافة",
  "facilities": "المرافق والتجهيزات",
  "value": "القيمة مقابل السعر",
  "reviewTitle": "عنوان التقييم",
  "reviewContent": "تجربتك مع المنشأة",
  "visitDate": "تاريخ الزيارة",
  "visitType": "نوع الزيارة",
  "visitIndividual": "فردي",
  "visitGroup": "مجموعة",
  "visitFamily": "عائلي",
  "addPhotos": "إضافة صور",
  "submitReview": "نشر التقييم",
  "editReview": "تعديل التقييم",
  "deleteReview": "حذف التقييم",
  "helpful": "مفيد",
  "reportReview": "الإبلاغ عن التقييم",
  "ownerReply": "رد صاحب المنشأة",
  "replyToReview": "الرد على التقييم",
  "replyPlaceholder": "اكتب ردك هنا...",
  "verifiedReview": "تقييم موثّق",
  "ratingSummaryTitle": "ملخص التقييمات",
  "filterByRating": "تصفية حسب التقييم",
  "sortNewest": "الأحدث أولاً",
  "sortHighest": "الأعلى تقييماً",
  "sortHelpful": "الأكثر فائدة",
  "noReviewsYet": "لا توجد تقييمات بعد، كن أول من يقيّم!"
}
```

**Write tests for:** Review form labels in AR/EN, rating calculation, duplicate prevention

---

### TASK-018: Review Frontend Components

All components use `useTranslation('reviews')`. Rating dimension labels come from `t('reviews:staff')` etc.

`ReviewForm/`, `ReviewCard/`, `RatingSummary/`, `ReviewsList/`, `ReviewsSkeleton/` — all as originally specified, but:
- Every string via translation
- Rating breakdown bar labels (`t('reviews:excellent')` = "ممتاز" / "Excellent")
- Date displayed via `formatDate(date, currentLang)`

---

## PHASE 4 — User Features

### TASK-019: Favorites System

**Add to `ar/profile.json`:**
```json
{
  "favoritesTitle": "المفضلة",
  "noFavorites": "لم تضف أي منشأة إلى المفضلة بعد",
  "addedToFavorites": "تمت الإضافة إلى المفضلة",
  "removedFromFavorites": "تمت الإزالة من المفضلة"
}
```

`FavoriteButton/` — tooltip text from `t('profile:addedToFavorites')` etc.
`FavoritesPage/` — empty state uses `t('profile:noFavorites')`

**Write tests for:** Favorite button tooltip in AR/EN

---

### TASK-020: User Profile

**`ar/profile.json`** (complete):
```json
{
  "profileTitle": "الملف الشخصي",
  "myInfo": "معلوماتي",
  "myReviews": "تقييماتي",
  "myFavorites": "المفضلة",
  "notificationPrefs": "تفضيلات الإشعارات",
  "security": "الأمان",
  "firstName": "الاسم الأول",
  "lastName": "اسم العائلة",
  "phone": "رقم الجوال",
  "language": "لغة التطبيق",
  "changeAvatar": "تغيير الصورة",
  "saveChanges": "حفظ التغييرات",
  "changePassword": "تغيير كلمة المرور",
  "currentPassword": "كلمة المرور الحالية",
  "newPassword": "كلمة المرور الجديدة",
  "confirmNewPassword": "تأكيد كلمة المرور الجديدة",
  "activeSessions": "الجلسات النشطة",
  "logoutAllDevices": "تسجيل الخروج من كل الأجهزة",
  "sessionDevice": "الجهاز",
  "sessionLastSeen": "آخر نشاط",
  "revokeSession": "إنهاء الجلسة",
  "languageArabic": "العربية (الافتراضي)",
  "languageEnglish": "الإنجليزية",
  "languageSaved": "تم حفظ اللغة المفضلة"
}
```

**Language preference in profile** — the profile's "Language" tab shows the language switcher. Changing it:
1. Calls `switchLanguage()` → immediately switches the app
2. Saves to user's DB profile via API
3. Shows toast: `t('profile:languageSaved')`

**Write tests for:** Language preference save, profile form labels in AR/EN

---

### TASK-021: Notifications System

**Notification messages** — stored bilingually in DB, sent in user's preferred language.

**Model:**
```typescript
title: { ar: String, en: String },
body: { ar: String, en: String },
// ... rest same as original
```

**`ar/notifications.json`:**
```json
{
  "notificationsTitle": "الإشعارات",
  "markAllRead": "تعليم الكل كمقروء",
  "noNotifications": "لا توجد إشعارات",
  "unread": "غير مقروء",
  "deleteNotification": "حذف الإشعار",
  "listing_approved": "تمت الموافقة على إعلانك «{{listingName}}»",
  "listing_rejected": "تم رفض إعلانك «{{listingName}}»",
  "new_review": "تقييم جديد على «{{listingName}}»",
  "review_reply": "رد صاحب المنشأة على تقييمك",
  "review_helpful": "وجد {{count}} أشخاص تقييمك مفيداً",
  "system_announcement": "إشعار من المنصة",
  "payment_confirmed": "تم تأكيد الدفع بنجاح",
  "emailNotifications": "إشعارات البريد الإلكتروني",
  "inAppNotifications": "الإشعارات داخل التطبيق",
  "notifyOnReview": "عند استلام تقييم جديد",
  "notifyOnReply": "عند الرد على تقييمي",
  "notifyOnOffers": "عروض وأخبار المنصة"
}
```

**Frontend:** All notification item text rendered via `notification.title[currentLang]` and `notification.body[currentLang]`.

**Write tests for:** Notification displays in current language, unread count badge, real-time Socket.IO

---

## PHASE 5 — Gym Owner Dashboard

### TASK-022: Owner Dashboard — Overview

**`ar/dashboard.json`:**
```json
{
  "dashboardTitle": "لوحة التحكم",
  "overview": "نظرة عامة",
  "myListings": "إعلاناتي",
  "analytics": "التحليلات",
  "reviews": "التقييمات",
  "totalViews": "إجمالي المشاهدات",
  "contactClicks": "نقرات التواصل",
  "activeListings": "الإعلانات النشطة",
  "pendingReviews": "تقييمات بانتظار الرد",
  "avgRating": "متوسط التقييم",
  "addListing": "إضافة إعلان جديد",
  "viewsThisMonth": "المشاهدات هذا الشهر",
  "comparedToLast": "مقارنةً بالشهر الماضي",
  "increase": "زيادة بنسبة {{percent}}%",
  "decrease": "انخفاض بنسبة {{percent}}%"
}
```

All charts labeled in current language. Chart tooltips translated. Export labels translated.

**Write tests for:** Dashboard stats in AR format (`١٢٠ مشاهدة` in AR mode)

---

### TASK-023: Owner Dashboard — Listings Management

**`ListingEditor/`** — 7-step form. CRITICAL requirements for bilingual listing creation:

**Step 1: Basic Info**
- The form has TWO name fields: "Arabic Name (required)" + "English Name (required)"
- TWO short description fields: Arabic + English
- Clear labels: `t('dashboard:nameAr')` = "اسم المنشأة بالعربية" and `t('dashboard:nameEn')` = "اسم المنشأة بالإنجليزية"

**Step 3: Details**
- TWO description text areas: Arabic + English
- Amenity checkboxes show: translated amenity name (`t('listings:amenities.wifi')`) with English key in small text below for owner reference

**Step 4: Packages**
- Package name: TWO fields (Arabic + English)
- Package description: TWO fields (Arabic + English)
- Package features: add feature with Arabic + English inputs side by side

**Step 6: Contact**
- WhatsApp field with Saudi format hint (`05XXXXXXXX`)

**Add to `ar/dashboard.json`:**
```json
{
  "nameAr": "اسم المنشأة بالعربية",
  "nameEn": "اسم المنشأة بالإنجليزية",
  "descriptionAr": "الوصف بالعربية",
  "descriptionEn": "الوصف بالإنجليزية",
  "shortDescAr": "وصف مختصر بالعربية",
  "shortDescEn": "وصف مختصر بالإنجليزية",
  "packageNameAr": "اسم الباقة بالعربية",
  "packageNameEn": "اسم الباقة بالإنجليزية",
  "bilingualHint": "يجب إدخال المحتوى باللغتين العربية والإنجليزية",
  "step1": "المعلومات الأساسية",
  "step2": "الموقع",
  "step3": "التفاصيل",
  "step4": "الباقات والأسعار",
  "step5": "الصور",
  "step6": "بيانات التواصل",
  "step7": "المراجعة والنشر",
  "saveDraft": "حفظ كمسودة",
  "submitForReview": "إرسال للمراجعة",
  "compressionNote": "تم ضغط الصورة من {{original}} إلى {{compressed}}"
}
```

**Write tests for:** Both name fields required, form labels in AR/EN

---

### TASK-024: Owner Dashboard — Reviews Management

**Implemented:** `/owner/reviews` (gym_owner), `reviewsApi` `fetchOwnerReviews` + `postOwnerReviewReply`, header + owner dashboard links, `OwnerReviewsPage` + tests; server `GET /api/reviews/for-owner`, `PATCH /api/reviews/:reviewId/reply`.

All labels from `t('dashboard:...')` and `t('reviews:...')`. Reply form placeholder from `t('reviews:replyPlaceholder')`.

---

## PHASE 6 — Admin Panel

### TASK-025: Admin Dashboard — Overview

**Implemented:** `GET /api/admin/overview` (admin/super_admin), `adminApi.fetchAdminOverview`, `/admin` + `AdminOverviewPage` (stats, pending listings table, bilingual rejection demo), header `nav-admin`; AR/EN `admin.json` expanded with TASK strings + table column keys; route `/admin/demo` kept under admin layout.

**`ar/admin.json`:**
```json
{
  "adminPanel": "لوحة الإدارة",
  "overview": "نظرة عامة",
  "listings": "الإعلانات",
  "users": "المستخدمون",
  "categories": "الفئات",
  "reviews": "التقييمات",
  "analytics": "التحليلات",
  "settings": "الإعدادات",
  "systemSettings": "إعدادات النظام",
  "totalUsers": "إجمالي المستخدمين",
  "totalListings": "إجمالي الإعلانات",
  "pendingListings": "إعلانات بانتظار المراجعة",
  "totalReviews": "إجمالي التقييمات",
  "newToday": "جديد اليوم",
  "actionRequired": "يحتاج إجراء",
  "approveListing": "الموافقة على الإعلان",
  "rejectListing": "رفض الإعلان",
  "featureListing": "تمييز الإعلان",
  "suspendListing": "تعليق الإعلان",
  "rejectionReason": "سبب الرفض",
  "rejectionReasonAr": "سبب الرفض بالعربية",
  "rejectionReasonEn": "سبب الرفض بالإنجليزية",
  "sendToOwner": "إرسال للمالك",
  "changeRole": "تغيير الصلاحية",
  "deactivateUser": "تعطيل الحساب",
  "activateUser": "تفعيل الحساب",
  "broadcastTitle": "إشعار جماعي",
  "broadcastTo": "إرسال إلى",
  "broadcastAllUsers": "جميع المستخدمين",
  "broadcastByRole": "حسب الدور",
  "messageAr": "الرسالة بالعربية",
  "messageEn": "الرسالة بالإنجليزية",
  "sendBroadcast": "إرسال الإشعار"
}
```

**Admin rejection reason** — entered in BOTH Arabic and English (stored as `{ ar, en }` in DB, sent to owner in their preferred language).

All DataTable column headers from `t('admin:...')`. All action button labels translated. All status badges use `t('common:active')` etc.

**Write tests for:** Admin table column headers in AR/EN, rejection reason bilingual input

---

### TASK-026 to TASK-032: Remaining Admin Tasks & Payments

**Partial (admin moderation):** Pending listings table actions call existing `PATCH /api/listings/:id/status`; approve → `active`, reject → modal with bilingual `rejectionReason` → `rejected`. Server notifies owner via `listing_approved` / `listing_rejected` (bilingual title/body; rejection body = reasons per locale). Client: `listingsApi.patchListingStatus`, `AdminOverviewPage` mutations + reject modal, tests for PATCH payloads.

**Partial (users & broadcast):** `GET/PATCH /api/admin/users`, `POST /api/admin/broadcast` (`system_announcement` via `bulkCreateSystemAnnouncements`). Admin cannot edit `admin`/`super_admin` rows or assign elevated roles; `super_admin` can assign any role. UI: `/admin/users` (`AdminUsersPage`), overview link, search + pagination, activate/deactivate + role save, bilingual broadcast form.

**Partial (simulated payments):** Server routes `GET /api/payments/plans`, `POST /api/payments/simulate`, `GET /api/payments/transactions`. Owner UI: `/owner/plans` (`PricingPlansPage` — catalog + transaction table), `/owner/plans/:planKey/checkout` (`PaymentCheckoutPage` — test-mode card fields + simulate POST), `paymentsApi`, header + owner dashboard nav links; copy from `payments` i18n.

(Same functional spec as original — all UI text must go through `useTranslation()`. Refer to `ar/admin.json` and `ar/payments.json` for strings.)

**`ar/payments.json`:**
```json
{
  "pricingTitle": "خطط الأسعار",
  "pricingSubtitle": "اختر الخطة المناسبة لمنشأتك",
  "freePlan": "المجانية",
  "basicPlan": "الأساسية",
  "proPlan": "الاحترافية",
  "enterprisePlan": "المؤسسية",
  "perMonth": "/ شهر",
  "getStarted": "ابدأ الآن",
  "mostPopular": "الأكثر اختياراً",
  "checkoutTitle": "إتمام الشراء",
  "orderSummary": "ملخص الطلب",
  "paymentMethod": "طريقة الدفع",
  "testModeNote": "وضع الاختبار — لا تُستخدم بيانات دفع حقيقية",
  "cardNumber": "رقم البطاقة",
  "expiryDate": "تاريخ الانتهاء",
  "cvv": "رمز الأمان",
  "completePayment": "إتمام الدفع",
  "paymentSuccess": "تم الدفع بنجاح!",
  "paymentSuccessDesc": "تم تفعيل اشتراكك بنجاح",
  "transactionHistory": "سجل المعاملات",
  "transactionDate": "التاريخ",
  "transactionAmount": "المبلغ",
  "transactionStatus": "الحالة",
  "simulated": "محاكاة"
}
```

---

## PHASE 8 — Layout & Shared Components

### TASK-033: Header Component

**Done (client):** Language toggle always visible with `aria-pressed` + `lang` on buttons, `|` divider. Responsive nav: desktop row ≥960px; below that, hamburger opens an `inset-inline-end` drawer (RTL slide direction), focus-friendly close + backdrop + Escape + body scroll lock + close on route change. Nav links extracted to shared list (desktop + mobile). `toastContainer` anchor rules in `global.css`. Tests: `Header.test.tsx` (AR/EN labels, `dir`, `aria-pressed`); `matchMedia` desktop default in `setupTests.ts`.

**Language Switcher** — must be in the header at all times:
```tsx
// LanguageSwitcher component
const LanguageSwitcher = () => {
  const { currentLang, switchLanguage } = useLanguage();
  return (
    <div className={styles.switcher} role="group" aria-label="Language selection">
      <button
        className={`${styles.langBtn} ${currentLang === 'ar' ? styles.active : ''}`}
        onClick={() => switchLanguage('ar')}
        aria-pressed={currentLang === 'ar'}
        lang="ar"
      >
        العربية
      </button>
      <span className={styles.divider}>|</span>
      <button
        className={`${styles.langBtn} ${currentLang === 'en' ? styles.active : ''}`}
        onClick={() => switchLanguage('en')}
        aria-pressed={currentLang === 'en'}
        lang="en"
      >
        English
      </button>
    </div>
  );
};
```

**Toast position** — must adjust based on direction:
```css
/* In Toaster config or CSS */
[dir="rtl"] .toastContainer { inset-inline-start: auto; inset-inline-end: 1rem; }
[dir="ltr"] .toastContainer { inset-inline-start: auto; inset-inline-end: 1rem; }
/* Both show top-end corner — logical property handles RTL/LTR automatically */
```

**All nav labels** from `t('common:...')`. User dropdown labels translated. Mobile menu translated.

**Write tests for:** Language switcher renders, switch updates `dir` attribute, nav labels in AR/EN

---

### TASK-034: Footer Component

**Done (client):** Multi-column footer (`Footer.tsx`): Explore (internal routes), Company / Legal (placeholder `example.com` URLs until pages exist), Social (X / Instagram), copyright `footerCopyright` with `{{year}}`. All strings in `common` AR/EN. Tests: `Footer.test.tsx`.

All footer links, column headers, copyright text from `useTranslation('common')`.

```json
// ar/common.json additions:
{
  "footerExplore": "استكشف",
  "footerCompany": "الشركة",
  "footerLegal": "قانوني",
  "footerSocial": "تابعنا",
  "footerCopyright": "© {{year}} Growth World. جميع الحقوق محفوظة.",
  "privacyPolicy": "سياسة الخصوصية",
  "termsOfService": "شروط الاستخدام",
  "cookiePolicy": "سياسة الكوكيز",
  "aboutUs": "من نحن",
  "contactUs": "اتصل بنا",
  "blog": "المدونة",
  "careers": "وظائف"
}
```

---

### TASK-035: Shared UI Component Library

All 27 shared components — with bilingual awareness:
- All hardcoded labels replaced with `t()` calls (pass `label` prop as translation key, or `t()` inside component)
- `Button/` — `loadingText` defaults to `t('common:loading')`
- `EmptyState/` — `message` from translation prop
- `ConfirmDialog/` — `title`, `message`, `confirmLabel`, `cancelLabel` all from `t()`
- `DataTable/` — column headers passed as translation keys
- `SearchBar/` — placeholder from `t('common:searchPlaceholder')`
- `PhoneInput/` — defaults to Saudi Arabia `+966`, label from `t('auth:phone')`
- All error messages in `Input/` from `t('errors:...')`

**RTL-aware components:**
- `Drawer/` — slides from `inset-inline-end` (right in LTR, left in RTL)
- `Pagination/` — previous/next arrows use `.flip-rtl` class
- `Breadcrumb/` — separators flip direction in RTL

**Write tests for:** Each component in RTL mode; verify no physical CSS properties cause misalignment

---

### TASK-036: Skeleton Components & Page Transitions

**Done (client):** `html` sets `--shimmer-direction` (`right` / `left` for RTL). Shared `SkeletonBar` + `Skeleton.module.css` use `linear-gradient(to var(--shimmer-direction), …)` with global `gwSkeletonShimmer` keyframes. `ReviewsSkeleton` composes `SkeletonBar`. Layout `<main key={pathname}>` runs global `fadeIn` for a light route transition. Tests: `SkeletonBar.test.tsx`.

Skeleton shimmer animation works in both RTL and LTR (use `background: linear-gradient(to var(--shimmer-direction), ...)` where `--shimmer-direction` switches via `[dir]`).

---

## PHASE 9 — SEO, Accessibility & Performance

### TASK-037: SEO Implementation

**Done (client):** `useSEO` + `documentSeo` apply `<title>`, `meta description`, `og:*`, `canonical`, and `hreflang` alternates (`?hl=ar|en` on the same path for this single-URL SPA). `getSiteUrl()` / `VITE_SITE_URL` with fallback to `window.location.origin`. `useJsonLd` + `buildListingJsonLd` (`SportsActivityLocation`, `inLanguage`, bilingual `alternateName`) on `ListingDetailPage`. Wired on `HomePage`, `SearchPage`, listing detail. `public/sitemap.xml` stub. Tests: `useSEO.test.tsx`, `listingJsonLd.test.ts`.

**Bilingual SEO:**
```typescript
// useSEO.ts — sets meta tags based on current language
const useSEO = ({ titleAr, titleEn, descAr, descEn }: BilingualSEO) => {
  const { currentLang } = useLanguage();
  const title = currentLang === 'ar' ? titleAr : titleEn;
  const description = currentLang === 'ar' ? descAr : descEn;
  // Set <title>, <meta name="description">, og:title, og:description
  // Set <html lang="ar"> or <html lang="en">
  // Set og:locale="ar_SA" or og:locale="en_US"
};
```

**`<link rel="alternate">` hreflang tags:**
```html
<link rel="alternate" hreflang="ar" href="https://growthworldapp.com/ar/..."/>
<link rel="alternate" hreflang="en" href="https://growthworldapp.com/en/..."/>
<link rel="alternate" hreflang="x-default" href="https://growthworldapp.com/"/>
```

**Structured Data (JSON-LD):**
- `name` field: use current language value (`listing.name[currentLang]`)
- `addressLocality`: use `listing.location.city[currentLang]`
- `inLanguage`: `["ar", "en"]`

**Sitemap** — generate URLs for both language paths if using path-based routing, or canonical URL if using single-URL with language toggle.

---

### TASK-038: Accessibility

**Done (client):** `LanguageLiveRegion` (`aria-live="polite"` + `role="status"`) wired in `App`; `useLanguage` dispatches `gw-language-changed` when locale actually changes; copy in `common` (`languageSwitchedToArabic` / `languageSwitchedToEnglish`). Header language buttons wrap labels in `<span lang dir>` for correct pronunciation. Global `.srOnly`. Listing detail breadcrumb separators `aria-hidden`. Tests: `LanguageLiveRegion.test.tsx`, `useLanguage` asserts custom event.

Additional bilingual a11y requirements:
- All `aria-label` values from `t()` — never hardcoded
- `lang` attribute on `<html>` always matches current language
- `aria-live` regions for dynamic content work in both RTL/LTR
- Screen reader announcement on language switch: `aria-live="polite"` region announces `"تم التحويل إلى العربية"` / `"Switched to English"`
- `dir` attribute on text nodes that are in the opposite language (e.g., English words in Arabic UI use `<span lang="en" dir="ltr">`)

**Write tests for:** `aria-label` values in current language, `lang` attribute matches i18n state

---

### TASK-039: Performance Optimization

**Done (client):** Route-level `React.lazy` (existing `AppRouter`). `index.html` preloads Tajawal + Inter **woff2** (700, Arabic + Latin subsets) with `crossorigin`; stylesheet still uses `display=swap`. Listing gallery: first image `eager` + `fetchPriority="high"`, rest `lazy`. `createAppQueryClient()` — `staleTime` 60s, `gcTime` 10m, `retry` 1, `refetchOnWindowFocus` off in production. `npm run analyze` → `rollup-plugin-visualizer` (`dist/stats.html`).

**Deferred / already satisfied:** i18n namespace HTTP lazy-load left for a dedicated pass (would move JSON to `public/` + `i18next-http-backend`). Server: `compression` middleware already in `app.ts`. Listings MongoDB text index already covers `name.ar` / `name.en` (see `listing.model.ts`).

1. Code splitting per route with `React.lazy`
2. **Tajawal font preloaded** — `<link rel="preload" as="font" href="...tajawal-700.woff2" crossorigin>`
3. **Inter font preloaded** — same
4. `font-display: swap` on both fonts — no invisible text during font load
5. Image lazy loading
6. React Query stale-time configuration (same as original)
7. Bundle analysis with `rollup-plugin-visualizer`
8. **Translation files lazy-loaded by namespace** using `i18next-http-backend` in production (load `common` eagerly, other namespaces on demand)
9. MongoDB query optimization — text index covers both `name.ar` and `name.en`
10. API response compression

---

## PHASE 10 — Testing Coverage & Quality

### TASK-040: Test Suite Finalization

**Done:** Client `i18n/__tests__/i18n-parity.test.ts` (leaf key paths match for all bundled namespaces). `utils/__tests__/formatters.test.ts` (number/currency/date/relative for `ar`/`en`). `components/auth/__tests__/LanguageSwitcher.test.tsx` (AR↔EN toggles `document` + i18n). `useLanguage` test extended with `formatNumber` after switch. Server `listings.schemas.test.ts` (Zod rejects incomplete bilingual `name`). Existing `app.test.ts` already covers default Arabic vs `Accept-Language: en` errors. Snapshots / full page matrix / i18next-http-backend deferred.

**Additional i18n-specific tests to include:**

Frontend:
- `useLanguage.test.ts` — switch language, verify `document.dir`, localStorage, formatter output
- For each page component: render in AR (RTL) + render in EN (LTR), check translated string renders
- `formatters.test.ts` — test every formatter function for both `ar-SA` and `en-US`
- `LanguageSwitcher.test.tsx` — click AR → EN → verify translation changes
- Snapshot tests: one AR snapshot + one EN snapshot per key component
- `i18n.test.ts` — all translation keys present in both AR and EN files (no missing keys)

Backend:
- Test that error messages return in Arabic when no `Accept-Language` header
- Test that error messages return in English when `Accept-Language: en` sent
- Test that BilingualField validation rejects missing AR or EN value

---

### TASK-041: Error Handling & Monitoring

**Done:** `ar/errors.json` + `en/errors.json` use TASK-041 keys (`networkError`, `serverError`, `unauthorized`, `forbidden`, `notFound`, `rateLimited`, `uploadTooLarge`, `uploadInvalidType`, `sessionExpired`, `validation`). `utils/apiErrorMessage.ts` provides `getApiErrorMessage` (status/code mapping + Accept-Language server messages when present). Wired on auth flows, profile mutations, search/listing detail, owner dashboard/editor, payments, admin, reviews, favorites, notifications, `ReviewsList`, `ReviewForm` (409 still uses `reviews:duplicateReview`). `utils/__tests__/apiErrorMessage.test.ts`. **Monitoring** (Sentry/Datadog, etc.) still deferred if not in repo.

**Frontend error messages** — all from `t('errors:...')`:
```json
// ar/errors.json
{
  "networkError": "خطأ في الاتصال بالشبكة، يرجى المحاولة مرة أخرى",
  "serverError": "حدث خطأ في الخادم، يرجى المحاولة لاحقاً",
  "unauthorized": "يرجى تسجيل الدخول للمتابعة",
  "forbidden": "ليس لديك صلاحية للوصول إلى هذه الصفحة",
  "notFound": "الصفحة التي تبحث عنها غير موجودة",
  "rateLimited": "لقد تجاوزت الحد المسموح به، يرجى الانتظار قليلاً",
  "uploadTooLarge": "حجم الملف كبير جداً، الحد الأقصى {{max}} ميجابايت",
  "uploadInvalidType": "نوع الملف غير مدعوم",
  "sessionExpired": "انتهت جلستك، يرجى تسجيل الدخول مجدداً"
}
```

---

## PHASE 11 — Deployment Preparation

### TASK-042: Environment & Configuration

**Done:** `client/.env.example` lists `VITE_API_URL`, `VITE_SOCKET_URL`, optional `VITE_SITE_URL`, `VITE_GOOGLE_MAPS_KEY`, `VITE_CLOUDINARY_UPLOAD_PRESET`, `VITE_DEFAULT_LANGUAGE`, `VITE_SUPPORTED_LANGUAGES` (defaults aligned with repo `PORT=4000`; trailing `/api` on API URL is stripped in `normalizeApiBase`). `publicEnv.ts` exposes getters; `main.tsx` wires all vars; `i18n` uses `supportedLngs` + default/fallback from env; `useNotificationsSocket` prefers `VITE_SOCKET_URL`; `LanguageSwitcher` respects supported list; `vite-env.d.ts` typings; `config/__tests__/publicEnv.test.ts`.

**`client/.env.example`** additions:
```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
VITE_GOOGLE_MAPS_KEY=
VITE_CLOUDINARY_UPLOAD_PRESET=
VITE_DEFAULT_LANGUAGE=ar          # Arabic is the platform default
VITE_SUPPORTED_LANGUAGES=ar,en    # Comma-separated supported languages
```

---

### TASK-043: Docker & Scripts
(Same as original — no changes)

**Done:** `server/src/database/seedDevData.ts` — upserts dev users (`owner@`, `admin@`, `member@` `growth-world.local`) with `preferences.language: 'ar'` and bilingual names; two **active** demo listings with full `name`/`description`/`shortDescription`/`location`/packages in AR+EN. `runSeedDev.ts` runs `seedCategories` then dev users + listings. Scripts: `npm run seed:dev` (workspace server) and root `npm run seed:dev`. `docker-compose.yml` header comment points to seed command. Categories were already bilingual in `seedCategories.ts`.

**Database seed script additions:**
- All seeded listings have both `name.ar` and `name.en` populated
- All seeded categories have both AR and EN names
- All seeded users have `preferences.language = 'ar'` (Arabic default)

---

### TASK-044: API Documentation

**Done:** `server/src/config/swagger.ts` builds OpenAPI 3.0.3 with **`components.parameters.AcceptLanguage`** referenced on **every** operation, **`components.schemas.BilingualField`** (required `ar`/`en`), intro text on localization + bilingual rules + session cookies. Documented paths mirror mounted routes (auth, listings with create/update/status examples, categories, dashboard, notifications, payments, reviews, favorites, users, admin broadcast aligned with `AdminBroadcastBodySchema`, uploads). Representative **bilingual** request/response examples on listings, admin broadcast, category listing, notifications.

**Swagger** — note that all BilingualField parameters require both `ar` and `en` properties. Document `Accept-Language` header on all endpoints. Show example responses with bilingual fields.

---

### TASK-045: README & Documentation

**Done:** Root **`README.md`** added with monorepo scripts, Docker/seed pointer, link to `/api/docs`, and section **“Bilingual support (Arabic / English)”** (primary Arabic, adding keys, `i18n-parity` Jest command, RTL/LTR + logical properties, Tajawal / Inter).

**Add to README:**
- Section: "Bilingual Support (Arabic / English)"
  - Explains Arabic is the primary language
  - How to add new translation keys
  - How to run i18n key coverage check
  - RTL/LTR CSS guidelines for contributors
  - Font usage: Tajawal for Arabic, Inter for English

---

## ✅ Definition of Done (per task)

Before marking any task complete:
- [ ] Code compiles with zero TypeScript errors
- [ ] ESLint passes with zero errors
- [ ] All new components have CSS Modules (no inline styles)
- [ ] **Zero hardcoded UI strings** — all text via `useTranslation()`
- [ ] **All CSS uses logical properties** — no `margin-left`, `padding-right`, `left`, etc.
- [ ] **Tested in both Arabic (RTL) and English (LTR)** — no layout breakage in either direction
- [ ] **Tajawal font renders correctly** in Arabic mode
- [ ] Unit tests written and passing
- [ ] Test coverage threshold maintained (≥ 80%)
- [ ] No console.log statements in production code
- [ ] Skeleton/loading states implemented for all async data
- [ ] Mobile-responsive (tested at 375px, 768px, 1280px)
- [ ] Accessibility: keyboard nav works, ARIA labels present and translated
- [ ] API endpoints documented in Swagger
- [ ] Git commit with descriptive message

---

## 🗂️ Build Order Summary

```
Phase 0: Scaffolding + i18n Setup → TASK-001 to TASK-005
Phase 1: Authentication → TASK-006 to TASK-010
Phase 2: Listings → TASK-011 to TASK-016
Phase 3: Reviews → TASK-017 to TASK-018
Phase 4: User Features → TASK-019 to TASK-021
Phase 5: Gym Owner Dashboard → TASK-022 to TASK-024
Phase 6: Admin Panel → TASK-025 to TASK-032
Phase 7: Payments (Simulated) → included in TASK-032
Phase 8: Layout & UI Library → TASK-033 to TASK-036
Phase 9: SEO & Performance → TASK-037 to TASK-039
Phase 10: Testing & Quality → TASK-040 to TASK-041
Phase 11: Deployment Prep → TASK-042 to TASK-045
```

**Total: 45 tasks — Full production-ready bilingual platform.**
**Primary language: Arabic (العربية) | Secondary: English | Primary font: Tajawal**

---

## Mainline status (TASK-001 … TASK-045)

Implementation follows the **Done** notes in each task above. Phases **0–11** are covered in this codebase (scaffolding through deployment-prep docs).

**Optional follow-ups** (called out in task notes, not blocking the 45-task line):

- **Testing:** snapshot tests and an exhaustive per-page AR/EN render matrix (**TASK-040** remainder).
- **Client bundle:** lazy-loaded i18n namespaces via `i18next-http-backend` if you want a smaller initial JS payload (**TASK-039**).
- **Observability:** Sentry/Datadog or similar for production (**TASK-041** monitoring).

For day-to-day work, keep running **`npm test`** at the repo root before merges and use **`npm run test -w client -- --testPathPattern=i18n-parity`** when touching translations.