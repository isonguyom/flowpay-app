import express from 'express'
import { protect } from '../middleware/auth.js'
import Transaction from '../models/Transaction.js'

const router = express.Router()

// ------------------------
// GET all transactions for logged-in user
// ------------------------
router.get('/', protect, async (req, res) => {
  try {
    // Only fetch transactions for the logged-in user
    const transactions = await Transaction.find({ user: req.user._id }).sort({ createdAt: -1 })
    res.json({ transactions })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Server error', error: err.message })
  }
})

// ------------------------
// Create a new transaction (Payment / Fund / Withdraw)
// ------------------------
router.post('/', protect, async (req, res) => {
  try {
    const { type, from, to, beneficiary, amount, settlementAmount, fee } = req.body

    if (!type || !['Payment', 'Fund', 'Withdraw'].includes(type)) {
      return res.status(400).json({ message: 'Invalid transaction type' })
    }

    if (!from || !to || !beneficiary || !amount || !settlementAmount) {
      return res.status(400).json({ message: 'Missing required fields' })
    }

    const transaction = await Transaction.create({
      user: req.user._id,
      type,
      from,
      to,
      beneficiary,
      amount,
      settlementAmount,
      fee: fee || 0,
      status: 'Completed',
    })

    res.status(201).json({ transaction })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Server error' })
  }
})

export default router
