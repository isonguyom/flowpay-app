// routes/webhook.js
import express from 'express'
import { handleFlowpayWebhook } from '../controllers/webhookController.js'

const router = express.Router()

// Webhook endpoint (public, but secured via signature)
router.post('/flowpay', handleFlowpayWebhook)

export default router
