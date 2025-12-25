//  npm run test -- tests/unit/controllers/auth.controller.test.js
import express from 'express'
import request from 'supertest'
import User from '../../../models/User.js'
import {
    registerUser,
    loginUser,
    getCurrentUser,
    updateCurrentUser,
} from '../../../controllers/authController.js'
import { registerNewUser, authenticateUser, formatUser } from '../../../helpers/authControllerHelpers.js'
import { generateToken } from '../../../services/jwtToken.js'
import { userAuth } from '../../../features/userAuth.js'

// Mock modules
jest.mock('../../../models/User.js')
jest.mock('../../../helpers/authControllerHelpers.js')
jest.mock('../../../services/jwtToken.js')

// Setup Express app for testing
const app = express()
app.use(express.json())
app.post('/register', registerUser)
app.post('/login', loginUser)
app.get('/me', (req, res) => {
    req.user = { _id: '1', name: 'Test', email: 'test@a.com', defaultCurrency: 'USD' }
    getCurrentUser(req, res)
})
app.put('/me', (req, res) => {
    req.user = { _id: '1' }
    updateCurrentUser(req, res)
})

describe('AuthController', () => {
    beforeEach(() => {
        jest.resetAllMocks()
        userAuth.registrationEnabled = true
        userAuth.loginEnabled = true
        userAuth.profileUpdateEnabled = true
    })

    // -------------------------------
    // Register User
    // -------------------------------
    describe('registerUser', () => {
        it('should return 403 if registration is disabled', async () => {
            userAuth.registrationEnabled = false
            const res = await request(app).post('/register').send({})
            expect(res.statusCode).toBe(403)
            expect(res.body.message).toBe('Registration is disabled')
        })

        it('should return 400 if required fields are missing', async () => {
            const res = await request(app).post('/register').send({ name: 'John' })
            expect(res.statusCode).toBe(400)
            expect(res.body.message).toBe('All fields are required')
        })

        it('should register user successfully', async () => {
            const mockUser = { _id: '1', name: 'John', email: 'john@test.com', defaultCurrency: 'USD' }
            registerNewUser.mockResolvedValue(mockUser)
            formatUser.mockReturnValue({ id: '1', name: 'John', email: 'john@test.com', defaultCurrency: 'USD' })
            generateToken.mockReturnValue('mock-token')

            const res = await request(app)
                .post('/register')
                .send({ name: 'John', email: 'john@test.com', password: '123456' })

            expect(res.statusCode).toBe(201)
            expect(res.body.user).toEqual({ id: '1', name: 'John', email: 'john@test.com', defaultCurrency: 'USD' })
            expect(res.body.token).toBe('mock-token')
            expect(registerNewUser).toHaveBeenCalledWith({
                name: 'John',
                email: 'john@test.com',
                password: '123456',
                defaultCurrency: 'USD',
            })
        })

        it('should handle user already exists error', async () => {
            registerNewUser.mockRejectedValue(new Error('User already exists'))
            const res = await request(app)
                .post('/register')
                .send({ name: 'John', email: 'john@test.com', password: '123456' })
            expect(res.statusCode).toBe(409)
            expect(res.body.message).toBe('User already exists')
        })

        it('should handle generic server error', async () => {
            registerNewUser.mockRejectedValue(new Error('DB error'))
            const res = await request(app)
                .post('/register')
                .send({ name: 'John', email: 'john@test.com', password: '123456' })
            expect(res.statusCode).toBe(500)
            expect(res.body.message).toBe('DB error')
        })
    })

    // -------------------------------
    // Login User
    // -------------------------------
    describe('loginUser', () => {
        it('should return 403 if login is disabled', async () => {
            userAuth.loginEnabled = false
            const res = await request(app).post('/login').send({})
            expect(res.statusCode).toBe(403)
            expect(res.body.message).toBe('Login disabled')
        })

        it('should return 400 if email or password missing', async () => {
            const res = await request(app).post('/login').send({ email: 'a@b.com' })
            expect(res.statusCode).toBe(400)
            expect(res.body.message).toBe('Email and password are required')
        })

        it('should login user successfully', async () => {
            const mockUser = { _id: '1', name: 'John', email: 'john@test.com', defaultCurrency: 'USD' }
            authenticateUser.mockResolvedValue(mockUser)
            formatUser.mockReturnValue({ id: '1', name: 'John', email: 'john@test.com', defaultCurrency: 'USD' })
            generateToken.mockReturnValue('mock-token')

            const res = await request(app)
                .post('/login')
                .send({ email: 'john@test.com', password: '123456' })

            expect(res.statusCode).toBe(200)
            expect(res.body.user).toEqual({ id: '1', name: 'John', email: 'john@test.com', defaultCurrency: 'USD' })
            expect(res.body.token).toBe('mock-token')
            expect(authenticateUser).toHaveBeenCalledWith('john@test.com', '123456')
        })

        it('should return 401 for invalid credentials', async () => {
            authenticateUser.mockRejectedValue(new Error('Invalid credentials'))
            const res = await request(app)
                .post('/login')
                .send({ email: 'john@test.com', password: 'wrong' })
            expect(res.statusCode).toBe(401)
            expect(res.body.message).toBe('Invalid credentials')
        })
    })

    // -------------------------------
    // Get Current User
    // -------------------------------

    describe('getCurrentUser', () => {
        it('should return current user', async () => {
            const fakeUser = {
                _id: '64f123abc456def78901234',
                name: 'Test User',
                email: 'test@example.com',
                defaultCurrency: 'USD'
            }

            const req = { user: fakeUser }
            const json = jest.fn()
            const res = { status: jest.fn(() => ({ json })) }

            await getCurrentUser(req, res)

            expect(res.status).toHaveBeenCalledWith(200)
            expect(json).toHaveBeenCalledWith(formatUser(fakeUser))
        })
    })



    // -------------------------------
    // Update Current User
    // -------------------------------
    describe('updateCurrentUser', () => {
        it('should return 403 if profile updates are disabled', async () => {
            userAuth.profileUpdateEnabled = false
            const res = await request(app).put('/me').send({})
            expect(res.statusCode).toBe(403)
            expect(res.body.message).toBe('Profile updates are disabled')
        })

        it('should update user successfully', async () => {
            const mockSave = jest.fn().mockResolvedValue(true)
            User.findById.mockResolvedValue({
                _id: '1',
                name: 'Old',
                email: 'old@test.com',
                defaultCurrency: 'USD',
                save: mockSave,
            })
            formatUser.mockReturnValue({ id: '1', name: 'New', email: 'old@test.com', defaultCurrency: 'USD' })

            const res = await request(app).put('/me').send({ name: 'New' })
            expect(res.statusCode).toBe(200)
            expect(res.body.user.name).toBe('New')
            expect(mockSave).toHaveBeenCalled()
        })

        it('should return 404 if user not found', async () => {
            User.findById.mockResolvedValue(null)
            const res = await request(app).put('/me').send({ name: 'New' })
            expect(res.statusCode).toBe(404)
            expect(res.body.message).toBe('User not found')
        })
    })
})
