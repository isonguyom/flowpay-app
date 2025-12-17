// server.js
import dotenv from 'dotenv'
dotenv.config()

import express from 'express'
import mongoose from 'mongoose'
import cors from 'cors'
import authRoutes from './routes/auth.js'
import paymentRoutes from './routes/payments.js'
import transactionRoutes from './routes/transactions.js'
import walletRoutes from './routes/wallets.js'


const app = express()
const PORT = process.env.PORT || 8000

// ---------------- Middleware ----------------
app.use(cors({ origin: 'http://localhost:5173', credentials: true }))
app.use(express.json())

// ---------------- Routes ----------------
app.use('/api/auth', authRoutes)
app.use('/api/payments', paymentRoutes)
app.use('/api/transactions', transactionRoutes)
app.use('/api/wallets', walletRoutes)




// Test route
app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
});


// ---------------- MongoDB connection ----------------
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.error('MongoDB connection error:', err))

// ---------------- Start server ----------------
app.listen(PORT, () => console.log(`Server running on port http://localhost:${PORT}`))
