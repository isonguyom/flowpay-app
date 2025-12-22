import mongoose from 'mongoose';
import { isCurrencyAllowed, sanitizeCurrency } from '../config/currenciesConfig.js';
import { TRX_STATUS } from '../config/transactionConfig.js';

const paymentSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'User reference is required'],
        },
        beneficiary: {
            type: String,
            required: [true, 'Beneficiary is required'],
            trim: true,
        },
        amount: {
            type: Number,
            required: [true, 'Amount is required'],
            min: [0, 'Amount must be positive'],
        },
        sourceWalletId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Wallet',
            required: [true, 'Source wallet is required'],
        },
        destinationCurrency: {
            type: String,
            required: [true, 'Destination currency is required'],
            uppercase: true,
            validate: {
                validator: function (value) {
                    return isCurrencyAllowed(value);
                },
                message: 'Destination currency not allowed',
            },
        },
        fxRate: {
            type: Number,
            required: [true, 'FX rate is required'],
            min: [0, 'FX rate must be positive'],
        },
        fee: {
            type: Number,
            default: 0,
            min: [0, 'Fee cannot be negative'],
        },
        settlementAmount: {
            type: Number,
            required: [true, 'Settlement amount is required'],
            min: [0, 'Settlement amount must be positive'],
        },
        stripeId: {
            type: String,
            index: true,
        },
        status: {
            type: String,
            enum: Object.values(TRX_STATUS),
            default: TRX_STATUS.PENDING,
        },
    },
    { timestamps: true }
);

// Pre-save hook to sanitize currency
paymentSchema.pre('save', function () {
    this.destinationCurrency = sanitizeCurrency(this.destinationCurrency);
});

export default mongoose.model('Payment', paymentSchema);
