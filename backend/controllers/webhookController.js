// controllers/webhookController.js
import Wallet from '../models/Wallet.js'
import Transaction from '../models/Transaction.js'

// Secret key from Flowpay dashboard
const FLOWPAY_SECRET = process.env.FLOWPAY_SECRET

export const handleFlowpayWebhook = async (req, res) => {
    try {
        const signature = req.headers['x-flowpay-signature']
        const payload = req.body

        // Verify webhook signature
        if (signature !== FLOWPAY_SECRET) {
            return res.status(401).json({ message: 'Invalid signature' })
        }

        // Extract important fields from the payload
        const { type, status, amount, currency, reference, sourceWalletId, destinationWalletId, beneficiary } = payload

        // Handle different types of events
        if (type === 'payment' || type === 'fund' || type === 'withdrawal') {
            // Find wallets if applicable
            let wallet
            if (type === 'fund' && destinationWalletId) {
                wallet = await Wallet.findById(destinationWalletId)
                if (wallet) {
                    wallet.amount += amount
                    await wallet.save()
                }
            } else if (type === 'withdrawal' && sourceWalletId) {
                wallet = await Wallet.findById(sourceWalletId)
                if (wallet) {
                    wallet.amount -= amount
                    await wallet.save()
                }
            }

            // Create transaction record
            await Transaction.create({
                user: wallet?.user || null,
                beneficiary: beneficiary || (type === 'withdrawal' ? 'External recipient' : 'Self'),
                amount,
                sourceCurrency: currency,
                destinationCurrency: currency,
                fxRate: 1,        // or include fxRate from payload if available
                fee: 0,           // include fee if provided
                settlementAmount: amount,
                type: type,       // 'fund', 'withdrawal', or 'payment'
                status: status === 'success' ? 'Completed' : 'Failed',
            })
        }

        res.status(200).json({ message: 'Webhook received' })
    } catch (err) {
        console.error('Webhook error:', err)
        res.status(500).json({ message: 'Server error' })
    }
}
