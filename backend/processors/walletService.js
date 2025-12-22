import Wallet from '../models/Wallet.js';
import Transaction from '../models/Transaction.js';

export const withdrawFromWallet = async ({ userId, currency, amount, type, beneficiary, fee = 0, settlementAmount }) => {
    const wallet = await Wallet.findOne({ user: userId, currency });
    if (!wallet) throw new Error('Wallet not found');

    const totalDebit = amount + fee;
    if (wallet.amount < totalDebit) throw new Error('Insufficient wallet balance');

    wallet.amount -= totalDebit;
    await wallet.save();

    const transaction = await Transaction.create({
        user: userId,
        type,
        amount,
        sourceCurrency: currency,
        destinationCurrency: currency,
        beneficiary: beneficiary || 'Unknown',
        fee,
        settlementAmount: settlementAmount || amount,
        status: 'Completed',
    });

    return { wallet, transaction };
};
