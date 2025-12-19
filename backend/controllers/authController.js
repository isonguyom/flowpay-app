// controllers/authController.js
import jwt from 'jsonwebtoken'
import User from '../models/User.js'
import Wallet from '../models/Wallet.js'
import { userFeatures } from '../config/featureFlags.js'

// -----------------------------
// Helpers
// -----------------------------
const generateToken = (id) =>
    jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' })

const formatUser = (user) => ({
    id: user._id,
    name: user.name,
    email: user.email,
    defaultCurrency: user.defaultCurrency,
})

// -----------------------------
// Register User
// -----------------------------
export const registerUser = async (req, res) => {
    try {
        if (!userFeatures.registrationEnabled) {
            return res.status(403).json({ message: 'Registration is temporarily disabled' })
        }

        const { name, email, password, defaultCurrency } = req.body
        if (!name || !email || !password) {
            return res.status(400).json({ message: 'All fields are required' })
        }

        const exists = await User.findOne({ email })
        if (exists) return res.status(400).json({ message: 'User already exists' })

        const user = await User.create({
            name,
            email,
            password,
            defaultCurrency: defaultCurrency || 'USD',
        })

        // Automatically create default wallet
        await Wallet.create({
            user: user._id,
            currency: user.defaultCurrency,
            amount: 0,
            status: 'Active',
        })

        res.status(201).json({
            user: formatUser(user),
            token: generateToken(user._id),
        })
    } catch (err) {
        console.error('Register error:', err)
        res.status(500).json({ message: 'Server error', error: err.message })
    }
}

// -----------------------------
// Login User
// -----------------------------
export const loginUser = async (req, res) => {
    try {
        if (!userFeatures.loginEnabled) {
            return res.status(403).json({ message: 'Login is temporarily disabled' })
        }

        const { email, password } = req.body
        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' })
        }

        const user = await User.findOne({ email })
        if (!user || !(await user.matchPassword(password))) {
            return res.status(401).json({ message: 'Invalid credentials' })
        }

        res.json({
            user: formatUser(user),
            token: generateToken(user._id),
        })
    } catch (err) {
        console.error('Login error:', err)
        res.status(500).json({ message: 'Server error', error: err.message })
    }
}

// -----------------------------
// Get Current User
// -----------------------------
export const getCurrentUser = async (req, res) => {
    res.json(formatUser(req.user))
}

// -----------------------------
// Update Current User
// -----------------------------
export const updateCurrentUser = async (req, res) => {
    try {
        if (!userFeatures.profileUpdateEnabled) {
            return res.status(403).json({ message: 'Profile updates are disabled' })
        }

        const { name, email, defaultCurrency } = req.body
        const user = await User.findById(req.user._id)
        if (!user) return res.status(404).json({ message: 'User not found' })

        if (name) user.name = name
        if (email) user.email = email
        if (defaultCurrency) user.defaultCurrency = defaultCurrency

        await user.save()
        res.json({ user: formatUser(user) })
    } catch (err) {
        console.error('Update profile error:', err)
        res.status(500).json({ message: 'Server error', error: err.message })
    }
}
