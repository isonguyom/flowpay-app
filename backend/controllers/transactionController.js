import Transaction from '../models/Transaction.js'
import { getSocket } from '../services/socket.js'
import {
    buildTransactionQuery
} from '../helpers/transactionControllerHelpers.js'


// ==================================== GET API CONTROLLER =================================
/**
 * GET /api/transactions
 * Fetch transactions for authenticated user
 */
export const getUserTransactions = async (req, res) => {
    const userId = req.user?._id

    if (!userId) {
        return res.status(401).json({ message: 'Unauthorized' })
    }

    try {
        const query = buildTransactionQuery({
            userId,
            type: req.query.type,
            status: req.query.status,
            startDate: req.query.startDate,
            endDate: req.query.endDate
        })

        const transactions = await Transaction
            .find(query)
            .sort({ createdAt: -1 })

        return res.json({ transactions })

    } catch (err) {
        console.error('[TransactionController] getUserTransactions failed', {
            userId: userId.toString(),
            error: err.message
        })

        return res.status(500).json({
            message: 'Failed to fetch transactions'
        })
    }
}

// ================================ SOCKET EMITTER =================================
/**
 * Emit transaction events via Socket.IO
 * This must NEVER throw or affect request lifecycle
 */
export const emitTransactionUpdate = (transaction) => {
    try {
        if (!transaction?._id || !transaction?.userId) {
            console.warn(
                '[Socket] emitTransactionUpdate skipped – invalid transaction',
                { transactionId: transaction?._id }
            )
            return
        }

        const io = getSocket()
        if (!io) return

        io
            .to(transaction.userId.toString())
            .emit('transactionCreated', transaction)

    } catch (err) {
        console.error('[Socket] Failed to emit transaction update', {
            transactionId: transaction?._id,
            error: err.message
        })
    }
}
