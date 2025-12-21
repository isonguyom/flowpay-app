// ---- Wallet Status ----
export const WALLET_STATUS = {
    ACTIVE: 'Active',
    PENDING: 'Pending',
    DISABLED: 'Disabled',
};

/**
 * Sets isPrimary for a new wallet based on user's defaultCurrency
 * Ensures only one primary wallet per user
 */
import Wallet from '../models/Wallet.js';

export async function setPrimaryWallet(wallet, userDefaultCurrency) {
    if (!wallet) return;

    const userWallets = await Wallet.find({ userId: wallet.userId });

    // If user has no wallets, mark first wallet as primary
    if (userWallets.length === 0) {
        wallet.isPrimary = true;
        return;
    }

    // If the wallet's currency matches user's defaultCurrency, make it primary
    if (wallet.currency === userDefaultCurrency) {
        // Remove isPrimary from any other wallet of the same user
        await Wallet.updateMany(
            { userId: wallet.userId, isPrimary: true },
            { $set: { isPrimary: false } }
        );
        wallet.isPrimary = true;
    }
}
