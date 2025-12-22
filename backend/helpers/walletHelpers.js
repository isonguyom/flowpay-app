// helpers/walletHelpers.js
import Wallet from '../models/Wallet.js'

// ---- Wallet Status ----
export const WALLET_STATUS = {
  ACTIVE: 'Active',
  PENDING: 'Pending',
  DISABLED: 'Disabled',
}

/**
 * Ensures only ONE primary wallet per user.
 * If no primary wallet exists, make the current one primary.
 */
export async function setPrimaryWallet(wallet) {
  if (!wallet?.userId) return

  const existingPrimary = await Wallet.findOne({
    userId: wallet.userId,
    isPrimary: true,
    _id: { $ne: wallet._id },
  })

  if (!existingPrimary) {
    wallet.isPrimary = true
  }
}
