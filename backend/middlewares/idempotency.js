import IdempotencyKey from '../models/IdempotencyKey.js'

export const idempotencyMiddleware = async (req, res, next) => {
  const key = req.headers['idempotency-key']
  const userId = req.user?._id

  if (!key) return next()
  if (!userId) return res.status(401).json({ message: 'Authentication required for idempotency' })

  const existing = await IdempotencyKey.findOne({
    key,
    userId,        
    endpoint: req.originalUrl
  })

  if (existing) {
    return res.status(existing.statusCode).json(existing.response)
  }

  // Monkey-patch res.json to capture response
  const originalJson = res.json.bind(res)
  res.json = async (body) => {
    await IdempotencyKey.create({
      key,
      userId,        // ✅ fixed
      endpoint: req.originalUrl,
      response: body,
      statusCode: res.statusCode
    })

    return originalJson(body)
  }

  next()
}
