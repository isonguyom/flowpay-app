import mongoose from 'mongoose'

const paymentSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    beneficiary: { type: String, required: true },
    amount: { type: Number, required: true },
    sourceWallet: { type: String, required: true },
    destinationCurrency: { type: String, required: true },
    fxRate: { type: Number, required: true },
    fee: { type: Number, default: 0 },
    settlementAmount: { type: Number, required: true },
    stripeId: { type: String, index: true },
    status: {
        type: String,
        enum: ['Pending', 'Completed', 'Failed'],
        default: 'Pending',
    },
}, { timestamps: true });


export default mongoose.model('Payment', paymentSchema)
