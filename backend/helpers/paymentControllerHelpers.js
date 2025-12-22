import Payment from '../models/Payment.js'
import Transaction from '../models/Transaction.js'
import { getSocket } from '../services/socket.js'
import { getStripe } from '../services/stripeService.js'

const stripe = getStripe()

// -------------------- Socket emitter --------------------
export const emit = (userId, event, payload) => {
    try {
        getSocket()?.to(userId.toString()).emit(event, payload)
        return true
    } catch (err) {
        console.error(`Socket emit failed [${event}]`, err)
        return false
    }
}

// -------------------- Rollback helper --------------------
export const rollback = async ({ wallet, transaction, payment, totalDebitable }) => {
    if (wallet) {
        wallet.balance += totalDebitable
        await wallet.save()
        emit(wallet.userId, 'walletUpdated', wallet)
    }
    if (transaction) {
        try { await Transaction.findByIdAndDelete(transaction._id) }
        catch (err) { console.error('Rollback transaction failed', err) }
    }
    if (payment) {
        try { await Payment.findByIdAndDelete(payment._id) }
        catch (err) { console.error('Rollback payment failed', err) }
    }
}


export const validatePaymentInput = ({ beneficiary, sourceWallet, destinationCurrency, amount, fee }) => {
    const amt = Number(amount)
    const f = Number(fee || 0)
    if (!beneficiary) return { valid: false, message: 'Beneficiary is required' }
    if (!sourceWallet || !destinationCurrency) return { valid: false, message: 'Source and destination currencies are required' }
    if (isNaN(amt) || amt <= 0) return { valid: false, message: 'Invalid amount' }
    if (isNaN(f) || f < 0) return { valid: false, message: 'Invalid fee' }
    return { valid: true, amount: amt, fee: f }
}


export const createStripePaymentIntent = async ({ amount, currency, metadata }) => {
    return await stripe.paymentIntents.create({
        amount: Math.round(amount * 100),
        currency: currency.toLowerCase(),
        automatic_payment_methods: { enabled: true },
        metadata,
    });
};
