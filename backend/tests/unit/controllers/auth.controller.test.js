import { jest } from '@jest/globals'
import jwt from 'jsonwebtoken'

import {
    registerUser,
    loginUser,
    getCurrentUser,
    updateCurrentUser,
} from '../../../controllers/authController.js'

import User from '../../../models/User.js'
import Wallet from '../../../models/Wallet.js'
import { userFeatures } from '../../../config/featureFlags.js'

// -----------------------------
// Mocks
// -----------------------------
jest.mock('../../../models/User.js')
jest.mock('../../../models/Wallet.js')
jest.mock('jsonwebtoken')

// -----------------------------
// Helpers
// -----------------------------
const mockRes = () => {
    const res = {}
    res.status = jest.fn().mockReturnValue(res)
    res.json = jest.fn().mockReturnValue(res)
    return res
}

const mockUser = {
    _id: 'user123',
    name: 'John Doe',
    email: 'john@example.com',
    defaultCurrency: 'USD',
    matchPassword: jest.fn(),
    save: jest.fn(),
}

beforeEach(() => {
    jest.clearAllMocks()

    process.env.JWT_SECRET = 'testsecret'

    // Enable all features by default
    userFeatures.registrationEnabled = true
    userFeatures.loginEnabled = true
    userFeatures.profileUpdateEnabled = true

    jwt.sign.mockReturnValue('mock-jwt-token')
})

/* =====================================================
   REGISTER USER
===================================================== */
describe('registerUser', () => {
    it('should register a new user and create a wallet', async () => {
        User.findOne.mockResolvedValue(null)
        User.create.mockResolvedValue(mockUser)
        Wallet.create.mockResolvedValue({})

        const req = {
            body: {
                name: 'John',
                email: 'john@example.com',
                password: 'password123',
                defaultCurrency: 'USD',
            },
        }
        const res = mockRes()

        await registerUser(req, res)

        expect(User.findOne).toHaveBeenCalledWith({ email: 'john@example.com' })
        expect(User.create).toHaveBeenCalled()
        expect(Wallet.create).toHaveBeenCalledWith({
            userId: mockUser._id,
            currency: 'USD',
            balance: 0,
            status: 'Active',
            isPrimary: true,
        })

        expect(res.status).toHaveBeenCalledWith(201)
        expect(res.json).toHaveBeenCalledWith({
            user: {
                id: mockUser._id,
                name: mockUser.name,
                email: mockUser.email,
                defaultCurrency: mockUser.defaultCurrency,
            },
            token: 'mock-jwt-token',
        })
    })

    it('should return 409 if user already exists', async () => {
        User.findOne.mockResolvedValue(mockUser)

        const req = {
            body: { name: 'John', email: 'john@example.com', password: 'pass' },
        }
        const res = mockRes()

        await registerUser(req, res)

        expect(res.status).toHaveBeenCalledWith(409)
        expect(res.json).toHaveBeenCalledWith({ message: 'User already exists' })
    })

    it('should return 403 if registration is disabled', async () => {
        userFeatures.registrationEnabled = false

        const req = { body: {} }
        const res = mockRes()

        await registerUser(req, res)

        expect(res.status).toHaveBeenCalledWith(403)
        expect(res.json).toHaveBeenCalledWith({
            message: 'Registration is disabled',
        })
    })
})

/* =====================================================
   LOGIN USER
===================================================== */
describe('loginUser', () => {
    it('should login user with valid credentials', async () => {
        mockUser.matchPassword.mockResolvedValue(true)
        User.findOne.mockResolvedValue(mockUser)

        const req = {
            body: { email: 'john@example.com', password: 'password123' },
        }
        const res = mockRes()

        await loginUser(req, res)

        expect(User.findOne).toHaveBeenCalledWith({ email: 'john@example.com' })
        expect(res.json).toHaveBeenCalledWith({
            user: {
                id: mockUser._id,
                name: mockUser.name,
                email: mockUser.email,
                defaultCurrency: mockUser.defaultCurrency,
            },
            token: 'mock-jwt-token',
        })
    })

    it('should reject invalid credentials', async () => {
        mockUser.matchPassword.mockResolvedValue(false)
        User.findOne.mockResolvedValue(mockUser)

        const req = {
            body: { email: 'john@example.com', password: 'wrongpass' },
        }
        const res = mockRes()

        await loginUser(req, res)

        expect(res.status).toHaveBeenCalledWith(401)
        expect(res.json).toHaveBeenCalledWith({
            message: 'Invalid credentials',
        })
    })

    it('should return 403 if login is disabled', async () => {
        userFeatures.loginEnabled = false

        const req = { body: {} }
        const res = mockRes()

        await loginUser(req, res)

        expect(res.status).toHaveBeenCalledWith(403)
        expect(res.json).toHaveBeenCalledWith({
            message: 'Login disabled',
        })
    })
})

/* =====================================================
   GET CURRENT USER
===================================================== */
describe('getCurrentUser', () => {
    it('should return the authenticated user', async () => {
        const req = { user: mockUser }
        const res = mockRes()

        await getCurrentUser(req, res)

        expect(res.json).toHaveBeenCalledWith({
            id: mockUser._id,
            name: mockUser.name,
            email: mockUser.email,
            defaultCurrency: mockUser.defaultCurrency,
        })
    })
})

/* =====================================================
   UPDATE CURRENT USER
===================================================== */
describe('updateCurrentUser', () => {
    it('should update user profile', async () => {
        User.findById.mockResolvedValue(mockUser)

        const req = {
            user: { _id: mockUser._id },
            body: {
                name: 'New Name',
                email: 'new@email.com',
                defaultCurrency: 'eur',
            },
        }
        const res = mockRes()

        await updateCurrentUser(req, res)

        expect(mockUser.name).toBe('New Name')
        expect(mockUser.email).toBe('new@email.com')
        expect(mockUser.defaultCurrency).toBe('EUR')
        expect(mockUser.save).toHaveBeenCalled()

        expect(res.json).toHaveBeenCalledWith({
            user: {
                id: mockUser._id,
                name: 'New Name',
                email: 'new@email.com',
                defaultCurrency: 'EUR',
            },
        })
    })

    it('should return 403 if profile update is disabled', async () => {
        userFeatures.profileUpdateEnabled = false

        const req = { user: { _id: 'id' }, body: {} }
        const res = mockRes()

        await updateCurrentUser(req, res)

        expect(res.status).toHaveBeenCalledWith(403)
        expect(res.json).toHaveBeenCalledWith({
            message: 'Profile updates are disabled',
        })
    })
})
