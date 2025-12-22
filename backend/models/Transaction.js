import mongoose from 'mongoose'
import { isCurrencyAllowed, DEFAULT_CURRENCY } from '../config/currenciesConfig.js'
import {
    TRX_STATUS_VALUES,
    TRX_STATUS,
    TRX_TYPE_VALUES,
    TRX_TYPE
} from '../config/transactionConfig.js'

const transactionSchema = new mongoose.Schema(
    {
        // ======================== CORE REFERENCES ========================
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true, // critical for performance
        },

        walletId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Wallet',
            required: true,
            index: true,
        },

        paymentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Payment',
        },

        // ======================== TRANSACTION META ========================
        type: {
            type: String,
            enum: {
                values: TRX_TYPE_VALUES,
                message: 'Transaction type `{VALUE}` is invalid',
            },
            required: true,
        },

        status: {
            type: String,
            enum: {
                values: TRX_STATUS_VALUES,
                message: 'Status `{VALUE}` is invalid',
            },
            default: TRX_STATUS.PENDING,
            index: true,
        },

        // ======================== AMOUNTS ========================
        amount: {
            type: Number,
            required: true,
            min: [0, 'Amount must be positive'],
        },

        fee: {
            type: Number,
            default: 0,
            min: [0, 'Fee cannot be negative'],
        },

        settlementAmount: {
            type: Number,
            min: [0, 'Settlement amount must be positive'],
        },

        fxRate: {
            type: Number,
            default: 1,
            min: [0.000001, 'FX rate must be greater than zero'],
        },

        // ======================== CURRENCIES ========================
        sourceCurrency: {
            type: String,
            required: true,
            uppercase: true,
            default: DEFAULT_CURRENCY,
            validate: {
                validator: isCurrencyAllowed,
                message: 'Source currency `{VALUE}` not allowed',
            },
        },

        destinationCurrency: {
            type: String,
            uppercase: true,
            validate: {
                validator: (val) => !val || isCurrencyAllowed(val),
                message: 'Destination currency `{VALUE}` not allowed',
            },
        },

        // ======================== OPTIONAL METADATA ========================
        beneficiary: {
            type: String,
            trim: true,
            default: '',
            maxlength: 100,
        },

        fundingAccount: {
            type: String,
            trim: true,
            default: '',
            maxlength: 50,
        },
    },
    {
        timestamps: true,
        minimize: true,
    }
)


// ======================== DOMAIN INVARIANTS ========================
transactionSchema.pre('validate', function () {
    if (this.type === TRX_TYPE.PAYMENT && !this.destinationCurrency) {
        throw new Error('destinationCurrency is required for PAYMENT transactions')
    }
})



// ======================== EXPORT ========================
export default mongoose.model('Transaction', transactionSchema)
