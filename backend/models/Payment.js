import mongoose from 'mongoose'

const paymentSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    beneficiary: { type: String, required: true },
    amount: { type: Number, required: true },
    sourceCurrency: { type: String, required: true },
    destinationCurrency: { type: String, required: true },
    fxRate: { type: Number, required: true },
    fee: { type: Number, default: 0 },
    settlementAmount: { type: Number, required: true },
    status: { type: String, enum: ['Pending', 'Settled', 'Failed'], default: 'Pending' },
}, { timestamps: true })

export default mongoose.model('Payment', paymentSchema)
