import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { isCurrencyAllowed } from '../config/currenciesConfig.js';
import { USER_STATUS, USER_ROLES } from '../helpers/userHelpers.js';

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
);

// Hash password before saving
userSchema.pre('save', async function () {
    if (!this.isModified('passwordHash')) return;

    const salt = await bcrypt.genSalt(10);
    this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
});

// Compare password
userSchema.methods.matchPassword = async function (enteredPassword) {
    return bcrypt.compare(enteredPassword, this.passwordHash);
};

export default mongoose.model('User', userSchema);
