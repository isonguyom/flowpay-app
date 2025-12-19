import Wallet from '../models/Wallet.js'
import Transaction from '../models/Transaction.js'
import { getSocket } from '../services/socket.js'

// --------------------
// Create a new wallet
// --------------------
export const createWallet = async (req, res) => {
    try {
        const userId = req.user._id
        const { currency } = req.body

        if (!currency) {
            return res.status(400).json({ message: 'Currency is required' })
        }

        const existingWallet = await Wallet.findOne({ user: userId, currency })
        if (existingWallet) {
            return res.status(409).json({ message: `Wallet for ${currency} already exists` })
        }

        const wallet = await Wallet.create({ user: userId, currency })
        res.status(201).json({ message: 'Wallet created successfully', wallet })

        // Emit WebSocket update
        getSocket()?.to(userId.toString()).emit('walletCreated', wallet)
    } catch (err) {
        console.error(err)
        res.status(500).json({ message: 'Failed to create wallet' })
    }
}

// --------------------
// Get all wallets for user
// --------------------
export const getWallets = async (req, res) => {
    try {
        const wallets = await Wallet.find({ user: req.user._id }).sort({ createdAt: 1 })
        res.json({ wallets })
    } catch (err) {
        console.error(err)
        res.status(500).json({ message: 'Failed to fetch wallets' })
    }
}

// --------------------
// Fund wallet
// --------------------
export const fundWallet = async (req, res) => {
    try {
        const userId = req.user._id
        const { walletId, amount } = req.body

        if (!amount || amount <= 0) {
            return res.status(400).json({ message: 'Invalid amount' })
        }

        const wallet = await Wallet.findOne({ _id: walletId, user: userId })
        if (!wallet) return res.status(404).json({ message: 'Wallet not found' })
        if (wallet.status !== 'Active') return res.status(403).json({ message: 'Wallet is not active' })

        // Add amount
        wallet.amount += amount
        await wallet.save()

        // Create transaction
        const transaction = await Transaction.create({
            user: userId,
            type: 'FUND',
            amount,
            sourceCurrency: wallet.currency,
            destinationCurrency: wallet.currency,
            status: 'Pending',
        })

        // Simulate webhook to complete transaction after 2 seconds
        setTimeout(async () => {
            transaction.status = 'Completed'
            await transaction.save()

            // Emit Socket event for transaction update
            getSocket()?.to(userId.toString()).emit('transactionCreated', transaction)
        }, 2000)

        res.json({ message: 'Wallet funded successfully', wallet })
        getSocket()?.to(userId.toString()).emit('walletUpdated', wallet)
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
        const userId = req.user._id
        const { walletId, amount, recipient } = req.body

        if (!amount || amount <= 0) {
            return res.status(400).json({ message: 'Invalid amount' })
        }

        const wallet = await Wallet.findOne({ _id: walletId, user: userId })
        if (!wallet) return res.status(404).json({ message: 'Wallet not found' })
        if (wallet.status !== 'Active') return res.status(403).json({ message: 'Wallet is not active' })
        if (wallet.amount < amount) return res.status(400).json({ message: 'Insufficient wallet balance' })

        // Deduct amount
        wallet.amount -= amount
        await wallet.save()

        // Create transaction
        const transaction = await Transaction.create({
            user: userId,
            type: 'WITHDRAW',
            amount,
            sourceCurrency: wallet.currency,
            destinationCurrency: wallet.currency,
            recipient,
            status: 'Pending',
        })

        // Simulate webhook to complete transaction after 2 seconds
        setTimeout(async () => {
            transaction.status = 'Completed'
            await transaction.save()

            // Emit Socket event for transaction update
            getSocket()?.to(userId.toString()).emit('transactionCreated', transaction)
        }, 2000)

        res.json({ message: 'Withdrawal successful', wallet })
        getSocket()?.to(userId.toString()).emit('walletUpdated', wallet)
    } catch (err) {
        console.error(err)
        res.status(500).json({ message: 'Failed to withdraw from wallet' })
    }
}
