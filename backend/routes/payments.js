import express from 'express'
import { protect } from '../middleware/auth.js'
import Payment from '../models/Payment.js'
import Transaction from '../models/Transaction.js'
import Wallet from '../models/Wallet.js'

const router = express.Router()

// Create a new payment

router.post('/', protect, async (req, res) => {
    const {
        beneficiary,
        amount,
        sourceCurrency,
        destinationCurrency,
        fxRate,
        fee,
        settlementAmount,
    } = req.body

    if (!amount || amount <= 0) {
        return res.status(400).json({ message: 'Invalid payment amount' })
    }

    try {
        // 1️⃣ Find the wallet
        const wallet = await Wallet.findOne({
            user: req.user._id,
            currency: sourceCurrency,
        })

        if (!wallet) {
            return res.status(404).json({ message: 'Wallet not found' })
        }

        const totalDebit = Number(amount) + Number(fee || 0)

        if (wallet.amount < totalDebit) {
            return res.status(400).json({ message: 'Insufficient wallet balance' })
        }

        // 2️⃣ Deduct from wallet
        wallet.amount -= totalDebit
        await wallet.save()

        // 3️⃣ Create Payment
        const payment = await Payment.create({
            user: req.user._id,
            beneficiary,
            amount,
            sourceCurrency,
            destinationCurrency,
            fxRate,
            fee,
            settlementAmount,
            status: 'Pending',
        })

        // 4️⃣ Create Transaction
        const transaction = await Transaction.create({
            user: req.user._id,
            type: 'PAYMENT',
            amount,
            sourceCurrency,
            destinationCurrency,
            beneficiary,
            settlementAmount,
            status: 'Completed', // payment deducted, transaction completed
        })

        res.status(201).json({ payment, transaction, wallet })
    } catch (err) {
        console.error('Make payment error:', err)
        res.status(500).json({ message: 'Server error' })
    }
})


// Fetch all payments for the authenticated user
router.get('/', protect, async (req, res) => {
    try {
        const payments = await Payment.find({ user: req.user._id }).sort({ createdAt: -1 })
        res.json({ transactions: payments })
    } catch (err) {
        console.error(err)
        res.status(500).json({ message: 'Server error' })
    }
})

export default router
