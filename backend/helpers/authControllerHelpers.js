import User from '../models/User.js'
import Wallet from '../models/Wallet.js'

/**
 * Register a new user and create default wallet
 * @param {Object} userData - { name, email, password, defaultCurrency }
 * @returns {Object} user
 */
export const registerNewUser = async ({ name, email, password, defaultCurrency }) => {
    const existingUser = await User.findOne({ email })
    if (existingUser) throw new Error('User already exists')

    const user = await User.create({
        name,
        email: email.toLowerCase(),
        passwordHash: password,
        defaultCurrency: defaultCurrency.toUpperCase(),
    })

    await Wallet.create({
        userId: user._id,
        currency: user.defaultCurrency,
        balance: 0,
        status: 'Active',
        isPrimary: true,
    })

    return user
}

/**
 * Authenticate user by email and password
 * @param {string} email
 * @param {string} password
 * @returns {Object} user
 */
export const authenticateUser = async (email, password) => {
    const user = await User.findOne({ email: email.toLowerCase() })
    if (!user || !(await user.matchPassword(password))) {
        throw new Error('Invalid credentials')
    }
    return user
}


/**
 * Format user object for response
 * @param {Object} user - Mongoose user document
 * @returns {Object} Formatted user object
 */
export const formatUser = (user) => ({
    id: user._id?.toString(),
    name: user.name,
    email: user.email,
    defaultCurrency: user.defaultCurrency,
})

