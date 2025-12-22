import { jest } from '@jest/globals'

import {
    createWallet,
    getWallets,
    fundWallet,
    withdrawFromWallet,
} from '../../../controllers/walletController.js'

import Wallet from '../../../models/Wallet.js'
import Transaction from '../../../models/Transaction.js'
import { getSocket } from '../../../services/socket.js'

// -----------------------------
// Mocks
// -----------------------------
jest.mock('../../../models/Wallet.js')
jest.mock('../../../models/Transaction.js')
jest.mock('../../../services/socket.js')

// -----------------------------
// Helpers
// -----------------------------
const mockEmit = jest.fn()
const mockTo = jest.fn(() => ({ emit: mockEmit }))

const mockSocket = {
    to: mockTo,
}

const mockRes = () => {
    const res = {}
    res.status = jest.fn().mockReturnValue(res)
    res.json = jest.fn().mockReturnValue(res)
    return res
}

const mockWallet = {
    _id: 'wallet123',
    userId: 'user123',
    currency: 'USD',
    balance: 100,
    status: 'Active',
    save: jest.fn(),
}

const mockTransaction = {
    _id: 'txn123',
    status: 'Pending',
    save: jest.fn(),
}

beforeEach(() => {
    jest.clearAllMocks()
    getSocket.mockReturnValue(mockSocket)
})

/* =====================================================
   CREATE WALLET
===================================================== */
describe('createWallet', () => {
    it('should create a wallet and emit socket event', async () => {
        Wallet.findOne.mockResolvedValue(null)
        Wallet.create.mockResolvedValue(mockWallet)

        const req = {
            user: { _id: 'user123' },
            body: { currency: 'USD' },
        }
        const res = mockRes()

        await createWallet(req, res)

        expect(Wallet.findOne).toHaveBeenCalledWith({
            userId: 'user123',
            currency: 'USD',
        })
        expect(Wallet.create).toHaveBeenCalled()
        expect(res.status).toHaveBeenCalledWith(201)
        expect(mockEmit).toHaveBeenCalledWith('walletCreated', mockWallet)
    })

    it('should return 409 if wallet already exists', async () => {
        Wallet.findOne.mockResolvedValue(mockWallet)

        const req = {
            user: { _id: 'user123' },
            body: { currency: 'USD' },
        }
        const res = mockRes()

        await createWallet(req, res)

        expect(res.status).toHaveBeenCalledWith(409)
        expect(res.json).toHaveBeenCalledWith({
            message: 'Wallet for USD already exists',
        })
    })

    it('should return 400 if currency is missing', async () => {
        const req = { user: { _id: 'user123' }, body: {} }
        const res = mockRes()

        await createWallet(req, res)

        expect(res.status).toHaveBeenCalledWith(400)
    })
})

/* =====================================================
   GET WALLETS
===================================================== */
describe('getWallets', () => {
    it('should fetch user wallets', async () => {
        Wallet.find.mockReturnValue({
            sort: jest.fn().mockResolvedValue([mockWallet]),
        })

        const req = { user: { _id: 'user123' } }
        const res = mockRes()

        await getWallets(req, res)

        expect(Wallet.find).toHaveBeenCalledWith({ userId: 'user123' })
        expect(res.json).toHaveBeenCalledWith({
            wallets: [mockWallet],
        })
    })
})

/* =====================================================
   FUND WALLET
===================================================== */
describe('fundWallet', () => {
    it('should fund wallet and create transaction', async () => {
        Wallet.findOne.mockResolvedValue(mockWallet)
        Transaction.create.mockResolvedValue(mockTransaction)

        const req = {
            user: { _id: 'user123' },
            body: { walletId: 'wallet123', amount: 50 },
        }
        const res = mockRes()

        await fundWallet(req, res)

        expect(mockWallet.balance).toBe(150)
        expect(mockWallet.save).toHaveBeenCalled()
        expect(Transaction.create).toHaveBeenCalled()
        expect(mockEmit).toHaveBeenCalledWith('walletUpdated', mockWallet)
    })

    it('should return 400 for invalid amount', async () => {
        const req = {
            user: { _id: 'user123' },
            body: { walletId: 'wallet123', amount: -10 },
        }
        const res = mockRes()

        await fundWallet(req, res)

        expect(res.status).toHaveBeenCalledWith(400)
    })

    it('should return 404 if wallet not found', async () => {
        Wallet.findOne.mockResolvedValue(null)

        const req = {
            user: { _id: 'user123' },
            body: { walletId: 'wallet123', amount: 10 },
        }
        const res = mockRes()

        await fundWallet(req, res)

        expect(res.status).toHaveBeenCalledWith(404)
    })
})

/* =====================================================
   WITHDRAW FROM WALLET
===================================================== */
describe('withdrawFromWallet', () => {
    beforeEach(() => {
        jest.useFakeTimers()
    })

    afterEach(() => {
        jest.useRealTimers()
    })

  it('should withdraw from wallet and complete transaction', async () => {
    const wallet = {
        ...mockWallet,
        balance: 100,   // make sure property matches your controller (balance, not amount)
        save: jest.fn(),
    }

    Wallet.findOne.mockResolvedValue(wallet)
    const transaction = { ...mockTransaction, save: jest.fn() }
    Transaction.create.mockResolvedValue(transaction)

    const req = {
        user: { _id: 'user123' },
        body: {
            walletId: 'wallet123',
            amount: 50,
            recipient: 'Bank XYZ',
        },
    }
    const res = mockRes()

    await withdrawFromWallet(req, res)

    // Wallet updated emit
    expect(mockEmit).toHaveBeenCalledWith('walletUpdated', wallet)
    
    // Fast-forward setTimeout
    jest.runAllTimers()

    expect(transaction.save).toHaveBeenCalled()
    expect(mockEmit).toHaveBeenCalledWith('transactionCreated', transaction)
})


    it('should fail if wallet is inactive', async () => {
        Wallet.findOne.mockResolvedValue({
            ...mockWallet,
            status: 'Frozen',
        })

        const req = {
            user: { _id: 'user123' },
            body: { walletId: 'wallet123', amount: 10 },
        }
        const res = mockRes()

        await withdrawFromWallet(req, res)

        expect(res.status).toHaveBeenCalledWith(403)
    })

    it('should fail if insufficient balance', async () => {
        Wallet.findOne.mockResolvedValue({
            ...mockWallet,
            balance: 10,
        })

        const req = {
            user: { _id: 'user123' },
            body: { walletId: 'wallet123', amount: 100 },
        }
        const res = mockRes()

        await withdrawFromWallet(req, res)

        expect(res.status).toHaveBeenCalledWith(400)
    })
})
