import { jest } from '@jest/globals'
import { idempotencyMiddleware } from '../../../middlewares/idempotency.js'
import IdempotencyKey from '../../../models/IdempotencyKey.js'

jest.mock('../../../models/IdempotencyKey.js')

describe('Idempotency Middleware', () => {
    let req, res, next

    beforeEach(() => {
        req = {
            headers: {},
            originalUrl: '/test-endpoint',
            user: { _id: 'user123' }
        }

        res = {
            statusCode: 200,
            json: jest.fn().mockImplementation((body) => body),
            status: jest.fn().mockImplementation(function (code) {
                this.statusCode = code
                return this // needed for chaining .json()
            })
        }

        next = jest.fn()
        jest.clearAllMocks()
    })

    it('calls next() if no idempotency key is provided', async () => {
        await idempotencyMiddleware(req, res, next)
        expect(next).toHaveBeenCalled()
    })

    it('returns cached response if key exists', async () => {
        const cached = {
            statusCode: 200,
            response: { success: true }
        }

        IdempotencyKey.findOne.mockResolvedValue(cached)
        req.headers['idempotency-key'] = 'key123'

        await idempotencyMiddleware(req, res, next)

        expect(res.status).toHaveBeenCalledWith(cached.statusCode)
        expect(res.json).toHaveBeenCalledWith(cached.response)
        expect(next).not.toHaveBeenCalled()
    })


    it('creates a new idempotency key if it does not exist', async () => {
        IdempotencyKey.findOne.mockResolvedValue(null)
        IdempotencyKey.create.mockResolvedValue({})

        req.headers['idempotency-key'] = 'new-key'
        const body = { data: 'test' }

        await idempotencyMiddleware(req, res, next)

        // simulate sending JSON
        await res.json(body)

        expect(IdempotencyKey.create).toHaveBeenCalledWith({
            key: 'new-key',
            userId: req.user?._id,
            endpoint: req.originalUrl,
            response: body,
            statusCode: res.statusCode
        })

        expect(next).toHaveBeenCalled()
    })
})
