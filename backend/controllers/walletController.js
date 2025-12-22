// controllers/walletController.js
import Wallet from '../models/Wallet.js'
import Transaction from '../models/Transaction.js'
import { TRX_STATUS, TRX_TYPE } from '../config/transactionConfig.js'
import { emitEvent, ensureAuthenticated } from '../helpers/walletControllerHelpers.js'


/**
 * Create a new wallet for the authenticated user
 */
export const createWallet = async (req, res) => {
  try {
    if (!ensureAuthenticated(req, res)) return

    const { currency } = req.body
    if (!currency) return res.status(400).json({ message: 'Currency is required' })

    const userId = req.user._id
    const existingWallet = await Wallet.findOne({ userId, currency })
    if (existingWallet) return res.status(409).json({ message: `Wallet for ${currency} already exists` })

    const wallet = await Wallet.create({ userId, currency })
    emitEvent(userId, 'walletCreated', wallet)

    res.status(201).json({ message: 'Wallet created successfully', wallet })
  } catch (err) {
    console.error('createWallet error:', err)
    res.status(500).json({ message: 'Failed to create wallet' })
  }
}

/**
 * Fund a user's wallet
 */
export const fundWallet = async (req, res) => {
  try {
    if (!ensureAuthenticated(req, res)) return

    const { walletId, amount, fundingAccount } = req.body
    if (!amount || amount <= 0) return res.status(400).json({ message: 'Invalid amount' })

    const wallet = await Wallet.findOne({ _id: walletId, userId: req.user._id })
    if (!wallet) return res.status(404).json({ message: 'Wallet not found' })
    if (wallet.status !== 'Active') return res.status(403).json({ message: 'Wallet is not active' })

    wallet.balance += amount
    await wallet.save()

    const transaction = await Transaction.create({
      userId: req.user._id,
      walletId,
      type: TRX_TYPE.FUND,
      amount,
      sourceCurrency: wallet.currency,
      destinationCurrency: wallet.currency,
      fundingAccount: fundingAccount || '',
      status: TRX_STATUS.PENDING,
    })

    emitEvent(req.user._id, 'walletUpdated', wallet)
    emitEvent(req.user._id, 'transactionCreated', transaction)

    // Simulate async completion (e.g., webhook)
    setTimeout(async () => {
      transaction.status = TRX_STATUS.COMPLETED
      await transaction.save()
      emitEvent(req.user._id, 'transactionUpdated', transaction)
    }, 2000)

    res.json({ message: 'Wallet funded successfully', wallet, transaction })
  } catch (err) {
    console.error('fundWallet error:', err)
    res.status(500).json({ message: 'Failed to fund wallet' })
  }
}

/**
 * Withdraw from a user's wallet
 */
export const withdrawFromWallet = async (req, res) => {
  try {
    if (!ensureAuthenticated(req, res)) return

    const { walletId, amount, recipient } = req.body
    if (!amount || amount <= 0) return res.status(400).json({ message: 'Invalid amount' })

    const wallet = await Wallet.findOne({ _id: walletId, userId: req.user._id })
    if (!wallet) return res.status(404).json({ message: 'Wallet not found' })
    if (wallet.status !== 'Active') return res.status(403).json({ message: 'Wallet is not active' })
    if (wallet.balance < amount) return res.status(400).json({ message: 'Insufficient balance' })

    wallet.balance -= amount
    await wallet.save()

    const transaction = await Transaction.create({
      userId: req.user._id,
      walletId,
      type: TRX_TYPE.WITHDRAW,
      amount,
      sourceCurrency: wallet.currency,
      destinationCurrency: wallet.currency,
      beneficiary: recipient || '',
      status: TRX_STATUS.PENDING,
    })

    emitEvent(req.user._id, 'walletUpdated', wallet)
    emitEvent(req.user._id, 'transactionCreated', transaction)

    setTimeout(async () => {
      transaction.status = TRX_STATUS.COMPLETED
      await transaction.save()
      emitEvent(req.user._id, 'transactionUpdated', transaction)
    }, 2000)

    res.json({ message: 'Withdrawal successful', wallet, transaction })
  } catch (err) {
    console.error('withdrawFromWallet error:', err)
    res.status(500).json({ message: 'Failed to withdraw from wallet' })
  }
}

/**
 * Get all wallets for the authenticated user
 */
export const getWallets = async (req, res) => {
  try {
    if (!ensureAuthenticated(req, res)) return

    const wallets = await Wallet.find({ userId: req.user._id }).sort({ createdAt: 1 })
    res.json({ wallets })
  } catch (err) {
    console.error('getWallets error:', err)
    res.status(500).json({ message: 'Failed to fetch wallets' })
  }
}
