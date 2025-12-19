import express from 'express'
import { getFxRates } from '../services/fxService.js'

const router = express.Router()

router.get('/rates', async (req, res) => {
    const { base = 'USD' } = req.query
    const data = await getFxRates(base)
    res.json(data)
})

export default router
