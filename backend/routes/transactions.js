import express from 'express';
import { protect } from '../middlewares/auth.js';
import { getUserTransactions } from '../controllers/transactionController.js';

const router = express.Router();

// GET all transactions for the logged-in user
router.get('/', protect, getUserTransactions);


export default router;
