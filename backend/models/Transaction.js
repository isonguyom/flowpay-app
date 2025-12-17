import mongoose from 'mongoose'

const transactionSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },

    type: {
        type: String,
        enum: ['PAYMENT', 'FUND', 'WITHDRAW'],
        required: true,
    },

    amount: {
        type: Number,
        required: true,
    },

    sourceCurrency: {
        type: String,
        required: true,
    },

    destinationCurrency: {
        type: String,
    },

    beneficiary: {
        type: String,
    },

    fundingAccount: {
        type: String,
    },

    recipient: {
        type: String,
    },

    fxRate: {
        type: Number,
        default: 1,
    },

    fee: {
        type: Number,
        default: 0,
    },

    settlementAmount: {
        type: Number,
    },

    status: {
        type: String,
        enum: ['Pending', 'Completed', 'Failed'],
        default: 'Completed',
    },
}, { timestamps: true })

export default mongoose.model('Transaction', transactionSchema)
