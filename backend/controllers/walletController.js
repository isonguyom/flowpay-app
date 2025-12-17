import Wallet from '../models/Wallet.js'
import Transaction from '../models/Transaction.js'


// @desc    Get all wallets for the authenticated user
// @route   GET /api/wallets
// @access  Private
export const getWallets = async (req, res) => {
    try {
        const wallets = await Wallet.find({ user: req.user._id })
        res.json({ wallets })
    } catch (err) {
        console.error(err)
        res.status(500).json({ message: 'Server error' })
    }
}

export const createWallet = async (req, res) => {
    try {
        console.log('Create wallet request body:', req.body)
        console.log('Authenticated user:', req.user)

        const { currency, amount } = req.body

        if (!currency) {
            return res.status(400).json({ message: 'Currency is required' })
        }

        const existing = await Wallet.findOne({ user: req.user.id, currency })
        if (existing) {
            return res.status(400).json({ message: `Wallet for ${currency} already exists` })
        }

        const wallet = await Wallet.create({
            user: req.user.id,
            currency,
            amount: amount || 0,
            status: 'Active',
        })

        res.status(201).json({ wallet })
    } catch (err) {
        console.error('Create wallet error:', err)
        res.status(500).json({ message: 'Failed to create wallet' })
    }
}



// @desc    Fund a wallet
// @route   PATCH /api/wallets/:walletId/fund
// @access  Private
export const fundWallet = async (req, res) => {
    const { amount, fundingAccount } = req.body
    const { walletId } = req.params

    if (!amount || amount <= 0) {
        return res.status(400).json({ message: 'Invalid amount' })
    }

    try {
        const wallet = await Wallet.findOne({
            _id: walletId,
            user: req.user._id,
        })

        if (!wallet) {
            return res.status(404).json({ message: 'Wallet not found' })
        }

        // 1️⃣ Update wallet balance
        wallet.amount += amount
        await wallet.save()

        // 2️⃣ Create transaction
        const transaction = await Transaction.create({
            user: req.user._id,
            type: 'FUND',
            amount,
            sourceCurrency: wallet.currency,
            destinationCurrency: wallet.currency,
            fundingAccount: fundingAccount || 'External Account',
            settlementAmount: amount,
            status: 'Completed',
        })

        res.json({ wallet, transaction })
    } catch (err) {
        console.error('Fund wallet error:', err)
        res.status(500).json({ message: 'Server error' })
    }
}



// @desc    Withdraw from a wallet
// @route   PATCH /api/wallets/:walletId/withdraw
// @access  Private
export const withdrawWallet = async (req, res) => {
    const { amount, recipient } = req.body
    const { walletId } = req.params

    if (!amount || amount <= 0) {
        return res.status(400).json({ message: 'Invalid amount' })
    }

    try {
        const wallet = await Wallet.findOne({
            _id: walletId,
            user: req.user._id,
        })

        if (!wallet) {
            return res.status(404).json({ message: 'Wallet not found' })
        }

        if (wallet.amount < amount) {
            return res.status(400).json({ message: 'Insufficient balance' })
        }

        // 1️⃣ Deduct balance
        wallet.amount -= amount
        await wallet.save()

        // 2️⃣ Create transaction
        const transaction = await Transaction.create({
            user: req.user._id,
            type: 'WITHDRAW',
            amount,
            sourceCurrency: wallet.currency,
            destinationCurrency: wallet.currency,
            recipient: recipient || 'External Recipient',
            settlementAmount: amount,
            status: 'Completed',
        })

        res.json({ wallet, transaction })
    } catch (err) {
        console.error('Withdraw wallet error:', err)
        res.status(500).json({ message: 'Server error' })
    }
}

