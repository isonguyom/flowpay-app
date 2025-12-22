import jwt from 'jsonwebtoken'

/**
 * Generate JWT token for a user
 * @param {string} userId
 * @returns {string} JWT token
 */
export const generateToken = (userId) => {
    if (!process.env.JWT_SECRET) {
        throw new Error('JWT_SECRET is not defined')
    }

    return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '7d' })
}
