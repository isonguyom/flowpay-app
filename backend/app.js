import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';

import authRoutes from './routes/auth.js';
import paymentRoutes from './routes/payments.js';
import transactionRoutes from './routes/transactions.js';
import walletRoutes from './routes/wallets.js';
import fxRoutes from './routes/fx.js';
import webhookRoutes from './routes/webhook.js';
import { swaggerDocs } from './docs/swagger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const createApp = () => {
    const app = express();

    // -------------------- Middleware --------------------
    app.use(morgan('combined'));

    const allowedOrigins = process.env.CORS_ORIGIN?.split(',') || [];

    app.use(cors({
        origin: (origin, callback) => {
            if (!origin || allowedOrigins.includes(origin)) {
                callback(null, true);
            } else {
                callback(new Error('Not allowed by CORS'));
            }
        },
        credentials: true,
    }));

    // Stripe webhook (raw body if needed)
    app.use('/api/webhooks', webhookRoutes);

    app.use(express.json());

    // -------------------- Routes --------------------
    app.get('/', (req, res) => {
        res.sendFile(path.join(__dirname, 'landing.html'));
    });

    swaggerDocs(app);

    app.use('/api/auth', authRoutes);
    app.use('/api/payments', paymentRoutes);
    app.use('/api/transactions', transactionRoutes);
    app.use('/api/wallets', walletRoutes);
    app.use('/api/fx', fxRoutes);

    // -------------------- Health --------------------
    app.get('/health', (req, res) => {
        res.json({ status: 'ok' });
    });

    // -------------------- Error Handler --------------------
    app.use((err, req, res, next) => {
        console.error(err.stack);
        res.status(500).json({
            message: 'Internal server error',
            error: err.message,
        });
    });

    return app;
};
