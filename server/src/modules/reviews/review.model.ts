import mongoose, { Schema } from 'mongoose';

export const REVIEW_VISIT_TYPES = ['individual', 'group', 'family'] as const;
export type ReviewVisitType = (typeof REVIEW_VISIT_TYPES)[number];

export const REVIEW_STATUSES = ['pending', 'approved', 'rejected'] as const;
export type ReviewStatus = (typeof REVIEW_STATUSES)[number];

const ReviewImageSchema = new Schema(
  {
    url: { type: String, required: true, trim: true },
    publicId: { type: String, trim: true },
  },
  { _id: false },
);

const RatingDimensionsSchema = new Schema(
  {
    overall: { type: Number, required: true, min: 1, max: 5 },
    staff: { type: Number, required: true, min: 1, max: 5 },
    cleanliness: { type: Number, required: true, min: 1, max: 5 },
    facilities: { type: Number, required: true, min: 1, max: 5 },
    value: { type: Number, required: true, min: 1, max: 5 },
  },
  { _id: false },
);

const OwnerReplySchema = new Schema(
  {
    content: { type: String, required: true, trim: true },
    repliedAt: { type: Date, required: true },
  },
  { _id: false },
);

const ReviewSchema = new Schema(
  {
    listing: {
      type: Schema.Types.ObjectId,
      ref: 'Listing',
      required: true,
      index: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    rating: { type: RatingDimensionsSchema, required: true },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    content: { type: String, required: true, trim: true, maxlength: 8000 },
    visitDate: { type: Date, required: true },
    visitType: {
      type: String,
      enum: REVIEW_VISIT_TYPES,
      required: true,
    },
    images: { type: [ReviewImageSchema], default: [] },
    ownerReply: { type: OwnerReplySchema },
    helpful: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    isVerified: { type: Boolean, default: false },
    status: {
      type: String,
      enum: REVIEW_STATUSES,
      default: 'approved',
      index: true,
    },
    rejectionReason: { type: String, trim: true, maxlength: 2000 },
    isEdited: { type: Boolean, default: false },
    editedAt: { type: Date },
  },
  { timestamps: true },
);

ReviewSchema.index({ listing: 1, user: 1 }, { unique: true });
ReviewSchema.index({ listing: 1, status: 1, createdAt: -1 });

export const Review = mongoose.models.Review ?? mongoose.model('Review', ReviewSchema);
