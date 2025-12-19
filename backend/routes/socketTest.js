import express from 'express'
const router = express.Router()

// POST /api/test-socket
// body: { userId: string }
router.post('/', (req, res) => {
    const io = req.app.get('io')
    const { userId } = req.body

    if (!userId) {
        return res.status(400).json({ message: 'userId is required' })
    }

    // Simulate a new transaction
    const testTransaction = {
        _id: 'txn_test_123',
        user: userId,
        amount: Math.floor(Math.random() * 1000) + 1,
        sourceCurrency: 'USD',
        destinationCurrency: 'EUR',
        status: 'Pending',
        createdAt: new Date(),
    }

    // Simulate a wallet update
    const testWallet = {
        _id: 'wallet_test_123',
        user: userId,
        currency: 'USD',
        amount: Math.floor(Math.random() * 5000),
        status: 'Active',
        updatedAt: new Date(),
    }

    // Emit events
    io?.to(userId).emit('transactionCreated', testTransaction)
    io?.to(userId).emit('walletUpdated', testWallet)

    console.log(`Socket test events sent to user ${userId}`)

    res.json({
        message: 'Test events emitted',
        transaction: testTransaction,
        wallet: testWallet,
    })
})

export default router
