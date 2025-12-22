// controllers/walletController.js
import Wallet from '../models/Wallet.js'
import Transaction from '../models/Transaction.js'
import { getSocket } from '../services/socket.js'
import { TRX_STATUS, TRX_TYPE } from '../config/transactionConfig.js'

// --------------------
// Create a new wallet
// --------------------
export const createWallet = async (req, res) => {
    try {
        const userId = req.user?._id
        const { currency } = req.body

        if (!userId) return res.status(401).json({ message: 'Unauthorized' })
        if (!currency) return res.status(400).json({ message: 'Currency is required' })

        const existingWallet = await Wallet.findOne({ userId, currency })
        if (existingWallet) return res.status(409).json({ message: `Wallet for ${currency} already exists` })

        const wallet = await Wallet.create({ userId, currency })
        res.status(201).json({ message: 'Wallet created successfully', wallet })

        getSocket()?.to(userId.toString()).emit('walletCreated', wallet)
    } catch (err) {
        console.error(err)
        res.status(500).json({ message: 'Failed to create wallet' })
    }
}

// --------------------
// Fund wallet
// --------------------
export const fundWallet = async (req, res) => {
    try {
        const userId = req.user?._id
        const { walletId, amount, fundingAccount } = req.body

        if (!userId) return res.status(401).json({ message: 'Unauthorized' })
        if (!amount || amount <= 0) return res.status(400).json({ message: 'Invalid amount' })

        const wallet = await Wallet.findOne({ _id: walletId, userId })
        if (!wallet) return res.status(404).json({ message: 'Wallet not found' })
        if (wallet.status !== 'Active') return res.status(403).json({ message: 'Wallet is not active' })

        // Update wallet balance
        wallet.balance += amount
        await wallet.save()

        // Create transaction
        const transaction = await Transaction.create({
            userId,
            walletId,
            type: TRX_TYPE.FUND,
            amount,
            sourceCurrency: wallet.currency,
            destinationCurrency: wallet.currency,
            fundingAccount: fundingAccount || '',
            status: TRX_STATUS.PENDING,
        })

        // Emit WebSocket update
        getSocket()?.to(userId.toString()).emit('walletUpdated', wallet)
        getSocket()?.to(userId.toString()).emit('transactionCreated', transaction)

        // Simulate webhook / completion
        setTimeout(async () => {
            transaction.status = TRX_STATUS.COMPLETED
            await transaction.save()
            getSocket()?.to(userId.toString()).emit('transactionUpdated', transaction)
        }, 2000)

        res.json({ message: 'Wallet funded successfully', wallet, transaction })
    } catch (err) {
        console.error(err)
        res.status(500).json({ message: 'Failed to fund wallet' })
    }
}

// --------------------
// Withdraw from wallet
// --------------------
export const withdrawFromWallet = async (req, res) => {
    try {
        const userId = req.user?._id
        const { walletId, amount, recipient } = req.body

        if (!userId) return res.status(401).json({ message: 'Unauthorized' })
        if (!amount || amount <= 0) return res.status(400).json({ message: 'Invalid amount' })

        const wallet = await Wallet.findOne({ _id: walletId, userId })
        if (!wallet) return res.status(404).json({ message: 'Wallet not found' })
        if (wallet.status !== 'Active') return res.status(403).json({ message: 'Wallet is not active' })
        if (wallet.balance < amount) return res.status(400).json({ message: 'Insufficient balance' })

        // Deduct wallet balance
        wallet.balance -= amount
        await wallet.save()

        // Create transaction
        const transaction = await Transaction.create({
            userId,
            walletId,
            type: TRX_TYPE.WITHDRAW,
            amount,
            sourceCurrency: wallet.currency,
            destinationCurrency: wallet.currency,
            beneficiary: recipient || '',
            status: TRX_STATUS.PENDING,
        })

        // Emit WebSocket update
        getSocket()?.to(userId.toString()).emit('walletUpdated', wallet)
        getSocket()?.to(userId.toString()).emit('transactionCreated', transaction)

        // Simulate webhook / completion
        setTimeout(async () => {
            transaction.status = TRX_STATUS.COMPLETED
            await transaction.save()
            getSocket()?.to(userId.toString()).emit('transactionUpdated', transaction)
        }, 2000)

        res.json({ message: 'Withdrawal successful', wallet, transaction })
    } catch (err) {
        console.error(err)
        res.status(500).json({ message: 'Failed to withdraw from wallet' })
    }
}

// --------------------
// Get wallets
// --------------------
export const getWallets = async (req, res) => {
    try {
        const wallets = await Wallet.find({ userId: req.user._id }).sort({ createdAt: 1 })
        res.json({ wallets })
    } catch (err) {
        console.error(err)
        res.status(500).json({ message: 'Failed to fetch wallets' })
    }
}
