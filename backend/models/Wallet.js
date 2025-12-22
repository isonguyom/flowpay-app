// models/Wallet.js
import mongoose from 'mongoose'
import { setPrimaryWallet, WALLET_STATUS } from '../helpers/walletHelpers.js'
import { isCurrencyAllowed } from '../config/currenciesConfig.js'

const walletSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
      index: true,
    },

    currency: {
      type: String,
      required: [true, 'Currency is required'],
      uppercase: true,
      validate: {
        validator: isCurrencyAllowed,
        message: 'Currency not allowed',
      },
    },

    balance: {
      type: Number,
      default: 0,
      min: [0, 'Balance cannot be negative'],
    },

    status: {
      type: String,
      enum: Object.values(WALLET_STATUS),
      default: WALLET_STATUS.ACTIVE,
    },

    isPrimary: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
)

// Ensure primary wallet rules
walletSchema.pre('save', async function () {
  await setPrimaryWallet(this)
})

export default mongoose.model('Wallet', walletSchema)
