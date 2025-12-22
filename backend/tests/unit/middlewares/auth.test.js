import { jest } from '@jest/globals'
import { protect } from '../../../middlewares/auth.js'
import jwt from 'jsonwebtoken'
import User from '../../../models/User.js'

describe('Auth Middleware - protect', () => {
    let req, res, next

    beforeEach(() => {
        req = { headers: {} }
        res = { status: jest.fn().mockReturnThis(), json: jest.fn() }
        next = jest.fn()
        jest.clearAllMocks()
    })

    it('calls next() if token is valid and user exists', async () => {
        const fakeUser = { _id: '123', name: 'Test User', email: 'test@test.com' }

        req.headers.authorization = 'Bearer validToken'
        jest.spyOn(jwt, 'verify').mockReturnValue({ id: '123' })

        // Mock findById().select() chain
        const selectMock = jest.fn().mockResolvedValue(fakeUser)
        jest.spyOn(User, 'findById').mockReturnValue({ select: selectMock })

        await protect(req, res, next)

        expect(req.user).toEqual(fakeUser)
        expect(next).toHaveBeenCalled()
    })

    it('returns 401 if no token provided', async () => {
        await protect(req, res, next)
        expect(res.status).toHaveBeenCalledWith(401)
        expect(res.json).toHaveBeenCalledWith({ message: 'Not authorized, no token' })
    })

    it('returns 401 if token is invalid', async () => {
        req.headers.authorization = 'Bearer invalidToken'
        jest.spyOn(jwt, 'verify').mockImplementation(() => { throw new Error('invalid token') })

        await protect(req, res, next)
        expect(res.status).toHaveBeenCalledWith(401)
        expect(res.json).toHaveBeenCalledWith({ message: 'Not authorized, token failed' })
    })

    it('returns 401 if user not found', async () => {
        req.headers.authorization = 'Bearer validToken'
        jest.spyOn(jwt, 'verify').mockReturnValue({ id: '123' })

        const selectMock = jest.fn().mockResolvedValue(null)
        jest.spyOn(User, 'findById').mockReturnValue({ select: selectMock })

        await protect(req, res, next)
        expect(res.status).toHaveBeenCalledWith(401)
        expect(res.json).toHaveBeenCalledWith({ message: 'User not found' }) // <-- correct message
    })

})
