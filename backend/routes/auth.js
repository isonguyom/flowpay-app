import express from 'express'
import jwt from 'jsonwebtoken'
import User from '../models/User.js'
import { protect } from '../middleware/auth.js'

const router = express.Router()

// -----------------------------
// Helpers
// -----------------------------
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '7d',
    })
}

// -----------------------------
// Register
// -----------------------------
router.post('/register', async (req, res) => {
    try {
        const { name, email, password } = req.body

        if (!name || !email || !password) {
            return res.status(400).json({ message: 'All fields are required' })
        }

        const userExists = await User.findOne({ email })
        if (userExists) {
            return res.status(400).json({ message: 'User already exists' })
        }

        const user = await User.create({ name, email, password })

        res.status(201).json({
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
            },
            token: generateToken(user._id),
        })
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message })
    }
})

// -----------------------------
// Login
// -----------------------------
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body

        const user = await User.findOne({ email })
        if (!user || !(await user.matchPassword(password))) {
            return res.status(401).json({ message: 'Invalid credentials' })
        }

        res.json({
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
            },
            token: generateToken(user._id),
        })
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message })
    }
})

// -----------------------------
// Get current user
// -----------------------------
router.get('/me', protect, async (req, res) => {
    res.json(req.user)
})

// -----------------------------
// Update current user
// -----------------------------
router.put('/me', protect, async (req, res) => {
    try {
        const { name, email, defaultCurrency } = req.body

        const user = await User.findById(req.user._id)

        if (!user) {
            return res.status(404).json({ message: 'User not found' })
        }

        if (name) user.name = name
        if (email) user.email = email
        if (defaultCurrency) user.defaultCurrency = defaultCurrency

        const updatedUser = await user.save()

        res.json({
            user: {
                id: updatedUser._id,
                name: updatedUser.name,
                email: updatedUser.email,
                defaultCurrency: updatedUser.defaultCurrency,
            },
        })
    } catch (error) {
        console.error('UPDATE PROFILE ERROR:', error)
        res.status(500).json({ message: 'Server error', error: error.message })
    }
})


export default router
