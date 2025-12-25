import mongoose from 'mongoose'
import Wallet from '../../../models/Wallet.js'
import Transaction from '../../../models/Transaction.js'
import * as walletController from '../../../controllers/walletController.js'
import { emit } from '../../../helpers/walletControllerHelpers.js'
import { TRX_TYPE, TRX_STATUS } from '../../../config/transactionConfig.js'

jest.mock('../../../models/Wallet')
jest.mock('../../../models/Transaction')
jest.mock('../../../helpers/walletControllerHelpers.js')

describe('walletController', () => {
  let req, res, userId, mockWallet, mockTransaction

  beforeEach(() => {
    userId = new mongoose.Types.ObjectId()
    req = { user: { _id: userId }, body: {} }
    res = { status: jest.fn().mockReturnThis(), json: jest.fn() }

    mockWallet = {
      _id: new mongoose.Types.ObjectId(),
      balance: 100,
      currency: 'USD',
      status: 'Active',
      save: jest.fn().mockResolvedValue(true)
    }

    mockTransaction = {
      _id: new mongoose.Types.ObjectId(),
      status: TRX_STATUS.PENDING,
      save: jest.fn().mockResolvedValue(true)
    }

    emit.mockClear()
    jest.clearAllMocks()
  })

  // ---------------- CREATE WALLET ----------------
  describe('createWallet', () => {
    it('returns 401 if user not authenticated', async () => {
      req.user = null
      await walletController.createWallet(req, res)
      expect(res.status).toHaveBeenCalledWith(401)
      expect(res.json).toHaveBeenCalledWith({ message: 'Unauthorized' })
    })

    it('returns 400 if currency not provided', async () => {
      req.body = {}
      await walletController.createWallet(req, res)
      expect(res.status).toHaveBeenCalledWith(400)
      expect(res.json).toHaveBeenCalledWith({ message: 'Currency is required' })
    })
    it('returns 409 if wallet already exists', async () => {
      req.body = { currency: 'USD' }
      Wallet.findOne.mockResolvedValue(mockWallet)

      await walletController.createWallet(req, res)

      expect(res.status).toHaveBeenCalledWith(409)
      expect(res.json).toHaveBeenCalledWith({
        code: 'WALLET_ALREADY_EXISTS',
        message: 'Wallet for USD already exists'
      })
    })


    it('creates wallet successfully', async () => {
      req.body = { currency: 'USD' }
      Wallet.findOne.mockResolvedValue(null)
      Wallet.create.mockResolvedValue(mockWallet)

      await walletController.createWallet(req, res)

      expect(Wallet.create).toHaveBeenCalledWith({
        userId,
        currency: 'USD',
        balance: 0,
        status: 'Active',
      })
      expect(emit).toHaveBeenCalledWith(userId, 'walletCreated', mockWallet)
      expect(res.status).toHaveBeenCalledWith(201)
      expect(res.json).toHaveBeenCalledWith({
        message: 'Wallet created successfully',
        wallet: mockWallet,
      })
    })
  })

  // ---------------- FUND WALLET ----------------
  describe('fundWallet', () => {
    beforeEach(() => {
      req.body = { walletId: mockWallet._id, amount: 50 }
      Wallet.findOne.mockResolvedValue(mockWallet)
      Transaction.create.mockResolvedValue(mockTransaction)
    })

    it('returns 401 if user not authenticated', async () => {
      req.user = null
      await walletController.fundWallet(req, res)
      expect(res.status).toHaveBeenCalledWith(401)
    })

    it('returns 400 for invalid amount', async () => {
      req.body.amount = -10
      await walletController.fundWallet(req, res)
      expect(res.status).toHaveBeenCalledWith(400)
      expect(res.json).toHaveBeenCalledWith({ message: 'Invalid amount' })
    })

    it('returns 404 if wallet not found', async () => {
      Wallet.findOne.mockResolvedValue(null)
      await walletController.fundWallet(req, res)
      expect(res.status).toHaveBeenCalledWith(404)
      expect(res.json).toHaveBeenCalledWith({ message: 'Wallet not found' })
    })

    it('returns 403 if wallet not active', async () => {
      Wallet.findOne.mockResolvedValue({ ...mockWallet, status: 'Inactive' })
      await walletController.fundWallet(req, res)
      expect(res.status).toHaveBeenCalledWith(403)
      expect(res.json).toHaveBeenCalledWith({ message: 'Wallet is not active' })
    })

    it('funds wallet successfully and completes transaction', async () => {
      await walletController.fundWallet(req, res)

      expect(mockWallet.balance).toBe(150)
      expect(mockWallet.save).toHaveBeenCalled()
      expect(mockTransaction.status).toBe(TRX_STATUS.COMPLETED)
      expect(mockTransaction.save).toHaveBeenCalled()
      expect(emit).toHaveBeenCalledWith(userId, 'transactionCreated', mockTransaction)
      expect(emit).toHaveBeenCalledWith(userId, 'walletUpdated', mockWallet)
      expect(emit).toHaveBeenCalledWith(userId, 'transactionUpdated', mockTransaction)
      expect(res.status).toHaveBeenCalledWith(201)
      expect(res.json).toHaveBeenCalledWith({ wallet: mockWallet, transaction: mockTransaction })
    })
  })

  // ---------------- WITHDRAW WALLET ----------------
  describe('withdrawFromWallet', () => {
    beforeEach(() => {
      req.body = { walletId: mockWallet._id, amount: 60, recipient: 'John' }
      Wallet.findOne.mockResolvedValue(mockWallet)
      Transaction.create.mockResolvedValue(mockTransaction)
    })

    it('returns 401 if user not authenticated', async () => {
      req.user = null
      await walletController.withdrawFromWallet(req, res)
      expect(res.status).toHaveBeenCalledWith(401)
    })

    it('returns 400 for invalid amount', async () => {
      req.body.amount = -5
      await walletController.withdrawFromWallet(req, res)
      expect(res.status).toHaveBeenCalledWith(400)
      expect(res.json).toHaveBeenCalledWith({ message: 'Invalid amount' })
    })

    it('returns 404 if wallet not found', async () => {
      Wallet.findOne.mockResolvedValue(null)
      await walletController.withdrawFromWallet(req, res)
      expect(res.status).toHaveBeenCalledWith(404)
      expect(res.json).toHaveBeenCalledWith({ message: 'Wallet not found' })
    })

    it('returns 403 if wallet not active', async () => {
      Wallet.findOne.mockResolvedValue({ ...mockWallet, status: 'Inactive' })
      await walletController.withdrawFromWallet(req, res)
      expect(res.status).toHaveBeenCalledWith(403)
      expect(res.json).toHaveBeenCalledWith({ message: 'Wallet is not active' })
    })

    it('returns 400 if insufficient balance', async () => {
      Wallet.findOne.mockResolvedValue({ ...mockWallet, balance: 30 })
      await walletController.withdrawFromWallet(req, res)
      expect(res.status).toHaveBeenCalledWith(400)
      expect(res.json).toHaveBeenCalledWith({ message: 'Insufficient balance' })
    })

    it('withdraws successfully', async () => {
      await walletController.withdrawFromWallet(req, res)

      expect(mockWallet.balance).toBe(40)
      expect(mockWallet.save).toHaveBeenCalled()
      expect(Transaction.create).toHaveBeenCalledWith(expect.objectContaining({
        userId,
        walletId: mockWallet._id,
        type: TRX_TYPE.WITHDRAW,
        amount: 60,
        status: TRX_STATUS.COMPLETED,
        beneficiary: 'John'
      }))
      expect(emit).toHaveBeenCalledWith(userId, 'walletUpdated', mockWallet)
      expect(emit).toHaveBeenCalledWith(userId, 'transactionCreated', mockTransaction)
      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.json).toHaveBeenCalledWith({ wallet: mockWallet, transaction: mockTransaction })
    })
  })

  // ---------------- GET WALLETS ----------------
  describe('getWallets', () => {
    it('returns 401 if not authenticated', async () => {
      req.user = null
      await walletController.getWallets(req, res)
      expect(res.status).toHaveBeenCalledWith(401)
      expect(res.json).toHaveBeenCalledWith({ message: 'Unauthorized' })
    })

    it('returns wallets successfully', async () => {
      Wallet.find.mockReturnValue({ sort: jest.fn().mockResolvedValue([mockWallet]) })
      await walletController.getWallets(req, res)
      expect(res.json).toHaveBeenCalledWith({ wallets: [mockWallet] })
    })
  })
})
