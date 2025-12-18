import dotenv from 'dotenv'
dotenv.config()

import express from 'express'
import mongoose from 'mongoose'
import cors from 'cors'
import authRoutes from './routes/auth.js'
import paymentRoutes from './routes/payments.js'
import transactionRoutes from './routes/transactions.js'
import walletRoutes from './routes/wallets.js'
import fxRoutes from './routes/fx.js'
import webhookRoutes from './routes/webhook.js'



const app = express()
const PORT = process.env.PORT || 8000

// ✅ Environment check (bootstrap-level)
if (process.env.NODE_ENV !== 'production') {
    console.log('Dev mode enabled')
}

// ---------------- Middleware ----------------
app.use(cors({
    origin: [
        'http://localhost:5173',              // local dev
        'http://frontend:5173',
        'https://flowpayapp.vercel.app'    // production
    ],
    credentials: true
}))

app.use(express.json())

// ---------------- Routes ----------------
app.use('/api/auth', authRoutes)
app.use('/api/payments', paymentRoutes)
app.use('/api/transactions', transactionRoutes)
app.use('/api/wallets', walletRoutes)
app.use('/api/fx', fxRoutes)
app.use('/api/webhooks', webhookRoutes)



// Test route
app.get("/health", (req, res) => {
    res.json({ status: "ok" });
});


// ---------------- MongoDB connection ----------------
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.error('MongoDB connection error:', err))

// ---------------- Start server ----------------
app.listen(PORT, () => console.log(`Server running on port http://localhost:${PORT}`))
