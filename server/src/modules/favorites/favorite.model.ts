import mongoose, { Schema } from 'mongoose';

const FavoriteSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    listing: {
      type: Schema.Types.ObjectId,
      ref: 'Listing',
      required: true,
      index: true,
    },
  },
  { timestamps: true },
);

FavoriteSchema.index({ user: 1, listing: 1 }, { unique: true });

export const Favorite =
  mongoose.models.Favorite ?? mongoose.model('Favorite', FavoriteSchema);
