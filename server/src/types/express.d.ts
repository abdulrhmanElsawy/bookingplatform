import type { AppLang } from '../lib/i18n.types.js';
import type { UserRole } from '../modules/users/user.model.js';

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
}

declare global {
  namespace Express {
    interface Request {
      lang: AppLang;
      user?: AuthUser;
    }

    interface Locals {
      lang: AppLang;
    }
  }
}

export {};
