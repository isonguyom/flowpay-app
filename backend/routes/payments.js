import express from 'express'
import { makePayment } from '../controllers/paymentController.js'
import { protect } from '../middlewares/auth.js'
import { idempotencyMiddleware } from '../middlewares/idempotency.js'
import { paymentRateLimiter, paymentThrottle } from '../limiters/paymentRateLimit.js'

const router = express.Router()

router.post(
    '/',
    protect,
    idempotencyMiddleware,
    paymentRateLimiter,
    paymentThrottle,
    makePayment
)

export default router
