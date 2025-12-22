import Payment from '../models/Payment.js'
import Transaction from '../models/Transaction.js'
import Wallet from '../models/Wallet.js'
import { getSocket } from '../services/socket.js'

/**
 * Handle completed outbound payment intent
 * Triggered by Stripe payment_intent.succeeded
 */
export const handlePaymentIntent = async (intent) => {
    try {
        const { transactionId } = intent.metadata || {}

        if (!transactionId) {
            console.warn('PaymentIntent missing transactionId metadata:', intent.id)
            return
        }

        const transaction = await Transaction.findById(transactionId)
        if (!transaction || transaction.status !== 'Pending') return

        const payment = await Payment.findOne({ stripeId: intent.id })
        if (!payment || payment.status === 'Completed') return

        // Mark payment completed
        payment.status = 'Completed'
        await payment.save()

        // Mark transaction completed
        transaction.status = 'Completed'
        await transaction.save()

        // Emit updates
        getSocket()?.to(transaction.userId.toString()).emit('transactionUpdated', transaction)
        getSocket()?.to(transaction.userId.toString()).emit('paymentUpdated', payment)

        console.log(`✅ Payment completed: ${payment._id}`)
    } catch (err) {
        console.error('❌ Error handling payment intent:', err)
    }
}
