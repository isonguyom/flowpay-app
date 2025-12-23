import mongoose from 'mongoose'
import Wallet from '../../../models/Wallet.js'
import Transaction from '../../../models/Transaction.js'
import { getStripe } from '../../../services/stripeService.js'
import * as paymentController from '../../../controllers/paymentController.js'
import * as helpers from '../../../helpers/paymentControllerHelpers.js'
import { TRX_TYPE, TRX_STATUS } from '../../../config/transactionConfig.js'

jest.mock('../../../models/Wallet')
jest.mock('../../../models/Transaction')
jest.mock('../../../services/stripeService')
jest.mock('../../../helpers/paymentControllerHelpers')

describe('paymentController.makePayment', () => {
    let req, res, mockUserId, mockWallet, mockTransaction, mockStripe

    beforeEach(() => {
        mockUserId = new mongoose.Types.ObjectId()
        req = {
            user: { _id: mockUserId },
            body: {
                beneficiary: 'John Doe',
                amount: 100,
                sourceWallet: 'USD',
                destinationCurrency: 'EUR',
                fxRate: 1.2,
                fee: 5,
            },
        }
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        }

        // Socket emit mock
        helpers.emit.mockClear().mockReturnValue(true)

        // Wallet mock
        mockWallet = {
            _id: new mongoose.Types.ObjectId(),
            balance: 500,
            currency: 'USD',
            save: jest.fn().mockResolvedValue(true),
        }
        Wallet.findOne.mockResolvedValue(mockWallet)

        // Transaction mock
        mockTransaction = {
            _id: new mongoose.Types.ObjectId(),
            save: jest.fn().mockResolvedValue(true),
        }
        Transaction.create.mockResolvedValue(mockTransaction)

        // Stripe mock
        mockStripe = { paymentIntents: { create: jest.fn().mockResolvedValue({ client_secret: 'pi_secret_123' }) } }
        getStripe.mockReturnValue(mockStripe)

        // Input validation
        helpers.validatePaymentInput.mockImplementation(({ amount, fee }) => ({
            valid: true,
            amount,
            fee,
        }))

        helpers.rollback.mockClear()
    })

    it('should return 401 if user is not authenticated', async () => {
        req.user = null
        await paymentController.makePayment(req, res)
        expect(res.status).toHaveBeenCalledWith(401)
        expect(res.json).toHaveBeenCalledWith({ message: 'Unauthorized' })
    })

    it('should return 400 if validation fails', async () => {
        helpers.validatePaymentInput.mockReturnValue({ valid: false, message: 'Invalid input' })
        await paymentController.makePayment(req, res)
        expect(res.status).toHaveBeenCalledWith(400)
        expect(res.json).toHaveBeenCalledWith({ message: 'Invalid input' })
    })

    it('should return 404 if wallet not found', async () => {
        Wallet.findOne.mockResolvedValue(null)
        await paymentController.makePayment(req, res)
        expect(res.status).toHaveBeenCalledWith(404)
        expect(res.json).toHaveBeenCalledWith({ message: 'Wallet (USD) not found' })
    })

    it('should return 400 if insufficient wallet balance', async () => {
        mockWallet.balance = 50
        await paymentController.makePayment(req, res)
        expect(res.status).toHaveBeenCalledWith(400)
        expect(res.json).toHaveBeenCalledWith({ message: 'Insufficient wallet balance' })
    })

    it('should create transaction, reserve balance, create stripe intent, and respond with client secret', async () => {
        await paymentController.makePayment(req, res)

        // Check wallet balance deducted
        expect(mockWallet.balance).toBe(500 - (100 + 5))
        expect(mockWallet.save).toHaveBeenCalled()

        // Transaction creation
        expect(Transaction.create).toHaveBeenCalledWith(expect.objectContaining({
            userId: mockUserId,
            type: TRX_TYPE.PAYMENT,
            amount: 100,
            fee: 5,
            sourceCurrency: 'USD',
            destinationCurrency: 'EUR',
            fxRate: 1.2,
            status: TRX_STATUS.PENDING,
        }))
        expect(mockTransaction.save).toHaveBeenCalled()

        // Stripe payment intent
        expect(mockStripe.paymentIntents.create).toHaveBeenCalledWith(expect.objectContaining({
            amount: 10000, // amount * 100
            currency: 'eur',
            metadata: expect.objectContaining({ transactionId: mockTransaction._id.toString() }),
        }))

        // Socket emits
        expect(helpers.emit).toHaveBeenCalledWith(mockUserId, 'transactionCreated', mockTransaction)
        expect(helpers.emit).toHaveBeenCalledWith(mockUserId, 'walletUpdated', mockWallet)

        // Response
        expect(res.status).toHaveBeenCalledWith(201)
        expect(res.json).toHaveBeenCalledWith({
            transactionId: mockTransaction._id,
            clientSecret: 'pi_secret_123',
        })
    })

    it('should rollback and return 500 if an error occurs', async () => {
        Wallet.findOne.mockImplementation(() => { throw new Error('DB failure') })
        await paymentController.makePayment(req, res)
        expect(helpers.rollback).toHaveBeenCalled()
        expect(res.status).toHaveBeenCalledWith(500)
        expect(res.json).toHaveBeenCalledWith({ message: 'Payment initiation failed' })
    })
})
