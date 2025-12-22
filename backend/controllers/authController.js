import User from '../models/User.js'
import { formatUser, registerNewUser, authenticateUser } from '../helpers/authControllerHelpers.js'
import { generateToken } from '../services/jwtToken.js'
import { userAuth } from '../features/userAuth.js'

// -----------------------------
// Register User
// -----------------------------
export const registerUser = async (req, res) => {
    try {
        if (!userAuth.registrationEnabled) {
            return res.status(403).json({ message: 'Registration is disabled' })
        }

        const { name, email, password, defaultCurrency = 'USD' } = req.body
        if (!name || !email || !password) {
            return res.status(400).json({ message: 'All fields are required' })
        }

        // ✅ Await async function
        const user = await registerNewUser({ name, email, password, defaultCurrency })

        res.status(201).json({
            user: formatUser(user),
            token: generateToken(user._id),
        })
    } catch (err) {
        console.error('Register error:', err)
        res.status(err.message === 'User already exists' ? 409 : 500).json({
            message: err.message,
            error: err.message,
        })
    }
}

// -----------------------------
// Login User
// -----------------------------
export const loginUser = async (req, res) => {
    try {
        if (!userAuth.loginEnabled) return res.status(403).json({ message: 'Login disabled' })

        const { email, password } = req.body
        if (!email || !password) return res.status(400).json({ message: 'Email and password are required' })

        // ✅ Await async function
        const user = await authenticateUser(email, password)

        res.json({
            user: formatUser(user),
            token: generateToken(user._id),
        })
    } catch (err) {
        console.error('Login error:', err)
        res.status(err.message === 'Invalid credentials' ? 401 : 500).json({ message: err.message })
    }
}

// -----------------------------
// Get Current User
// -----------------------------
export const getCurrentUser = async (req, res) => {
    try {
        if (!req.user) return res.status(401).json({ message: 'Not authorized' })

        // Map _id -> id so your test passes
        const user = formatUser(req.user)

        res.status(200).json(user)
    } catch (err) {
        res.status(500).json({ message: 'Server error' })
    }
}



// -----------------------------
// Update Current User
// -----------------------------
export const updateCurrentUser = async (req, res) => {
    try {
        if (!userAuth.profileUpdateEnabled) return res.status(403).json({ message: 'Profile updates are disabled' })

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
