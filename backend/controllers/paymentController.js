import mongoose from 'mongoose'
import Payment from '../models/Payment.js'
import Transaction from '../models/Transaction.js'
import Wallet from '../models/Wallet.js'
import { getStripe } from '../services/stripeService.js'
import { processPaymentResult } from '../processors/paymentProcessor.js'
import { isNewPaymentFlowEnabled } from '../config/featureFlags.js'
import { getSocket } from '../services/socket.js'

const stripe = getStripe()

export const makePayment = async (req, res) => {
    const user = req.user
    if (!user?._id) {
        console.error('makePayment failed: no authenticated user')
        return res.status(401).json({ message: 'Unauthorized' })
    }

    const userId = user._id
    console.log('makePayment called by user:', userId)

    let { beneficiary, amount, sourceWallet, destinationCurrency, fxRate, fee = 0 } = req.body
    amount = Number(amount)
    fee = Number(fee)
    const totalDebitable = amount + fee

    let wallet, transaction, payment
    try {
        // -----------------------------
        // 1️⃣ Normalize currencies
        // -----------------------------
        if (!sourceWallet || !destinationCurrency) {
            return res.status(400).json({ message: 'Source and destination currencies are required' })
        }
        const srcCurrency = sourceWallet.toUpperCase()
        const destCurrency = destinationCurrency.toUpperCase()

        // -----------------------------
        // 2️⃣ Fetch source wallet
        // -----------------------------
        wallet = await Wallet.findOne({ userId, currency: srcCurrency })
        if (!wallet) {
            console.error(`Source wallet (${srcCurrency}) not found for user ${userId}`)
            return res.status(404).json({ message: `Source wallet (${srcCurrency}) not found` })
        }

        if (wallet.balance < totalDebitable) {
            console.error(`Insufficient wallet balance for user ${userId}. Wallet: ${wallet.balance}, required: ${totalDebitable}`)
            return res.status(400).json({ message: 'Insufficient wallet balance' })
        }

        // -----------------------------
        // 3️⃣ Deduct wallet balance
        // -----------------------------
        wallet.balance -= totalDebitable
        await wallet.save()
        console.log(`Wallet balance deducted. New balance: ${wallet.balance}`)

        // Emit wallet update
        try { getSocket()?.to(userId.toString()).emit('walletUpdated', wallet) } 
        catch (err) { console.error('Socket emit failed for walletUpdated:', err.message) }

        // -----------------------------
        // 4️⃣ Create transaction
        // -----------------------------
        const settlementAmount = Number((amount * fxRate).toFixed(2))
        const useNewFlow = isNewPaymentFlowEnabled(userId)

        try {
            transaction = await Transaction.create({
                userId,
                type: 'PAYMENT',
                fundingAccount: srcCurrency,
                walletId: wallet._id,
                beneficiary,
                amount,
                settlementAmount,
                fee,
                sourceCurrency: srcCurrency,
                destinationCurrency: destCurrency,
                fxRate,
                status: 'Pending',
            })
            console.log('Transaction created:', transaction._id)

            // Emit transaction
            try { getSocket()?.to(userId.toString()).emit('transactionCreated', transaction) } 
            catch (err) { console.error('Socket emit failed for transactionCreated:', err.message) }

        } catch (trxErr) {
            console.error('Transaction creation failed:', trxErr)
            // Manual rollback: restore wallet balance
            wallet.balance += totalDebitable
            await wallet.save()
            console.log('Wallet balance restored due to transaction failure')
            return res.status(500).json({ message: 'Transaction creation failed, payment rolled back', error: trxErr.message })
        }

        // -----------------------------
        // 5️⃣ Create Stripe PaymentIntent
        // -----------------------------
        const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(amount * 100),
            currency: destCurrency.toLowerCase(),
            metadata: {
                userId: userId.toString(),
                transactionId: transaction._id.toString(),
                flow: useNewFlow ? 'new' : 'old'
            }
        })

        // -----------------------------
        // 6️⃣ Create Payment record
        // -----------------------------
        try {
            payment = await Payment.create({
                userId,
                beneficiary,
                amount,
                sourceWalletId: wallet._id,
                destinationCurrency: destCurrency,
                fxRate,
                fee,
                settlementAmount,
                stripeId: paymentIntent.id,
                status: 'Pending'
            })
            transaction.paymentId = payment._id
            await transaction.save()
            console.log('Payment record created:', payment._id)
        } catch (payErr) {
            console.error('Payment creation failed:', payErr)
            // Manual rollback: restore wallet balance and delete transaction
            wallet.balance += totalDebitable
            await wallet.save()
            await Transaction.findByIdAndDelete(transaction._id)
            console.log('Rolled back transaction and restored wallet due to payment failure')
            return res.status(500).json({ message: 'Payment creation failed, transaction rolled back', error: payErr.message })
        }

        // -----------------------------
        // 7️⃣ Simulate webhook (dev only)
        // -----------------------------
        if (process.env.NODE_ENV !== 'production') {
            setTimeout(() => {
                processPaymentResult({
                    transactionId: transaction._id,
                    paymentId: payment._id,
                    status: 'Completed'
                })
            }, 3000)
        }

        // -----------------------------
        // 8️⃣ Respond to frontend
        // -----------------------------
        res.status(201).json({
            transactionId: transaction._id,
            paymentId: payment._id,
            clientSecret: paymentIntent.client_secret,
            flow: useNewFlow ? 'new' : 'old'
        })

    } catch (err) {
        console.error('makePayment failed:', err)
        // Rollback if transaction or wallet exists
        if (wallet) {
            wallet.balance += totalDebitable
            await wallet.save()
            console.log('Wallet balance restored due to general failure')
        }
        if (transaction) {
            await Transaction.findByIdAndDelete(transaction._id)
            console.log('Transaction deleted due to general failure')
        }
        res.status(500).json({ message: 'Payment processing failed', error: err.message })
    }
}
