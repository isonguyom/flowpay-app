import { getStripe } from '../services/stripeService.js'
import Transaction from '../models/Transaction.js'
import Wallet from '../models/Wallet.js'
import { TRX_STATUS } from '../config/transactionConfig.js'
import { emit } from '../helpers/paymentControllerHelpers.js'

export const handleStripeWebhook = async (req, res) => {
    const sig = req.headers['stripe-signature']
    let event

    // Stripe must be called at run time
    const stripe = getStripe()

    try {
        // ⚠  body is required for signature verification
        event = stripe.webhooks.constructEvent(
            req.body,
            sig,
            process.env.STRIPE_WEBHOOK_SECRET
        )
    } catch (err) {
        console.error('Stripe webhook signature verification failed:', err.message)
        return res.status(400).send(`Webhook Error: ${err.message}`)
    }

    try {
        switch (event.type) {
            case 'payment_intent.succeeded': {
                const paymentIntent = event.data.object
                const transactionId = paymentIntent.metadata.transactionId
                const transaction = await Transaction.findById(transactionId)
                if (!transaction) break

                transaction.status = TRX_STATUS.COMPLETED
                await transaction.save()

                const wallet = await Wallet.findById(transaction.walletId)
                if (wallet) {
                    wallet.balance += transaction.amount
                    await wallet.save()
                    emit(wallet.userId, 'walletUpdated', wallet)
                }

                emit(transaction.userId, 'transactionUpdated', transaction)
                break
            }

            case 'payment_intent.payment_failed': {
                const failedIntent = event.data.object
                const failedTransactionId = failedIntent.metadata.transactionId
                const failedTransaction = await Transaction.findById(failedTransactionId)
                if (failedTransaction) {
                    failedTransaction.status = 'Failed'
                    await failedTransaction.save()
                    emit(failedTransaction.userId, 'transactionUpdated', failedTransaction)

                    const failedWallet = await Wallet.findById(failedTransaction.walletId)
                    if (failedWallet) {
                        failedWallet.balance += failedTransaction.amount
                        await failedWallet.save()
                        emit(failedWallet.userId, 'walletUpdated', failedWallet)
                    }
                }
                break
            }

            default:
                console.log(`Unhandled Stripe event type: ${event.type}`)
        }

        res.json({ received: true })
    } catch (err) {
        console.error('Error handling webhook:', err)
        res.status(500).json({ message: 'Webhook handling failed' })
    }
}
