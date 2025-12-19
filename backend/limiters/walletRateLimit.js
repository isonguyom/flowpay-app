import rateLimit from 'express-rate-limit'

// --------------------
// Wallet API Rate Limiter
// --------------------
export const walletRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20, // max 20 requests per 15 minutes per IP
    message: {
        status: 'fail',
        message: 'Too many wallet requests from this IP, please try again later'
    },
    standardHeaders: true,
    legacyHeaders: false,
})

// --------------------
// Wallet Request Throttle (per user)
// --------------------
const throttleStore = new Map()

export const walletThrottle = (req, res, next) => {
    const userId = req.user?._id?.toString()
    if (!userId) return res.status(401).json({ status: 'fail', message: 'Unauthorized' })

    const now = Date.now()
    const throttleTime = 5000 // 5 seconds between wallet requests
    const lastRequest = throttleStore.get(userId) || 0

    if (now - lastRequest < throttleTime) {
        return res.status(429).json({
            status: 'fail',
            message: `You're doing that too fast. Please wait ${Math.ceil((throttleTime - (now - lastRequest)) / 1000)}s`
        })
    }

    throttleStore.set(userId, now)
    next()
}
