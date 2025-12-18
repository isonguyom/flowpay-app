// routes/fx.js
import express from 'express'
import axios from 'axios'

const router = express.Router()

// Get FX rates
router.get('/rates', async (req, res) => {
    try {
        const { base = 'USD' } = req.query
        const response = await axios.get(`https://api.frankfurter.app/latest?from=${base}`)
        res.json(response.data)
    } catch (err) {
        console.error('FX rate error:', err.message)
        res.status(500).json({ message: 'Failed to fetch FX rates' })
    }
})

export default router
