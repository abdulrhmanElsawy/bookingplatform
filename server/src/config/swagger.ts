/** OpenAPI 3 — all operations include `Accept-Language` (see components). */

const ACCEPT_LANG = { $ref: '#/components/parameters/AcceptLanguage' } as const;

function withLang(
  extra: Record<string, unknown>[] | undefined,
): Record<string, unknown>[] {
  return extra?.length ? [ACCEPT_LANG, ...extra] : [ACCEPT_LANG];
}

function op(args: {
  tags: string[];
  summary: string;
  description?: string;
  parameters?: Record<string, unknown>[];
  requestBody?: Record<string, unknown>;
  responses?: Record<string, unknown>;
  security?: Record<string, unknown>[];
}): Record<string, unknown> {
  return {
    tags: args.tags,
    summary: args.summary,
    ...(args.description ? { description: args.description } : {}),
    parameters: withLang(args.parameters),
    ...(args.requestBody ? { requestBody: args.requestBody } : {}),
    ...(args.security ? { security: args.security } : {}),
    responses: args.responses ?? {
      '200': {
        description: 'Success — see route handler / Zod schemas for the response body.',
      },
    },
  };
}

const listingBilingualExample = {
  name: { ar: 'صالة أواسيس', en: 'Oasis Gym' },
  shortDescription: {
    ar: 'تدريب ومعدات حديثة في العليا.',
    en: 'Modern equipment and coaching in Olaya.',
  },
  description: {
    ar: 'صالة مجهزة بالكامل مع مدربين معتمدين.',
    en: 'Fully equipped facility with certified trainers.',
  },
  location: {
    address: { ar: 'شارع التحلية', en: 'Tahlia St' },
    city: { ar: 'الرياض', en: 'Riyadh' },
    district: { ar: 'العليا', en: 'Olaya' },
    coordinates: { type: 'Point', coordinates: [46.6753, 24.7136] },
  },
};

