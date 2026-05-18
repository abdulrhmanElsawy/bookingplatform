import mongoose, { Schema } from 'mongoose';

export const USER_ROLES = [
  'guest',
  'user',
  'gym_owner',
  'admin',
  'super_admin',
] as const;

export type UserRole = (typeof USER_ROLES)[number];

const RefreshTokenSchema = new Schema(
  {
    tokenHash: { type: String, required: true },
    device: { type: String, default: 'unknown', trim: true },
    createdAt: { type: Date, default: () => new Date() },
    expiresAt: { type: Date, required: true },
  },
  { _id: false },
);

const UserSchema = new Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    password: { type: String, required: true },
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    phone: { type: String, trim: true },
    avatar: { type: String, trim: true },
    role: {
      type: String,
      enum: USER_ROLES,
      default: 'user',
    },
    isEmailVerified: { type: Boolean, default: false },
    emailVerificationCode: { type: String },
    emailVerificationExpiry: { type: Date },
    passwordResetCode: { type: String },
    passwordResetExpiry: { type: Date },
    passwordResetAttempts: { type: Number, default: 0 },
    refreshTokens: { type: [RefreshTokenSchema], default: [] },
    lastLogin: { type: Date },
    loginAttempts: { type: Number, default: 0 },
    lockUntil: { type: Date },
    preferences: {
      language: { type: String, enum: ['ar', 'en'], default: 'ar' },
      currency: { type: String, default: 'SAR' },
      notifications: {
        email: { type: Boolean, default: true },
        inApp: { type: Boolean, default: true },
      },
    },
    isActive: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export const User =
  mongoose.models.User ?? mongoose.model('User', UserSchema);
