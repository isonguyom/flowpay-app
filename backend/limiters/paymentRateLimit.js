import rateLimit from 'express-rate-limit'
import slowDown from 'express-slow-down'

// Rate limiter: max 5 requests per IP per minute
export const paymentRateLimiter = rateLimit({
    windowMs: 1 * 60 * 1000,
    max: 5,
    message: { message: 'Too many payment attempts. Try again later.', status: 429 },
    standardHeaders: true,
    legacyHeaders: false,
})

// Request throttling: add delay after 2 requests
export const paymentThrottle = slowDown({
    windowMs: 1 * 60 * 1000,
    delayAfter: 2,
    delayMs: () => 1000, // 1 second delay per request after 2
})
