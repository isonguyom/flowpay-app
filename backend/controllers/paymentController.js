import Payment from '../models/Payment.js'
import Transaction from '../models/Transaction.js'
import Wallet from '../models/Wallet.js'
import { getStripe } from '../services/stripeService.js'
import { processPaymentResult } from '../services/paymentProcessor.js'
import { isNewPaymentFlowEnabled } from '../config/featureFlags.js'
import { getSocket } from '../services/socket.js'

const stripe = getStripe()

export const makePayment = async (req, res) => {
    const userId = req.user._id
    const { beneficiary, amount, sourceWallet, destinationCurrency, fxRate, fee = 0 } = req.body
    const totalDebitable = amount + fee

    try {
        const useNewFlow = isNewPaymentFlowEnabled(userId)
        if (useNewFlow) console.log('Using new payment flow for user:', userId)

        // 1️⃣ Fetch & validate wallet
        const wallet = await Wallet.findOne({ user: userId, currency: sourceWallet })
        if (!wallet) return res.status(404).json({ message: 'Source wallet not found' })
        if (wallet.amount < totalDebitable) return res.status(400).json({ message: 'Insufficient wallet balance' })

        // 2️⃣ Deduct wallet balance
        wallet.amount -= totalDebitable
        await wallet.save()

        // Emit wallet update
        try {
            getSocket().to(userId.toString()).emit('walletUpdated', wallet)
        } catch (err) {
            console.error('Socket emit failed for walletUpdated:', err.message)
        }

        // 3️⃣ Create pending transaction
        const transaction = await Transaction.create({
            user: userId,
            type: 'PAYMENT',
            fundingAccount: sourceWallet,
            recipient: beneficiary,
            beneficiary,
            amount,
            settlementAmount: amount * fxRate,
            fee,
            sourceCurrency: sourceWallet,
            destinationCurrency,
            fxRate,
            status: 'Pending',
            flow: useNewFlow ? 'new' : 'old'
        })

        // Emit transaction creation
        try {
            getSocket().to(userId.toString()).emit('transactionCreated', transaction)
        } catch (err) {
            console.error('Socket emit failed for transactionCreated:', err.message)
        }

        // 4️⃣ Create Stripe PaymentIntent
        const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(amount * 100),
            currency: destinationCurrency.toLowerCase(),
            metadata: {
                userId: userId.toString(),
                transactionId: transaction._id.toString(),
                type: 'PAYMENT',
                flow: useNewFlow ? 'new' : 'old'
            }
        })

        // 5️⃣ Create payment record
        const payment = await Payment.create({
            user: userId,
            beneficiary,
            amount,
            sourceWallet,
            destinationCurrency,
            fxRate,
            fee,
            settlementAmount: amount * fxRate,
            stripeId: paymentIntent.id,
            status: 'Pending'
        })

        // 6️⃣ Optional: simulate webhook in dev mode
        setTimeout(async () => {
            await processPaymentResult({
                transactionId: transaction._id,
                paymentId: payment._id,
                status: 'Completed'
            })
        }, 3000)

        // 7️⃣ Respond to frontend
        res.status(201).json({
            transactionId: transaction._id,
            paymentId: payment._id,
            clientSecret: paymentIntent.client_secret,
            flow: useNewFlow ? 'new' : 'old'
        })
    } catch (err) {
        console.error('Payment creation failed:', err)
        res.status(500).json({ message: 'Payment processing failed', error: err.message })
    }
}
