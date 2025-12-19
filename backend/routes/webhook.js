import express from 'express';
import bodyParser from 'body-parser';
import { handleStripeWebhook } from '../controllers/webhookController.js';

const router = express.Router();

// Stripe requires raw body for signature verification
router.post(
    '/stripe',
    bodyParser.raw({ type: 'application/json' }),
    handleStripeWebhook
);

export default router;
