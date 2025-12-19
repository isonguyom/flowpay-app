import mongoose from 'mongoose'

const idempotencySchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    unique: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  endpoint: {
    type: String,
    required: true
  },
  response: {
    type: Object,
    required: true
  },
  statusCode: {
    type: Number,
    required: true
  }
}, {
  timestamps: true
})

export default mongoose.model('IdempotencyKey', idempotencySchema)
