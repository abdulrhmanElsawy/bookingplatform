import mongoose from 'mongoose';

/** Strict 24-char hex ObjectId string (avoids partial matches). */
export function isMongoObjectId(id: string): boolean {
  if (typeof id !== 'string' || id.length !== 24) return false;
  if (!/^[a-f0-9]{24}$/i.test(id)) return false;
  return String(new mongoose.Types.ObjectId(id)) === id;
}
