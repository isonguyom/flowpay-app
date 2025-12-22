import { getStripe } from '../services/stripeService.js';
import { handleFundingIntent, handleWithdrawalIntent } from '../hooks/walletIntent.js';
import { handlePaymentIntent } from '../hooks/paymentIntent.js';

export const handleStripeWebhooks = async (req, res) => {
    if (!process.env.STRIPE_WEBHOOK_SECRET) {
        throw new Error('STRIPE_WEBHOOK_SECRET not configured');
    }

    const stripe = getStripe();
    const signature = req.headers['stripe-signature'];

    if (!signature) {
        return res.status(400).json({ message: 'Missing Stripe signature' });
    }

    let event;

    try {
        // Verify webhook signature
        event = stripe.webhooks.constructEvent(req.rawBody, signature, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
        console.error('❌ Stripe webhook verification failed:', err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    try {
        switch (event.type) {
            case 'payment_intent.succeeded': {
                const type = event?.data?.object?.metadata?.type;
                if (type === 'WALLET_FUND') await handleFundingIntent(event.data.object);
                else if (type === 'PAYMENT') await handlePaymentIntent(event.data.object);
                else console.log('ℹ️ Unknown payment_intent type:', type);
                break;
            }

            case 'payout.paid':
                await handleWithdrawalIntent(event.data.object);
                break;

            default:
                console.log(`ℹ️ Unhandled Stripe event: ${event.type}`);
        }

        // Respond 204 to Stripe
        res.sendStatus(204);
    } catch (err) {
        console.error('❌ Stripe webhook processing error:', err);
        res.status(500).json({ message: 'Webhook processing failed' });
    }
};
