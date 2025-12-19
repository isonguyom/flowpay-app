import Transaction from '../models/Transaction.js'
import { getStripe } from '../services/stripeService.js'
import { getSocket } from '../services/socket.js'

const stripe = getStripe()

// --------------------
// Stripe Webhook Handler
// --------------------
export const handleStripeWebhook = async (req, res) => {
    const sig = req.headers['stripe-signature']

    let event
    try {
        // Stripe requires raw body for signature verification
        event = stripe.webhooks.constructEvent(
            req.body,
            sig,
            process.env.STRIPE_WEBHOOK_SECRET
        )
    } catch (err) {
        console.error('Webhook signature verification failed:', err.message)
        return res.status(400).send(`Webhook Error: ${err.message}`)
    }

    const paymentIntent = event.data.object

    try {
        let transaction
        const io = getSocket()

        switch (event.type) {
            case 'payment_intent.created':
                console.log('PaymentIntent created:', paymentIntent.id)

                transaction = await Transaction.create({
                    stripeId: paymentIntent.id,
                    user: paymentIntent.metadata.userId,
                    type: paymentIntent.metadata.type || 'PAYMENT',
                    amount: paymentIntent.amount,
                    sourceCurrency: paymentIntent.currency.toUpperCase(),
                    status: 'Pending',
                })

                io.to(transaction.user.toString()).emit('transaction:created', transaction)
                break

            case 'payment_intent.succeeded':
                console.log('PaymentIntent succeeded:', paymentIntent.id)

                transaction = await Transaction.findOneAndUpdate(
                    { stripeId: paymentIntent.id },
                    { status: 'Completed' },
                    { new: true, runValidators: true }
                )

                if (transaction) {
                    io.to(transaction.user.toString()).emit('transaction:updated', transaction)
                }
                break

            case 'payment_intent.payment_failed':
                console.log('PaymentIntent failed:', paymentIntent.id)

                transaction = await Transaction.findOneAndUpdate(
                    { stripeId: paymentIntent.id },
                    { status: 'Failed' },
                    { new: true, runValidators: true }
                )

                if (transaction) {
                    io.to(transaction.user.toString()).emit('transaction:updated', transaction)
                }
                break

            default:
                console.log(`Unhandled event type: ${event.type}`)
        }

        res.json({ received: true })
    } catch (err) {
        console.error('Processing webhook event failed:', err)
        res.status(500).send('Internal server error')
    }
}

// Optional simple test webhook handler
export const handlePaymentWebhook = async (req, res) => {
    console.log('🔥 WEBHOOK RECEIVED', req.body)
    res.sendStatus(200)
}
