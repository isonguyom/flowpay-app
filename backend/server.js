import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import path from 'path';
import { createServer } from 'http';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


import authRoutes from './routes/auth.js';
import paymentRoutes from './routes/payments.js';
import transactionRoutes from './routes/transactions.js';
import walletRoutes from './routes/wallets.js';
import fxRoutes from './routes/fx.js';
import webhookRoutes from './routes/webhook.js';
import socketTestRoutes from './routes/socketTest.js'
import { swaggerDocs } from './docs/swagger.js'
import { connectDB } from './services/db.js';


import { initSocket } from './services/socket.js';

const app = express();
const PORT = process.env.PORT || 8000;


// -------------------- HTTP + WebSocket Setup --------------------
const server = createServer(app);

// Initialize Socket.IO via the socket service
const io = initSocket(server);

// Make io accessible in routes if needed
app.set('io', io);

// -------------------- Middleware --------------------
app.use(morgan('combined'));

app.use(cors({
    origin: [
        'http://localhost:5173',
        'http://frontend:5173',
        'https://flowpayapp.vercel.app'
    ],
    credentials: true
}));

// Webhook route should come before JSON parser if raw body is needed
app.use('/api/webhooks', webhookRoutes);

app.use(express.json());

// Home route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'landing.html'));
});

// Register Swagger
swaggerDocs(app)

// -------------------- API Routes --------------------
app.use('/api/auth', authRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/wallets', walletRoutes);
app.use('/api/fx', fxRoutes);

// -------------------- Health Check --------------------
app.get('/health', (req, res) => res.json({ status: 'ok' }));
app.use('/api/test-socket', socketTestRoutes)


// -------------------- MongoDB Connection --------------------
await connectDB();

// -------------------- Error Handling --------------------
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Internal server error', error: err.message });
});

// -------------------- Start Server --------------------
server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
