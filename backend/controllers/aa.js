import Wallet from '../models/Wallet.js'
import Transaction from '../models/Transaction.js'
import { getSocket } from '../services/socket.js'
import { getStripe } from '../services/stripeService.js'
import { TRX_STATUS, TRX_TYPE } from '../config/transactionConfig.js'

const stripe = getStripe()

const emit = (userId, event, payload) => {
    try {
        getSocket()?.to(userId.toString()).emit(event, payload)
    } catch (err) {
        console.error(`Socket emit failed [${event}]`, err)
    }
}

/* -------------------------------------------------------------------------- */
/*                                CREATE WALLET                               */
/* -------------------------------------------------------------------------- */
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

        const wallet = await Wallet.create({ userId, currency, balance: 0 })
        emit(userId, 'walletCreated', wallet)

        res.status(201).json({ wallet })
    } catch (err) {
        console.error('Create wallet error:', err)
        res.status(500).json({ message: 'Failed to create wallet' })
    }
}

/* -------------------------------------------------------------------------- */
/*                                FUND WALLET                                 */
/* -------------------------------------------------------------------------- */
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

        const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(amount * 100),
            currency: wallet.currency.toLowerCase(),
            automatic_payment_methods: { enabled: true },
            metadata: {
                userId: userId.toString(),
                walletId: wallet._id.toString(),
                type: TRX_TYPE.FUND,
            },
        })

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


        emit(userId, 'transactionCreated', transaction)

        res.status(201).json({
            clientSecret: paymentIntent.client_secret,
            transactionId: transaction._id,
        })
    } catch (err) {
        console.error('Fund wallet error:', err)
        res.status(500).json({ message: 'Failed to initiate funding' })
    }
}

/* -------------------------------------------------------------------------- */
/*                              WITHDRAW WALLET                               */
/* -------------------------------------------------------------------------- */
// --------------------
export const withdrawFromWallet = async (req, res) => {
    try {
        const userId = req.user?._id
        const { walletId, amount, beneficiary } = req.body

        if (!userId) return res.status(401).json({ message: 'Unauthorized' })
        if (!amount || amount <= 0) return res.status(400).json({ message: 'Invalid amount' })

        const wallet = await Wallet.findOne({ _id: walletId, userId })
        if (!wallet) return res.status(404).json({ message: 'Wallet not found' })
        if (wallet.status !== 'Active') return res.status(403).json({ message: 'Wallet is not active' })
        if (wallet.balance < amount) return res.status(400).json({ message: 'Insufficient balance' })

        // Deduct wallet balance
        wallet.balance -= amount
        await wallet.save()

        const payout = await stripe.payouts.create({
            amount: Math.round(amount * 100),
            currency: wallet.currency,
            beneficiary,
            metadata: {
                userId: userId.toString(),
                walletId: wallet._id.toString(),
                type: TRX_TYPE.WITHDRAW,
            },
        })

        // Create transaction
        const transaction = await Transaction.create({
            userId,
            walletId,
            type: TRX_TYPE.WITHDRAW,
            amount,
            sourceCurrency: wallet.currency.toUpperCase(),
            destinationCurrency: wallet.currency.toUpperCase(),
            beneficiary,
            status: TRX_STATUS.PENDING,
        })

        emit(userId, 'transactionCreated', transaction)

        res.json({ wallet, transaction, clientSecret: payout.client_secret })
    } catch (err) {
        console.error(err)
        res.status(500).json({ message: 'Failed to withdraw from wallet' })
    }
}


/* -------------------------------------------------------------------------- */
/*                                 GET WALLETS                                */
/* -------------------------------------------------------------------------- */
export const getWallets = async (req, res) => {
    try {
        const wallets = await Wallet.find({ userId: req.user._id }).sort({ createdAt: 1 })
        res.json({ wallets })
    } catch (err) {
        console.error('Get wallets error:', err)
        res.status(500).json({ message: 'Failed to fetch wallets' })
    }
}
