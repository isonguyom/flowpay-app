// tests/unit/controllers/payment.controller.test.js
import mongoose from 'mongoose';
import { makePayment } from '../../../controllers/paymentController.js';
import Payment from '../../../models/Payment.js';
import Transaction from '../../../models/Transaction.js';
import Wallet from '../../../models/Wallet.js';
import { getStripe } from '../../../services/stripeService.js';
import * as helpers from '../../../helpers/paymentControllerHelpers.js';

jest.mock('../../../models/Wallet');
jest.mock('../../../models/Transaction');
jest.mock('../../../models/Payment');
jest.mock('../../../services/stripeService');
jest.mock('../../../helpers/paymentControllerHelpers');

describe('makePayment controller', () => {
    let req, res, next;
    const mockUserId = new mongoose.Types.ObjectId();

    beforeEach(() => {
        req = {
            user: { _id: mockUserId },
            body: {
                beneficiary: 'John Doe',
                amount: 100,
                fee: 5,
                sourceWallet: 'USD',
                destinationCurrency: 'EUR',
                fxRate: 1.1,
            },
        };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        };
        helpers.emit = jest.fn();
        helpers.rollback = jest.fn();
        helpers.validatePaymentInput = jest.fn().mockReturnValue({ valid: true, amount: 100, fee: 5 });

        jest.clearAllMocks();

        // Mock wallet
        const mockWallet = { _id: new mongoose.Types.ObjectId(), balance: 200, save: jest.fn() };
        Wallet.findOne = jest.fn().mockResolvedValue(mockWallet);

        // Mock transaction creation
        const mockTransaction = { _id: new mongoose.Types.ObjectId(), save: jest.fn() };
        Transaction.create = jest.fn().mockResolvedValue(mockTransaction);

        // Mock payment creation
        const mockPayment = { _id: new mongoose.Types.ObjectId() };
        Payment.create = jest.fn().mockResolvedValue(mockPayment);

        // Save these for assertions
        global.mockWallet = mockWallet;
        global.mockTransaction = mockTransaction;
        global.mockPayment = mockPayment;
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should return 401 if user is not authenticated', async () => {
        req.user = null;
        await makePayment(req, res);
        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ message: 'Unauthorized' });
    });

    it('should return 400 if input validation fails', async () => {
        helpers.validatePaymentInput.mockReturnValue({ valid: false, message: 'Invalid fee' });
        await makePayment(req, res);
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ message: 'Invalid fee' });
    });

    it('should return 404 if wallet not found', async () => {
        Wallet.findOne.mockResolvedValue(null);
        await makePayment(req, res);
        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({ message: 'Wallet (USD) not found' });
    });

    it('should return 400 if wallet balance is insufficient', async () => {
        Wallet.findOne.mockResolvedValue({ _id: mockUserId, balance: 50, save: jest.fn() });
        await makePayment(req, res);
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ message: 'Insufficient wallet balance' });
    });

    it('should create transaction and respond with client secret', async () => {
        // Mock wallet
        const mockWallet = { _id: mockUserId, balance: 200, save: jest.fn().mockResolvedValue(true) };
        Wallet.findOne.mockResolvedValue(mockWallet);

        // Mock transaction
        const mockTransaction = { _id: new mongoose.Types.ObjectId(), save: jest.fn().mockResolvedValue(true) };
        Transaction.create.mockResolvedValue(mockTransaction);

        // Mock Stripe
        const mockPaymentIntent = { id: 'pi_123', client_secret: 'secret_123' };
        getStripe.mockReturnValue({
            paymentIntents: { create: jest.fn().mockResolvedValue(mockPaymentIntent) },
        });

        // Call the controller
        await makePayment(req, res);

        // -------------------- Assertions --------------------

        // Transaction was created
        expect(Transaction.create).toHaveBeenCalledTimes(1);

        // Wallet balance was updated
        expect(mockWallet.balance).toBe(95); // 200 - (100 + 5)

        // Transaction.save was called
        expect(mockTransaction.save).toHaveBeenCalled();

        // Response sent with correct client secret
        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith({
            transactionId: mockTransaction._id,
            clientSecret: 'secret_123',
        });
    });



    it('should rollback on error', async () => {
        Wallet.findOne.mockResolvedValue({ _id: mockUserId, balance: 200, save: jest.fn() });
        Transaction.create.mockRejectedValue(new Error('DB error'));

        await makePayment(req, res);

        expect(helpers.rollback).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ message: 'Payment initiation failed' });
    });
});
