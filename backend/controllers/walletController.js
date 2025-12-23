import Wallet from '../models/Wallet.js'
import Transaction from '../models/Transaction.js'
import { TRX_STATUS, TRX_TYPE } from '../config/transactionConfig.js'
import { emit } from '../helpers/walletControllerHelpers.js'

// --------------------
// Create wallet
// --------------------
export const createWallet = async (req, res) => {
    try {
        const userId = req.user?._id
        const { currency } = req.body

        if (!userId) return res.status(401).json({ message: 'Unauthorized' })
        if (!currency) return res.status(400).json({ message: 'Currency is required' })

        const exists = await Wallet.findOne({ userId, currency })
        if (exists) {
            return res.status(409).json({ message: `Wallet for ${currency} already exists` })
        }

        const wallet = await Wallet.create({
            userId,
            currency,
            balance: 0,
            status: 'Active',
        })

        emit(userId, 'walletCreated', wallet)

        return res.status(201).json({ message: 'Wallet created successfully', wallet })
    } catch (err) {
        console.error(err)
        return res.status(500).json({ message: 'Failed to create wallet' })
    }
}

// --------------------
// Fund wallet
// --------------------
export const fundWallet = async (req, res) => {
    try {
        const userId = req.user?._id
        const { walletId, amount, fundingAccount = '' } = req.body

        if (!userId) return res.status(401).json({ message: 'Unauthorized' })
        if (!amount || amount <= 0) return res.status(400).json({ message: 'Invalid amount' })

        const wallet = await Wallet.findOne({ _id: walletId, userId })
        if (!wallet) return res.status(404).json({ message: 'Wallet not found' })
        if (wallet.status !== 'Active') return res.status(403).json({ message: 'Wallet is not active' })

        // 1️⃣ Create transaction
        const transaction = await Transaction.create({
            userId,
            walletId,
            type: TRX_TYPE.FUND,
            amount,
            sourceCurrency: wallet.currency,
            destinationCurrency: wallet.currency,
            fundingAccount,
            status: TRX_STATUS.PENDING,
        })

        emit(userId, 'transactionCreated', transaction)

        // 2️⃣ Fund wallet immediately
        wallet.balance += amount
        await wallet.save()

        // 3️⃣ Complete transaction
        transaction.status = TRX_STATUS.COMPLETED
        await transaction.save()

        emit(userId, 'walletUpdated', wallet)
        emit(userId, 'transactionUpdated', transaction)

        return res.status(201).json({ wallet, transaction })
    } catch (err) {
        console.error(err)
        return res.status(500).json({ message: 'Failed to fund wallet' })
    }
}

// --------------------
// Withdraw from wallet
// --------------------
export const withdrawFromWallet = async (req, res) => {
    try {
        const userId = req.user?._id
        const { walletId, amount, recipient = '' } = req.body

        if (!userId) return res.status(401).json({ message: 'Unauthorized' })
        if (!amount || amount <= 0) return res.status(400).json({ message: 'Invalid amount' })

        const wallet = await Wallet.findOne({ _id: walletId, userId })
        if (!wallet) return res.status(404).json({ message: 'Wallet not found' })
        if (wallet.status !== 'Active') return res.status(403).json({ message: 'Wallet is not active' })
        if (wallet.balance < amount) return res.status(400).json({ message: 'Insufficient balance' })

        // 1️⃣ Deduct balance
        wallet.balance -= amount
        await wallet.save()

        // 2️⃣ Create completed transaction
        const transaction = await Transaction.create({
            userId,
            walletId,
            type: TRX_TYPE.WITHDRAW,
            amount,
            sourceCurrency: wallet.currency,
            destinationCurrency: wallet.currency,
            beneficiary: recipient,
            status: TRX_STATUS.COMPLETED,
        })

        emit(userId, 'walletUpdated', wallet)
        emit(userId, 'transactionCreated', transaction)

        return res.status(200).json({ wallet, transaction })
    } catch (err) {
        console.error(err)
        return res.status(500).json({ message: 'Failed to withdraw from wallet' })
    }
}

// --------------------
// Get wallets
// --------------------
export const getWallets = async (req, res) => {
    try {
        const userId = req.user?._id
        if (!userId) return res.status(401).json({ message: 'Unauthorized' })

        const wallets = await Wallet.find({ userId }).sort({ createdAt: 1 })
        return res.json({ wallets })
    } catch (err) {
        console.error(err)
        return res.status(500).json({ message: 'Failed to fetch wallets' })
    }
}
