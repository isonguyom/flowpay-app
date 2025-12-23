import Transaction from '../models/Transaction.js'
import Wallet from '../models/Wallet.js'
import { getStripe } from '../services/stripeService.js'
import { TRX_STATUS, TRX_TYPE } from '../config/transactionConfig.js'
import { emit, rollback, validatePaymentInput } from '../helpers/paymentControllerHelpers.js'

export const makePayment = async (req, res) => {
    const user = req.user
    if (!user?._id) return res.status(401).json({ message: 'Unauthorized' })

    const userId = user._id
    let { beneficiary, amount, sourceWallet, destinationCurrency, fxRate, fee = 0 } = req.body

    // -------------------- Validate inputs --------------------
    const { valid, message, amount: parsedAmount, fee: parsedFee } = validatePaymentInput({
        beneficiary,
        sourceWallet,
        destinationCurrency,
        amount,
        fee,
    })

    if (!valid) return res.status(400).json({ message })

    amount = parsedAmount
    fee = parsedFee

    const srcCurrency = sourceWallet.toUpperCase()
    const destCurrency = destinationCurrency.toUpperCase()
    const totalDebitable = amount + fee

    let wallet, transaction

    try {
        // -------------------- Fetch source wallet --------------------
        wallet = await Wallet.findOne({ userId, currency: srcCurrency })
        if (!wallet) return res.status(404).json({ message: `Wallet (${srcCurrency}) not found` })
        if (wallet.balance < totalDebitable)
            return res.status(400).json({ message: 'Insufficient wallet balance' })

        // -------------------- Reserve wallet balance --------------------
        wallet.balance -= totalDebitable

        // -------------------- Create transaction --------------------
        const settlementAmount = Number((amount * fxRate).toFixed(2))
        transaction = await Transaction.create({
            userId,
            walletId: wallet._id,
            type: TRX_TYPE.PAYMENT,
            beneficiary,
            amount,
            settlementAmount,
            fee,
            sourceCurrency: srcCurrency,
            destinationCurrency: destCurrency,
            fxRate,
            status: TRX_STATUS.PENDING,
        })

        emit(userId, 'transactionCreated', transaction)

        // -------------------- Create Stripe PaymentIntent --------------------
        const stripe = getStripe()
        const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(amount * 100),
            currency: destCurrency.toLowerCase(),
            automatic_payment_methods: { enabled: true },
            metadata: {
                userId: userId.toString(),
                transactionId: transaction._id.toString(),
                walletId: wallet._id.toString(),
                type: TRX_TYPE.PAYMENT,
            },
        })

        // -------------------- Save wallet & transaction --------------------
        await Promise.all([wallet.save(), transaction.save()])

        emit(userId, 'walletUpdated', wallet)

        // -------------------- Respond --------------------
        return res.status(201).json({
            transactionId: transaction._id,
            clientSecret: paymentIntent.client_secret,
        })
    } catch (err) {
        console.error('makePayment failed:', err)

        // -------------------- Rollback --------------------
        try {
            await rollback({ wallet, transaction, totalDebitable })
        } catch (rollbackErr) {
            console.error('rollback failed:', rollbackErr)
        }

        return res.status(500).json({ message: 'Payment initiation failed' })
    }
}
