import { getUserTransactions, emitTransactionUpdate } from '../../../controllers/transactionController.js'
import Transaction from '../../../models/Transaction.js'
import { getSocket } from '../../../services/socket.js'

// Mock Mongoose Transaction model
jest.mock('../../../models/Transaction.js')

// Mock socket service
jest.mock('../../../services/socket.js', () => ({
    getSocket: jest.fn()
}))

describe('Transaction Controller', () => {
    let mockUserId
    let mockRes
    let mockReq

    beforeEach(() => {
        mockUserId = 'user123'
        mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        }
        mockReq = { user: { _id: mockUserId }, query: {} }
        jest.clearAllMocks()
    })

    // ================= GET USER TRANSACTIONS =================
    it('should return 401 if user is not provided', async () => {
        await getUserTransactions({ query: {} }, mockRes)
        expect(mockRes.status).toHaveBeenCalledWith(401)
        expect(mockRes.json).toHaveBeenCalledWith({ message: 'Unauthorized' })
    })

    it('should fetch transactions for a user with pagination', async () => {
        const mockTransactions = [{ _id: 'trx1', userId: mockUserId }]
        const mockTotal = 50

        // Mock total count
        Transaction.countDocuments.mockResolvedValue(mockTotal)

        // Mock find chain correctly
        const mockFindChain = {
            sort: jest.fn().mockReturnThis(),
            skip: jest.fn().mockReturnThis(),
            limit: jest.fn().mockReturnThis(),
            lean: jest.fn().mockResolvedValue(mockTransactions) // must resolve
        }
        Transaction.find.mockReturnValue(mockFindChain)

        // Set query params
        mockReq.query.page = '2'
        mockReq.query.limit = '10'

        await getUserTransactions(mockReq, mockRes)

        expect(Transaction.countDocuments).toHaveBeenCalledWith({ userId: mockUserId })
        expect(Transaction.find).toHaveBeenCalledWith({ userId: mockUserId })
        expect(mockFindChain.sort).toHaveBeenCalledWith({ createdAt: -1 })
        expect(mockFindChain.skip).toHaveBeenCalledWith(10)
        expect(mockFindChain.limit).toHaveBeenCalledWith(10)

        expect(mockRes.json).toHaveBeenCalledWith({
            transactions: mockTransactions,
            total: mockTotal,
            page: 2,
            limit: 10
        })
    })


    it('should handle errors and return 500', async () => {
        Transaction.find.mockImplementation(() => { throw new Error('DB failure') })
        await getUserTransactions(mockReq, mockRes)
        expect(mockRes.status).toHaveBeenCalledWith(500)
        expect(mockRes.json).toHaveBeenCalledWith({ message: 'Failed to fetch transactions' })
    })

    // ================= SOCKET EMITTER =================
    it('should skip emitting if transaction is invalid', () => {
        const mockTransaction = { _id: null, userId: null }
        emitTransactionUpdate(mockTransaction)
        expect(getSocket).not.toHaveBeenCalled()
    })

    it('should emit via socket', () => {
        const mockEmit = jest.fn()
        getSocket.mockReturnValue({ to: jest.fn(() => ({ emit: mockEmit })) })
        const mockTransaction = { _id: 'trx1', userId: mockUserId }

        emitTransactionUpdate(mockTransaction)
        expect(getSocket).toHaveBeenCalled()
        expect(mockEmit).toHaveBeenCalledWith('transactionCreated', mockTransaction)
    })

    it('should handle socket errors gracefully', () => {
        const mockTo = jest.fn(() => { throw new Error('Socket fail') })
        getSocket.mockReturnValue({ to: mockTo })
        const mockTransaction = { _id: 'trx1', userId: mockUserId }

        expect(() => emitTransactionUpdate(mockTransaction)).not.toThrow()
    })
})
