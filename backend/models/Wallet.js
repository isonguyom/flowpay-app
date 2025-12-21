import mongoose from 'mongoose';
import { setPrimaryWallet, WALLET_STATUS } from '../helpers/walletHelpers.js';
import { isCurrencyAllowed } from '../config/currencies.js';

const walletSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'User reference is required'],
        },
        currency: {
            type: String,
            required: [true, 'Currency is required'],
            uppercase: true,
            validate: {
                validator: function (value) {
                    return isCurrencyAllowed(value);
                },
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
);

// Pre-save hook to handle isPrimary automatically
walletSchema.pre('save', async function () {
    await setPrimaryWallet(this);
});

export default mongoose.model('Wallet', walletSchema);
