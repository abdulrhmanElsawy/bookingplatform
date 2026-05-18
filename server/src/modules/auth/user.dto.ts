import type { UserRole } from '../users/user.model.js';

export interface PublicUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: UserRole;
  isEmailVerified: boolean;
  preferences: {
    language: 'ar' | 'en';
    currency: string;
    notifications: { email: boolean; inApp: boolean };
  };
  createdAt?: Date;
  updatedAt?: Date;
}

export function toPublicUser(user: {
  _id: { toString(): string };
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: UserRole;
  isEmailVerified: boolean;
  preferences: PublicUser['preferences'];
  createdAt?: Date;
  updatedAt?: Date;
}): PublicUser {
  return {
    id: user._id.toString(),
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    phone: user.phone,
    role: user.role,
    isEmailVerified: user.isEmailVerified,
    preferences: user.preferences,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}