export function buildOpenApiSpec(): Record<string, unknown> {
  return {
    openapi: '3.0.3',
    info: {
      title: 'Growth World API',
      version: '1.0.0',
      description: [
        'Sports & venues booking platform API.',
        '',
        '### Localization',
        '- Send **`Accept-Language`** on **every** request (optional but recommended). Supported values are Arabic (default) or English — use `ar`, `ar-SA`, `en`, `en-US`, etc.; the server uses the first language tag.',
        '- **Error messages** and other server-generated user-facing strings follow this header.',
        '',
        '### Bilingual fields',
        '- Request bodies that carry user-visible copy use **`BilingualField`**: an object with **both** **`ar`** and **`en`** string properties (non-empty unless documented otherwise).',
        '- Examples: listing `name`, `description`, package `name`, admin broadcast `title` / `body`, rejection reasons, image `alt` text.',
        '- Omitting either locale will fail validation (Zod / Mongoose).',
        '',
        '### Authentication',
        '- After `POST /auth/login` or `POST /auth/register` + verify, the API sets **httpOnly** cookies `gw_access_token` and `gw_refresh_token`. Send them automatically with `credentials: "include"` from browsers.',
      ].join('\n'),
    },
    servers: [{ url: '/api' }],
    tags: [
      { name: 'System', description: 'Health & meta' },
      { name: 'Auth', description: 'Registration, session, password' },
      { name: 'Listings', description: 'Venue listings (bilingual content)' },
      { name: 'Categories', description: 'Taxonomy' },
      { name: 'Reviews', description: 'Ratings & owner replies' },
      { name: 'Favorites', description: 'Saved listings' },
      { name: 'Users', description: 'Profile & preferences' },
      { name: 'Dashboard', description: 'Gym owner overview' },
      { name: 'Admin', description: 'Admin & broadcast (bilingual payloads)' },
      { name: 'Notifications', description: 'In-app notifications' },
      { name: 'Payments', description: 'Simulated plans & checkout' },
      { name: 'Uploads', description: 'Multipart uploads' },
    ],
    components: {
      parameters: {
        AcceptLanguage: {
          name: 'Accept-Language',
          in: 'header',
          required: false,
          description:
            'Preferred locale for **error messages** and localized strings. Default: Arabic.',
          schema: {
            type: 'string',
            example: 'ar',
          },
        },
      },
      schemas: {
        BilingualField: {
          type: 'object',
          required: ['ar', 'en'],
          description:
            'Bilingual user-visible string. **Both** `ar` and `en` are required wherever this shape appears in request bodies.',
          properties: {
            ar: { type: 'string', description: 'Arabic' },
            en: { type: 'string', description: 'English' },
          },
        },
        ListingCardResponse: {
          type: 'object',
          description: 'Example listing payload (fields vary by endpoint).',
          properties: {
            slug: { type: 'string', example: 'oasis-gym-olaya' },
            name: { $ref: '#/components/schemas/BilingualField' },
            shortDescription: { $ref: '#/components/schemas/BilingualField' },
            description: { $ref: '#/components/schemas/BilingualField' },
            status: { type: 'string', example: 'active' },
          },
        },
        CreateListingBody: {
          type: 'object',
          required: ['category', 'name', 'description', 'shortDescription', 'location'],
          description: 'Create listing — all bilingual branches must include `ar` and `en`.',
          properties: {
            category: { type: 'string', description: 'Mongo ObjectId of category' },
            name: { $ref: '#/components/schemas/BilingualField' },
            slug: { type: 'string', description: 'Optional URL slug (a-z0-9 hyphenated)' },
            description: { $ref: '#/components/schemas/BilingualField' },
            shortDescription: { $ref: '#/components/schemas/BilingualField' },
            location: {
              type: 'object',
              required: ['address', 'city', 'district', 'coordinates'],
              properties: {
                address: { $ref: '#/components/schemas/BilingualField' },
                city: { $ref: '#/components/schemas/BilingualField' },
                district: { $ref: '#/components/schemas/BilingualField' },
                coordinates: {
                  type: 'object',
                  properties: {
                    type: { type: 'string', enum: ['Point'] },
                    coordinates: {
                      type: 'array',
                      items: { type: 'number' },
                      minItems: 2,
                      maxItems: 2,
                      example: [46.6753, 24.7136],
                    },
                  },
                },
                googleMapsUrl: { type: 'string' },
              },
            },
            packages: {
              type: 'array',
              items: {
                type: 'object',
                required: ['name', 'description', 'price', 'duration'],
                properties: {
                  name: { $ref: '#/components/schemas/BilingualField' },
                  description: { $ref: '#/components/schemas/BilingualField' },
                  price: { type: 'number' },
                  duration: { type: 'string', example: 'month' },
                  features: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/BilingualField' },
                  },
                },
              },
            },
          },
        },
        AdminBroadcastBody: {
          type: 'object',
          required: ['scope', 'title', 'body'],
          description:
            '`title` (max 200 chars per locale) and `body` (max 4000 per locale) are full bilingual objects.',
          properties: {
            scope: { type: 'string', enum: ['all', 'role'] },
            role: {
              type: 'string',
              description: 'Required when `scope` is `role` — one of user roles',
            },
            title: { $ref: '#/components/schemas/BilingualField' },
            body: { $ref: '#/components/schemas/BilingualField' },
          },
        },
      },
      securitySchemes: {
        sessionCookie: {
          type: 'apiKey',
          in: 'cookie',
          name: 'gw_access_token',
          description:
            'JWT access token issued after login; also refresh via `gw_refresh_token`. Use browser credentials, not manual header in most clients.',
        },
      },
    },
    paths: {
      '/health': {
        get: op({
          tags: ['System'],
          summary: 'Health check',
          responses: {
            '200': {
              description: 'OK',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: { status: { type: 'string', example: 'ok' } },
                  },
                },
              },
            },
          },
        }),
      },

      '/auth/register': {
        post: op({
          tags: ['Auth'],
          summary: 'Register (sends verification OTP)',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { type: 'object' },
              },
            },
          },
          responses: {
            '201': { description: 'Registered' },
            '409': { description: 'Email already exists' },
          },
        }),
      },
      '/auth/verify-email': {
        post: op({
          tags: ['Auth'],
          summary: 'Verify email with OTP',
          requestBody: { required: true, content: { 'application/json': { schema: { type: 'object' } } } },
          responses: { '200': { description: 'Verified; sets session cookies' } },
        }),
      },
      '/auth/resend-verification': {
        post: op({
          tags: ['Auth'],
          summary: 'Resend verification OTP',
          requestBody: { required: true, content: { 'application/json': { schema: { type: 'object' } } } },
          responses: { '200': { description: 'OTP resent' } },
        }),
      },
      '/auth/login': {
        post: op({
          tags: ['Auth'],
          summary: 'Login',
          requestBody: { required: true, content: { 'application/json': { schema: { type: 'object' } } } },
          responses: { '200': { description: 'Sets session cookies' }, '401': { description: 'Invalid credentials' } },
        }),
      },
      '/auth/logout': {
        post: op({
          tags: ['Auth'],
          summary: 'Logout (clears cookies)',
          responses: { '200': { description: 'Logged out' } },
        }),
      },
      '/auth/refresh': {
        post: op({
          tags: ['Auth'],
          summary: 'Refresh access token (refresh cookie)',
          responses: { '200': { description: 'New access token' } },
        }),
      },
      '/auth/forgot-password': {
        post: op({
          tags: ['Auth'],
          summary: 'Request password reset OTP',
          requestBody: { required: true, content: { 'application/json': { schema: { type: 'object' } } } },
          responses: { '200': { description: 'If email exists, OTP sent' } },
        }),
      },
      '/auth/reset-password': {
        post: op({
          tags: ['Auth'],
          summary: 'Reset password with OTP',
          requestBody: { required: true, content: { 'application/json': { schema: { type: 'object' } } } },
          responses: { '200': { description: 'Password updated' } },
        }),
      },
      '/auth/me': {
        get: op({
          tags: ['Auth'],
          summary: 'Current user',
          security: [{ sessionCookie: [] }],
          responses: { '200': { description: 'User profile' }, '401': { description: 'Unauthorized' } },
        }),
      },
      '/auth/account-type': {
        patch: op({
          tags: ['Auth'],
          summary: 'Set account type after registration',
          security: [{ sessionCookie: [] }],
          requestBody: { required: true, content: { 'application/json': { schema: { type: 'object' } } } },
          responses: { '200': { description: 'Updated' } },
        }),
      },
      '/auth/change-password': {
        post: op({
          tags: ['Auth'],
          summary: 'Change password',
          security: [{ sessionCookie: [] }],
          requestBody: { required: true, content: { 'application/json': { schema: { type: 'object' } } } },
          responses: { '200': { description: 'Password changed' } },
        }),
      },

      '/listings': {
        get: op({
          tags: ['Listings'],
          summary: 'Search / list listings',
          parameters: [
            { name: 'search', in: 'query', schema: { type: 'string' } },
            { name: 'category', in: 'query', schema: { type: 'string' } },
            { name: 'page', in: 'query', schema: { type: 'integer' } },
            { name: 'limit', in: 'query', schema: { type: 'integer' } },
          ],
          responses: {
            '200': {
              description: 'Paginated listings (bilingual fields in each item)',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      listings: {
                        type: 'array',
                        items: { $ref: '#/components/schemas/ListingCardResponse' },
                      },
                    },
                  },
                },
              },
            },
          },
        }),
        post: op({
          tags: ['Listings'],
          summary: 'Create listing (gym_owner / admin)',
          security: [{ sessionCookie: [] }],
          description: 'Body uses **BilingualField** for all user-visible strings (name, descriptions, location, packages, image alt, etc.).',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/CreateListingBody' },
                example: {
                  category: '507f1f77bcf86cd799439011',
                  name: listingBilingualExample.name,
                  description: listingBilingualExample.description,
                  shortDescription: listingBilingualExample.shortDescription,
                  location: listingBilingualExample.location,
                  packages: [
                    {
                      name: { ar: 'شهري', en: 'Monthly' },
                      description: { ar: 'دخول كامل', en: 'Full access' },
                      price: 299,
                      currency: 'SAR',
                      duration: 'month',
                      features: [{ ar: 'مسبح', en: 'Pool access' }],
                    },
                  ],
                },
              },
            },
          },
          responses: { '201': { description: 'Created' }, '401': { description: 'Unauthorized' } },
        }),
      },
      '/listings/featured': {
        get: op({
          tags: ['Listings'],
          summary: 'Featured listings',
          responses: {
            '200': {
              description: 'Listings with bilingual `name` / descriptions',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      listings: {
                        type: 'array',
                        items: { $ref: '#/components/schemas/ListingCardResponse' },
                      },
                    },
                  },
                },
              },
            },
          },
        }),
      },
      '/listings/nearby': {
        get: op({
          tags: ['Listings'],
          summary: 'Geo nearby listings',
          parameters: [
            { name: 'lng', in: 'query', required: true, schema: { type: 'number' } },
            { name: 'lat', in: 'query', required: true, schema: { type: 'number' } },
            { name: 'radiusKm', in: 'query', schema: { type: 'number' } },
          ],
          responses: { '200': { description: 'Nearby listings' } },
        }),
      },
      '/listings/{listingId}/analytics': {
        get: op({
          tags: ['Listings'],
          summary: 'Owner analytics for listing (Mongo ObjectId)',
          security: [{ sessionCookie: [] }],
          parameters: [
            {
              name: 'listingId',
              in: 'path',
              required: true,
              schema: { type: 'string' },
            },
          ],
          responses: { '200': { description: 'Analytics' }, '403': { description: 'Forbidden' } },
        }),
      },
      '/listings/{id}': {
        put: op({
          tags: ['Listings'],
          summary: 'Update listing (owner)',
          security: [{ sessionCookie: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          description: 'Same bilingual rules as create; partial updates per Zod `UpdateListingBodySchema`.',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/CreateListingBody' },
              },
            },
          },
          responses: { '200': { description: 'Updated' } },
        }),
        delete: op({
          tags: ['Listings'],
          summary: 'Delete listing',
          security: [{ sessionCookie: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { '204': { description: 'Deleted' } },
        }),
      },
      '/listings/{id}/status': {
        patch: op({
          tags: ['Listings'],
          summary: 'Admin: change listing status',
          security: [{ sessionCookie: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          description: 'When rejecting, **`rejectionReason`** must be a full **BilingualField** (`ar` + `en`).',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', example: 'rejected' },
                    rejectionReason: { $ref: '#/components/schemas/BilingualField' },
                  },
                },
                example: {
                  status: 'rejected',
                  rejectionReason: {
                    ar: 'يرجى إضافة صور أوضح للمنشأة.',
                    en: 'Please add clearer photos of the facility.',
                  },
                },
              },
            },
          },
          responses: { '200': { description: 'Status updated' } },
        }),
      },
      '/listings/{slugOrId}': {
        get: op({
          tags: ['Listings'],
          summary: 'Get listing by slug or Mongo id',
          parameters: [{ name: 'slugOrId', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            '200': {
              description: 'Listing detail with bilingual copy',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ListingCardResponse' },
                  example: {
                    slug: 'oasis-gym-olaya',
                    ...listingBilingualExample,
                    status: 'active',
                  },
                },
              },
            },
            '404': { description: 'Not found' },
          },
        }),
      },

      '/categories': {
        get: op({
          tags: ['Categories'],
          summary: 'List categories',
          responses: {
            '200': {
              description: 'Each category includes bilingual `name`',
              content: {
                'application/json': {
                  schema: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        slug: { type: 'string' },
                        name: { $ref: '#/components/schemas/BilingualField' },
                      },
                    },
                  },
                },
              },
            },
          },
        }),
      },
      '/categories/{slug}/listings': {
        get: op({
          tags: ['Categories'],
          summary: 'Listings in category',
          parameters: [{ name: 'slug', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { '200': { description: 'Paginated listings' } },
        }),
      },

      '/dashboard/overview': {
        get: op({
          tags: ['Dashboard'],
          summary: 'Gym owner dashboard overview',
          security: [{ sessionCookie: [] }],
          responses: { '200': { description: 'Metrics' }, '403': { description: 'Not a gym owner' } },
        }),
      },

      '/notifications/unread-count': {
        get: op({
          tags: ['Notifications'],
          summary: 'Unread notification count',
          security: [{ sessionCookie: [] }],
          responses: { '200': { description: 'Count payload' } },
        }),
      },
      '/notifications': {
        get: op({
          tags: ['Notifications'],
          summary: 'List notifications',
          security: [{ sessionCookie: [] }],
          responses: {
            '200': {
              description: 'Notifications with bilingual `title` / `body` objects',
            },
          },
        }),
      },
      '/notifications/mark-all-read': {
        post: op({
          tags: ['Notifications'],
          summary: 'Mark all read',
          security: [{ sessionCookie: [] }],
          responses: { '200': { description: 'OK' } },
        }),
      },
      '/notifications/{id}/read': {
        patch: op({
          tags: ['Notifications'],
          summary: 'Mark one notification read',
          security: [{ sessionCookie: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { '200': { description: 'Updated' } },
        }),
      },
      '/notifications/{id}': {
        delete: op({
          tags: ['Notifications'],
          summary: 'Delete notification',
          security: [{ sessionCookie: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { '204': { description: 'Deleted' } },
        }),
      },

      '/payments/plans': {
        get: op({
          tags: ['Payments'],
          summary: 'Plan catalog (simulated)',
          responses: { '200': { description: 'Plans' } },
        }),
      },
      '/payments/simulate': {
        post: op({
          tags: ['Payments'],
          summary: 'Simulate checkout (gym_owner)',
          security: [{ sessionCookie: [] }],
          requestBody: { required: true, content: { 'application/json': { schema: { type: 'object' } } } },
          responses: { '201': { description: 'Transaction created' } },
        }),
      },
      '/payments/transactions': {
        get: op({
          tags: ['Payments'],
          summary: 'My payment transactions',
          security: [{ sessionCookie: [] }],
          responses: { '200': { description: 'History' } },
        }),
      },

      '/reviews/for-owner': {
        get: op({
          tags: ['Reviews'],
          summary: 'Reviews for owner’s listings',
          security: [{ sessionCookie: [] }],
          responses: { '200': { description: 'Reviews' } },
        }),
      },
      '/reviews/{reviewId}/reply': {
        patch: op({
          tags: ['Reviews'],
          summary: 'Owner reply to review',
          security: [{ sessionCookie: [] }],
          parameters: [{ name: 'reviewId', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: { required: true, content: { 'application/json': { schema: { type: 'object' } } } },
          responses: { '200': { description: 'Reply stored' } },
        }),
      },
      '/reviews': {
        get: op({
          tags: ['Reviews'],
          summary: 'List reviews for a listing',
          parameters: [{ name: 'listing', in: 'query', required: true, schema: { type: 'string' } }],
          responses: { '200': { description: 'Reviews' } },
        }),
        post: op({
          tags: ['Reviews'],
          summary: 'Create review',
          security: [{ sessionCookie: [] }],
          requestBody: { required: true, content: { 'application/json': { schema: { type: 'object' } } } },
          responses: { '201': { description: 'Created' }, '409': { description: 'Duplicate review' } },
        }),
      },

      '/favorites/status': {
        get: op({
          tags: ['Favorites'],
          summary: 'Favorite status for a listing slug',
          parameters: [{ name: 'listing', in: 'query', required: true, schema: { type: 'string' } }],
          responses: { '200': { description: 'Favorited flag' } },
        }),
      },
      '/favorites': {
        get: op({
          tags: ['Favorites'],
          summary: 'List favorites',
          security: [{ sessionCookie: [] }],
          responses: { '200': { description: 'Favorites' } },
        }),
        post: op({
          tags: ['Favorites'],
          summary: 'Add favorite',
          security: [{ sessionCookie: [] }],
          requestBody: { required: true, content: { 'application/json': { schema: { type: 'object' } } } },
          responses: { '201': { description: 'Added' } },
        }),
        delete: op({
          tags: ['Favorites'],
          summary: 'Remove favorite',
          security: [{ sessionCookie: [] }],
          parameters: [{ name: 'listing', in: 'query', required: true, schema: { type: 'string' } }],
          responses: { '204': { description: 'Removed' } },
        }),
      },

      '/users/me': {
        patch: op({
          tags: ['Users'],
          summary: 'Update profile',
          security: [{ sessionCookie: [] }],
          requestBody: { required: true, content: { 'application/json': { schema: { type: 'object' } } } },
          responses: { '200': { description: 'Updated' } },
        }),
      },
      '/users/me/preferences': {
        patch: op({
          tags: ['Users'],
          summary: 'Update preferences (e.g. language)',
          security: [{ sessionCookie: [] }],
          requestBody: { required: true, content: { 'application/json': { schema: { type: 'object' } } } },
          responses: { '200': { description: 'Updated' } },
        }),
      },

      '/admin/overview': {
        get: op({
          tags: ['Admin'],
          summary: 'Admin overview',
          security: [{ sessionCookie: [] }],
          responses: { '200': { description: 'Stats' }, '403': { description: 'Forbidden' } },
        }),
      },
      '/admin/users': {
        get: op({
          tags: ['Admin'],
          summary: 'List users (admin)',
          security: [{ sessionCookie: [] }],
          responses: { '200': { description: 'Users' } },
        }),
      },
      '/admin/broadcast': {
        post: op({
          tags: ['Admin'],
          summary: 'Broadcast notification (bilingual title & body)',
          security: [{ sessionCookie: [] }],
          description: '**`title`** and **`body`** must each be a full **BilingualField**.',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/AdminBroadcastBody' },
                example: {
                  scope: 'all',
                  title: { ar: 'صيانة مجدولة', en: 'Scheduled maintenance' },
                  body: {
                    ar: 'الخدمة غير متاحة غداً من 2 صباحاً حتى 4 صباحاً.',
                    en: 'Service unavailable tomorrow from 2am to 4am UTC.',
                  },
                },
              },
            },
          },
          responses: { '201': { description: 'Broadcast queued' } },
        }),
      },
      '/admin/users/{userId}': {
        patch: op({
          tags: ['Admin'],
          summary: 'Patch user (role / active)',
          security: [{ sessionCookie: [] }],
          parameters: [{ name: 'userId', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: { required: true, content: { 'application/json': { schema: { type: 'object' } } } },
          responses: { '200': { description: 'Updated' } },
        }),
      },

      '/uploads/listing-image': {
        post: op({
          tags: ['Uploads'],
          summary: 'Upload listing image (multipart)',
          security: [{ sessionCookie: [] }],
          requestBody: {
            required: true,
            content: {
              'multipart/form-data': {
                schema: {
                  type: 'object',
                  properties: {
                    file: { type: 'string', format: 'binary' },
                  },
                },
              },
            },
          },
          responses: { '201': { description: 'Uploaded' }, '413': { description: 'Too large' } },
        }),
      },
    },
  };
}
