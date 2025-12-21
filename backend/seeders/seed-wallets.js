import dotenv from 'dotenv';
dotenv.config();

import User from '../models/User.js';
import Wallet from '../models/Wallet.js';
import { listSupportedCurrencies, sanitizeCurrency } from '../config/currencies.js';
import { connectDB, disconnectDB } from '../services/db.js';
import { WALLET_STATUS } from '../helpers/walletHelpers.js';

const seedWallets = async () => {
    await connectDB();
    console.log('MongoDB connected');

    // Fetch all users
    const users = await User.find({});

    // Optional: clear existing wallets
    await Wallet.deleteMany({});
    console.log('Existing wallets cleared');

    for (const user of users) {
        // Start with default currency
        const currenciesToSeed = [user.defaultCurrency];

        // Add other supported currencies
        const allCurrencies = listSupportedCurrencies();
        allCurrencies.forEach((c) => {
            if (!currenciesToSeed.includes(c)) currenciesToSeed.push(c);
        });

        for (const currency of currenciesToSeed) {
            const sanitizedCurrency = sanitizeCurrency(currency);

            // Skip if wallet already exists
            const exists = await Wallet.findOne({ userId: user._id, currency: sanitizedCurrency });
            if (exists) continue;

            await Wallet.create({
                userId: user._id,
                currency: sanitizedCurrency,
                balance: 0,
                status: WALLET_STATUS.ACTIVE,
                // isPrimary is handled automatically by pre-save hook
            });
        }
    }

    console.log('Wallets seeded successfully');
    await disconnectDB();
};

seedWallets().catch((err) => {
    console.error(err);
    process.exit(1);
});
