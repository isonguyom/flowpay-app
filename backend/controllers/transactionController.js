import Transaction from '../models/Transaction.js'
import { getSocket } from '../services/socket.js'

/**
 * Get all transactions for the logged-in user
 * Optional query params: type, status, startDate, endDate
 */
export const getUserTransactions = async (req, res) => {
    try {
        const { type, status, startDate, endDate } = req.query
        const query = { user: req.user._id }

        if (type) query.type = type.toUpperCase()
        if (status) query.status = status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()
        if (startDate || endDate) query.createdAt = {}
        if (startDate) query.createdAt.$gte = new Date(startDate)
        if (endDate) query.createdAt.$lte = new Date(endDate)

        const transactions = await Transaction.find(query).sort({ createdAt: -1 })

        res.json({ transactions })
    } catch (err) {
        console.error('Error fetching transactions:', err)
        res.status(500).json({ message: 'Server error', error: err.message })
    }
}

/**
 * Emit transaction updates via Socket.IO
 * @param {Object} transaction - Transaction object
 */
export const emitTransactionUpdate = (transaction) => {
    try {
        const io = getSocket()
        io.to(transaction.user.toString()).emit('transaction:created', transaction)
        console.log(`WebSocket emitted transaction:created for user ${transaction.user}`)
    } catch (err) {
        console.error('Failed to emit transaction update:', err.message)
    }
}
