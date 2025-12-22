// services/walletHooks.js
import Wallet from '../models/Wallet.js'
import Transaction from '../models/Transaction.js'
import { getSocket } from '../services/socket.js'
import { TRX_STATUS } from '../config/transactionConfig.js'

/**
 * Emit a WebSocket event safely
 * @param {string} userId - Target user ID
 * @param {string} event - Event name
 * @param {any} payload - Data to emit
 */
const emitEvent = (userId, event, payload) => {
  try {
    getSocket()?.to(userId.toString()).emit(event, payload)
  } catch (err) {
    console.error(`Error emitting event "${event}" to user ${userId}:`, err)
  }
}

/**
 * Handle a completed wallet funding intent
 * @param {Object} data - Payment intent data (e.g., Stripe webhook)
 */
export const handleFundingIntent = async (data) => {
  if (!data?.id) return

  try {
    const transaction = await Transaction.findOne({ externalRef: data.id })
    if (!transaction || transaction.status !== TRX_STATUS.PENDING) return

    // Mark transaction as completed
    transaction.status = TRX_STATUS.COMPLETED
    await transaction.save()

    // Update wallet balance
    const wallet = await Wallet.findById(transaction.walletId)
    if (wallet) {
      wallet.balance += transaction.amount
      await wallet.save()
      emitEvent(wallet.userId, 'walletUpdated', wallet)
    }

    emitEvent(transaction.userId, 'transactionUpdated', transaction)
    console.log(`Funding completed for transaction ${transaction._id}`)
  } catch (err) {
    console.error('Error handling funding intent:', err)
  }
}

/**
 * Handle a completed wallet withdrawal intent
 * @param {Object} data - Withdrawal intent data (e.g., Stripe webhook)
 */
export const handleWithdrawalIntent = async (data) => {
  if (!data?.id) return

  try {
    const transaction = await Transaction.findOne({ externalRef: data.id })
    if (!transaction || transaction.status !== TRX_STATUS.PENDING) return

    transaction.status = TRX_STATUS.COMPLETED
    await transaction.save()

    emitEvent(transaction.userId, 'transactionUpdated', transaction)
    console.log(`Withdrawal completed for transaction ${transaction._id}`)
  } catch (err) {
    console.error('Error handling withdrawal intent:', err)
  }
}
