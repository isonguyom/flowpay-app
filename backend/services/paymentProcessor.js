import Transaction from '../models/Transaction.js'
import Payment from '../models/Payment.js'
import { getSocket } from './socket.js' // import your socket service

/**
 * Process payment result and update related models
 * @param {Object} param0
 * @param {string} param0.transactionId
 * @param {string} param0.paymentId
 * @param {string} param0.status - 'Completed' | 'Failed' | 'Pending'
 */
export const processPaymentResult = async ({ transactionId, paymentId, status }) => {
    try {
        // 1️⃣ Update transaction
        const transaction = await Transaction.findById(transactionId)
        if (!transaction) {
            console.warn(`Transaction ${transactionId} not found`)
            return
        }

        transaction.status = status
        await transaction.save()

        // 2️⃣ Update payment if provided
        if (paymentId) {
            await Payment.findByIdAndUpdate(paymentId, { status }, { new: true })
        }

        // 3️⃣ Emit WebSocket update to the specific user
        try {
            const io = getSocket()
            io.to(transaction.user.toString()).emit('transactionUpdated', transaction)
            console.log(`WebSocket emitted transactionUpdated for user ${transaction.user}`)
        } catch (err) {
            console.error('Socket emit failed:', err.message)
        }

        return transaction
    } catch (err) {
        console.error('Processing payment result failed:', err)
    }
}
