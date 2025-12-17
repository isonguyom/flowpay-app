import mongoose from 'mongoose'

const walletSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    currency: {
        type: String,
        required: true,
    },
    amount: {
        type: Number,
        default: 0,
    },
    status: {
        type: String,
        default: 'Active',
        enum: ['Active', 'Pending', 'Disabled'],
    }
}, { timestamps: true })

export default mongoose.model('Wallet', walletSchema)
