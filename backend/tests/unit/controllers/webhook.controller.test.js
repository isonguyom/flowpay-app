import { handleStripeWebhook } from '../../../controllers/webhookController.js'
import Transaction from '../../../models/Transaction.js'
import Wallet from '../../../models/Wallet.js'
import { emit } from '../../../helpers/paymentControllerHelpers.js'
import { getStripe } from '../../../services/stripeService.js'

jest.mock('../../../models/Transaction.js')
jest.mock('../../../models/Wallet.js')
jest.mock('../../../helpers/paymentControllerHelpers.js')
jest.mock('../../../services/stripeService.js')

describe('Stripe Webhook Controller', () => {
  let req, res, stripeMock

  beforeEach(() => {
    req = { headers: { 'stripe-signature': 'sig_test' }, body: '{}' }
    res = { status: jest.fn().mockReturnThis(), json: jest.fn(), send: jest.fn() }

    // Mock Stripe instance
    stripeMock = {
      webhooks: { constructEvent: jest.fn() }
    }
    getStripe.mockReturnValue(stripeMock)
    emit.mockClear()
  })

  it('should return 400 if signature verification fails', async () => {
    stripeMock.webhooks.constructEvent.mockImplementation(() => {
      throw new Error('Invalid signature')
    })

    await handleStripeWebhook(req, res)
    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.send).toHaveBeenCalledWith(expect.stringContaining('Invalid signature'))
  })

  it('should handle payment_intent.succeeded', async () => {
    const fakeTransaction = { 
      _id: 'trx1', userId: 'user1', walletId: 'wallet1', amount: 100, 
      status: 'Pending', save: jest.fn() 
    }
    const fakeWallet = { _id: 'wallet1', userId: 'user1', balance: 50, save: jest.fn() }

    stripeMock.webhooks.constructEvent.mockReturnValue({
      type: 'payment_intent.succeeded',
      data: { object: { metadata: { transactionId: 'trx1' } } }
    })

    Transaction.findById.mockResolvedValue(fakeTransaction)
    Wallet.findById.mockResolvedValue(fakeWallet)

    await handleStripeWebhook(req, res)

    expect(fakeTransaction.status).toBe('Completed')
    expect(fakeTransaction.save).toHaveBeenCalled()
    expect(fakeWallet.balance).toBe(150)
    expect(fakeWallet.save).toHaveBeenCalled()
    expect(emit).toHaveBeenCalledWith(fakeTransaction.userId, 'transactionUpdated', fakeTransaction)
    expect(emit).toHaveBeenCalledWith(fakeWallet.userId, 'walletUpdated', fakeWallet)
    expect(res.json).toHaveBeenCalledWith({ received: true })
  })

  it('should handle payment_intent.payment_failed', async () => {
    const fakeTransaction = { 
      _id: 'trx2', userId: 'user2', walletId: 'wallet2', amount: 50, 
      status: 'Pending', save: jest.fn() 
    }
    const fakeWallet = { _id: 'wallet2', userId: 'user2', balance: 200, save: jest.fn() }

    stripeMock.webhooks.constructEvent.mockReturnValue({
      type: 'payment_intent.payment_failed',
      data: { object: { metadata: { transactionId: 'trx2' } } }
    })

    Transaction.findById.mockResolvedValue(fakeTransaction)
    Wallet.findById.mockResolvedValue(fakeWallet)

    await handleStripeWebhook(req, res)

    expect(fakeTransaction.status).toBe('Failed')
    expect(fakeTransaction.save).toHaveBeenCalled()
    expect(fakeWallet.balance).toBe(250)
    expect(fakeWallet.save).toHaveBeenCalled()
    expect(emit).toHaveBeenCalledWith(fakeTransaction.userId, 'transactionUpdated', fakeTransaction)
    expect(emit).toHaveBeenCalledWith(fakeWallet.userId, 'walletUpdated', fakeWallet)
    expect(res.json).toHaveBeenCalledWith({ received: true })
  })

  it('should log unhandled event types but still return 200', async () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {})
    stripeMock.webhooks.constructEvent.mockReturnValue({ type: 'charge.succeeded', data: {} })

    await handleStripeWebhook(req, res)

    expect(consoleSpy).toHaveBeenCalledWith('Unhandled Stripe event type: charge.succeeded')
    expect(res.json).toHaveBeenCalledWith({ received: true })
    consoleSpy.mockRestore()
  })
})
