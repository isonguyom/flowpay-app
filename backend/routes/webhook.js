import express from 'express';
import bodyParser from 'body-parser';
import { handleStripeWebhooks } from '../controllers/webhookController.js';

const router = express.Router();

// Stripe requires raw body for signature verification
router.post(
    '/stripe',
    bodyParser.raw({ type: 'application/json' }),
    handleStripeWebhooks
);

export default router;
