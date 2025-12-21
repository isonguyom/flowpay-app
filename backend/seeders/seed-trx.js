import dotenv from 'dotenv';
dotenv.config();

import Transaction from '../models/Transaction.js';
import User from '../models/User.js';
import Wallet from '../models/Wallet.js';
import { TRX_TYPE, TRX_STATUS } from '../helpers/trxHelpers.js';
import { DEFAULT_CURRENCY } from '../config/currencies.js';
import { connectDB, disconnectDB } from '../services/db.js';

const seedTransactions = async () => {
  await connectDB(); // use the service file
  console.log('MongoDB connected');

  // Clear existing transactions
  await Transaction.deleteMany({});
  console.log('Existing transactions cleared');

  const users = await User.find({});
  const wallets = await Wallet.find({});

  const transactions = [];

  for (const user of users) {
    const userWallets = wallets.filter(w => w.userId.toString() === user._id.toString());

    if (!userWallets.length) continue;

    const wallet = userWallets[0]; // pick first wallet for demo

    // FUND transaction
    transactions.push({
      userId: user._id,
      type: TRX_TYPE.FUND,
      amount: 1000,
      sourceCurrency: DEFAULT_CURRENCY,
      destinationCurrency: DEFAULT_CURRENCY,
      fxRate: 1,
      fee: 0,
      settlementAmount: 1000,
      status: TRX_STATUS.COMPLETED,
      walletId: wallet._id,
    });

    // PAYMENT transaction
    transactions.push({
      userId: user._id,
      type: TRX_TYPE.PAYMENT,
      amount: 200,
      sourceCurrency: wallet.currency,
      destinationCurrency: DEFAULT_CURRENCY,
      fxRate: 1,
      fee: 5,
      settlementAmount: 195,
      status: TRX_STATUS.PENDING,
      walletId: wallet._id,
      beneficiary: 'Acme Corp',
    });
  }

  await Transaction.insertMany(transactions);
  console.log('Transactions seeded successfully');

  await disconnectDB();
};

seedTransactions().catch(err => {
  console.error(err);
  process.exit(1);
});
