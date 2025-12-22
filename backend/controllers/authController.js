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
            return res.status(403).json({ message: 'Registration is disabled' })
        }

        const { name, email, password, defaultCurrency = 'USD' } = req.body

        if (!name || !email || !password) {
            return res.status(400).json({ message: 'All fields are required' })
        }

        const existingUser = await User.findOne({ email })
        if (existingUser) {
            return res.status(409).json({ message: 'User already exists' })
        }

        // 1️⃣ Create user
        const user = await User.create({
            name,
            email,
            passwordHash: password, // hashed via pre-save
            defaultCurrency,
        })

        // 2️⃣ Create default wallet (PRIMARY)
        await Wallet.create({
            userId: user._id,
            currency: defaultCurrency,
            balance: 0,
            status: 'Active',
            isPrimary: true,
        })

        res.status(201).json({
            user: formatUser(user),
            token: generateToken(user._id),
        })
    } catch (err) {
        console.error('Register error:', err)
        res.status(500).json({
            message: 'Server error',
            error: err.message,
        })
    }
}

// -----------------------------
// Login User
// -----------------------------
export const loginUser = async (req, res) => {
    try {
        if (!userFeatures.loginEnabled) {
            return res.status(403).json({ message: 'Login disabled' })
        }

        const { email, password } = req.body
        if (!email || !password) {
            return res
                .status(400)
                .json({ message: 'Email and password are required' })
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
        res.status(500).json({ message: 'Server error' })
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

        if (name?.trim()) user.name = name.trim()
        if (email?.trim()) user.email = email.toLowerCase().trim()
        if (defaultCurrency?.trim()) user.defaultCurrency = defaultCurrency.toUpperCase()

        await user.save()
        res.json({ user: formatUser(user) })
    } catch (err) {
        console.error('Update profile error:', err)
        res.status(500).json({ message: 'Server error', error: err.message })
    }
}
