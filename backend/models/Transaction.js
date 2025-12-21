import mongoose from 'mongoose';
import { isCurrencyAllowed, DEFAULT_CURRENCY } from '../config/currencies.js';
import { TRX_STATUS_VALUES, TRX_STATUS, TRX_TYPE_VALUES } from '../helpers/trxHelpers.js';

const transactionSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'User reference is required'],
        },
        type: {
            type: String,
            enum: TRX_TYPE_VALUES,
            required: [true, 'Transaction type is required'],
        },
        amount: {
            type: Number,
            required: [true, 'Amount is required'],
            min: [0, 'Amount must be positive'],
        },
        sourceCurrency: {
            type: String,
            required: [true, 'Source currency is required'],
            uppercase: true,
            default: DEFAULT_CURRENCY,
            validate: {
                validator: (val) => isCurrencyAllowed(val),
                message: 'Source currency not allowed',
            },
        },
        destinationCurrency: {
            type: String,
            uppercase: true,
            validate: {
                validator: (val) => !val || isCurrencyAllowed(val),
                message: 'Destination currency not allowed',
            },
        },
        beneficiary: { type: String, trim: true, default: '' },
        fundingAccount: { type: String, trim: true, default: '' },
        fxRate: { type: Number, default: 1, min: [0, 'FX rate must be positive'] },
        fee: { type: Number, default: 0, min: [0, 'Fee cannot be negative'] },
        settlementAmount: { type: Number, min: [0, 'Settlement amount must be positive'] },
        status: {
            type: String,
            enum: TRX_STATUS_VALUES,
            default: TRX_STATUS.COMPLETED,
        },
        paymentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Payment' },
        walletId: { type: mongoose.Schema.Types.ObjectId, ref: 'Wallet' },
    },
    { timestamps: true }
);

export default mongoose.model('Transaction', transactionSchema);
