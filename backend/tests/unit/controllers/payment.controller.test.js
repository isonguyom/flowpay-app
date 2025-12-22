// tests/unit/controllers/payment.controller.test.js
import { jest } from '@jest/globals'
import { vi } from 'vitest'

// ------------------------
// Mock dependencies
// ------------------------
const mockWalletSave = jest.fn()
const mockTransactionCreate = jest.fn()
const mockPaymentCreate = jest.fn()
const mockProcessPaymentResult = jest.fn()
const mockEmit = jest.fn()
const mockStripePaymentIntentCreate = jest.fn().mockResolvedValue({
    id: 'pi_123',
    client_secret: 'secret_client'
})

// Mock ES Modules
jest.unstable_mockModule('../../../models/Wallet.js', () => ({
    default: {
        findOne: jest.fn(),
    }
}))

jest.unstable_mockModule('../../../models/Transaction.js', () => ({
    default: { create: mockTransactionCreate }
}))

jest.unstable_mockModule('../../../models/Payment.js', () => ({
    default: { create: mockPaymentCreate }
}))

jest.unstable_mockModule('../../../processors/paymentProcessor.js', () => ({
    processPaymentResult: mockProcessPaymentResult
}))

jest.unstable_mockModule('../../../services/socket.js', () => ({
    getSocket: jest.fn(() => ({ to: () => ({ emit: mockEmit }) }))
}))

jest.unstable_mockModule('../../../services/stripeService.js', () => ({
    getStripe: () => ({ paymentIntents: { create: mockStripePaymentIntentCreate } })
}))

jest.unstable_mockModule('../../../config/featureFlags.js', () => ({
    isNewPaymentFlowEnabled: jest.fn(() => true)
}))

// ------------------------
// Import controller after mocks
// ------------------------
const { makePayment } = await import('../../../controllers/paymentController.js')
const Wallet = (await import('../../../models/Wallet.js')).default

describe('makePayment', () => {
    let req, res

    beforeEach(() => {
        jest.clearAllMocks()
        req = {
            user: { _id: 'user123' },
            body: {
                beneficiary: 'beneficiary1',
                amount: 100,
                sourceWallet: 'USD',
                destinationCurrency: 'USD',
                fxRate: 1.1,
                fee: 10
            }
        }
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        }
    })

    it('should successfully make a payment and emit events', async () => {
        // Mock wallet
        Wallet.findOne.mockResolvedValue({
            _id: 'wallet123',
            user: 'user123',
            amount: 110, // enough balance to cover amount + fee
            currency: 'USD',
            save: mockWalletSave
        })

        // Mock Transaction.create
        mockTransactionCreate.mockResolvedValue({ _id: 'txn123' })

        // Mock Payment.create
        mockPaymentCreate.mockResolvedValue({ _id: 'pay123' })

        // Run controller
        await makePayment(req, res)

        // Assertions
        expect(Wallet.findOne).toHaveBeenCalledWith({ user: 'user123', currency: 'USD' })
        expect(mockWalletSave).toHaveBeenCalled()
        expect(mockTransactionCreate).toHaveBeenCalled()
        expect(mockEmit).toHaveBeenCalledWith('walletUpdated', expect.any(Object))
        expect(mockEmit).toHaveBeenCalledWith('transactionCreated', expect.any(Object))
        expect(mockStripePaymentIntentCreate).toHaveBeenCalledWith(
            expect.objectContaining({
                amount: 110 * 100, // amount + fee in cents
                currency: 'usd'
            })
        )
        expect(mockPaymentCreate).toHaveBeenCalled()
        expect(res.status).toHaveBeenCalledWith(201)
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                transactionId: 'txn123',
                paymentId: 'pay123',
                clientSecret: 'secret_client',
                flow: 'new'
            })
        )
    })

    it('should return 404 if wallet not found', async () => {
        Wallet.findOne.mockResolvedValue(null)
        await makePayment(req, res)
        expect(res.status).toHaveBeenCalledWith(404)
        expect(res.json).toHaveBeenCalledWith({ message: 'Source wallet not found' })
    })

    it('should return 400 if insufficient wallet balance', async () => {
        Wallet.findOne.mockResolvedValue({
            _id: 'wallet123',
            user: 'user123',
            amount: 50, // less than amount + fee
            currency: 'USD',
            save: mockWalletSave
        })
        await makePayment(req, res)
        expect(res.status).toHaveBeenCalledWith(400)
        expect(res.json).toHaveBeenCalledWith({ message: 'Insufficient wallet balance' })
    })

    it('should handle server errors gracefully', async () => {
        Wallet.findOne.mockRejectedValue(new Error('DB failure'))
        await makePayment(req, res)
        expect(res.status).toHaveBeenCalledWith(500)
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                message: 'Payment processing failed',
                error: expect.any(String)
            })
        )
    })
})
