import mongoose from 'mongoose';

/**
 * IdempotencyKey Schema
 * 
 * Stores idempotency keys for safe request retries.
 * Each key must be unique per user and endpoint.
 */
const idempotencySchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: [true, 'Idempotency key is required'],
      unique: true,
      trim: true,
      index: true, // helps fast lookups
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
    },
    endpoint: {
      type: String,
      required: [true, 'Endpoint is required'],
      trim: true,
    },
    response: {
      type: mongoose.Schema.Types.Mixed, // can store object, array, or primitive
      required: [true, 'Response payload is required'],
    },
    statusCode: {
      type: Number,
      required: [true, 'Status code is required'],
    },
  },
  {
    timestamps: true, // adds createdAt and updatedAt
  }
);

// Optional: add a compound index for user + endpoint to prevent duplicates per user
idempotencySchema.index({ userId: 1, endpoint: 1, key: 1 }, { unique: true });

export default mongoose.model('IdempotencyKey', idempotencySchema);
