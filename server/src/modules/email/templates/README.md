# Email HTML templates

Bilingual HTML templates for transactional emails. Each type has two files:

- `{name}.ar.html` — Arabic, `dir="rtl"`, Cairo font
- `{name}.en.html` — English, `dir="ltr"`, Arial font

Placeholders use `{{variableName}}` and are HTML-escaped at render time.

## Templates and variables

| Base name | Variables | When sent |
|-----------|-----------|-----------|
| `verification-code` | `userName`, `otp` | Register, resend verification |
| `welcome` | `userName` | After email verified |
| `password-reset` | `userName`, `otp` | Forgot password, resend reset |
| `password-changed` | `userName`, `changedAt` | After password reset |
| `listing-approved` | `userName`, `listingName` | Admin approves listing |
| `listing-rejected` | `userName`, `listingName`, `reason` | Admin rejects listing |
| `new-review` | `userName`, `listingName`, `rating`, `reviewerName` | New review on owner's listing |
| `subscription-confirmed` | `userName`, `amount`, `currency`, `accessCode`, `venueName` | Venue membership checkout |

## Build

Templates are copied to `server/dist/modules/email/templates/` on `npm run build` via `scripts/copy-email-templates.mjs`.
