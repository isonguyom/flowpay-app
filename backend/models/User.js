import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'
import { isCurrencyAllowed } from '../config/currenciesConfig.js'
import { USER_STATUS, USER_ROLES } from '../config/userConfig.js'

/**
 * User Schema
 * Represents a platform user with authentication, role, and currency info
 */
const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Name is required'],
            trim: true,
        },

        email: {
            type: String,
            required: [true, 'Email is required'],
            unique: true,
            lowercase: true,
            trim: true,
            immutable: true, // 🔒 prevents updates after creation
        },


        passwordHash: {
            type: String,
            required: [true, 'Password is required'],
        },

        defaultCurrency: {
            type: String,
            uppercase: true,
            default: 'USD',
            validate: {
                validator: isCurrencyAllowed,
                message: 'Currency not supported by platform',
            },
        },

        isActive: {
            type: Boolean,
            default: true,
        },

        role: {
            type: String,
            enum: Object.values(USER_ROLES),
            default: USER_ROLES.USER,
        },

        status: {
            type: String,
            enum: Object.values(USER_STATUS),
            default: USER_STATUS.ACTIVE,
        },
    },
    { timestamps: true }
)

/**
 * Pre-save middleware to hash password if modified
 */
userSchema.pre('save', async function () {
    if (!this.isModified('passwordHash')) return

    const salt = await bcrypt.genSalt(10)
    this.passwordHash = await bcrypt.hash(this.passwordHash, salt)
})


/**
 * Compare entered password with hashed password
 * @param {string} enteredPassword
 * @returns {Promise<boolean>} true if match
 */
userSchema.methods.matchPassword = async function (enteredPassword) {
    return bcrypt.compare(enteredPassword, this.passwordHash)
}

export default mongoose.model('User', userSchema)
