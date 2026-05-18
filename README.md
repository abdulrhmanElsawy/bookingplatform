# Growth World (booking platform)

Monorepo: **`client`** (Vite + React), **`server`** (Express + MongoDB), **`shared`** (Zod schemas and types).

The full build checklist and per-task **Done** notes live in **[`TASKS.md`](./TASKS.md)** (45 tasks, phases 0–11). Optional follow-ups (extra tests, lazy i18n, monitoring) are listed at the bottom of that file.

## Scripts (from repo root)

| Command | Description |
|--------|-------------|
| `npm run dev:client` | Start Vite dev server |
| `npm run dev:server` | Start API with hot reload |
| `npm run build` | Build shared, client, and server |
| `npm test` | Run tests in shared, client, and server |
| `npm run seed:dev` | Seed MongoDB (categories, bilingual demo listings, users with Arabic default) — requires MongoDB |

Local infrastructure: `docker compose up -d` (MongoDB + Redis). Configure `server/.env` and `client/.env` from each package’s `.env.example`.

API docs (when the server is running): `GET /api/docs` (Swagger UI).

---

## Bilingual support (Arabic / English)

### Primary language

**Arabic (`ar`) is the primary language** of the product: default locale, default copy, and default user preference in seeded data. **English (`en`)** is fully supported for UI and content where applicable. The API honors **`Accept-Language`** for localized error messages and similar strings; the SPA sends the active locale from i18n.

### Adding new translation keys

1. Choose a **namespace** under `client/src/i18n/locales/{ar,en}/` (for example `common.json`, `listings.json`). Add the **same key path** in both `ar` and `en` JSON files. Use nested objects for grouping; only **leaf** values should be strings (the parity test compares leaf paths).
2. If you add a **new JSON file** (new namespace), import it in `client/src/i18n/index.ts` and append the namespace to the `namespaces` array and to both `resources.ar` / `resources.en`.
3. In components, use `useTranslation('namespace')` and `t('key')` (or `t('nested.key')`). For multiple namespaces, use `t('otherNs:key')` or a second `useTranslation` hook.
4. **Do not** hardcode user-visible strings in JSX or CSS `content` unless unavoidable; prefer keys in both locales.

### i18n key coverage check

The client includes a Jest test that asserts **Arabic and English locale files have identical leaf key paths** for every bundled namespace (no missing keys on either side).

```bash
npm run test -w client -- --testPathPattern=i18n-parity
```

Run the full client suite to catch regressions together with other tests:

```bash
npm run test -w client
```

### RTL / LTR guidelines (contributors)

- The document root uses **`dir="rtl"`** for Arabic and **`dir="ltr"`** for English (`document.documentElement.dir`). Layout should work in **both** directions.
- Prefer **CSS logical properties** for spacing and position: `margin-inline`, `padding-inline`, `inset-inline`, `border-inline`, etc., instead of physical `left` / `right` / `margin-left` / `padding-right` so components mirror correctly in RTL.
- Icons or arrows that imply reading direction should flip or be replaced where needed; use logical properties or `[dir="rtl"]` selectors sparingly and only when there is no logical-property equivalent.
- Test critical screens at **375px**, **768px**, and **1280px** in **both** Arabic and English.

### Fonts

- **Arabic:** **Tajawal** (loaded in `client/index.html` / global styles).
- **English:** **Inter** (same). The app typically applies font stacks via CSS so Latin text in mixed locales still reads well.

---

## License

Private / internal — adjust as needed for your organization.
