import mongoose from 'mongoose'
import dotenv from 'dotenv'
import bcrypt from 'bcryptjs'

// Models
import User from '../models/User.js'
import Wallet from '../models/Wallet.js'
import Transaction from '../models/Transaction.js'
import FundingAccount from '../models/FundingAccount.js'

dotenv.config()

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI)
    console.log('Connected to MongoDB')

    // ------------------------
    // 1️⃣ Users
    // ------------------------
    console.log('Seeding users...')
    await User.deleteMany({})
    const hashedPassword = await bcrypt.hash('password123', 10)
    const users = await User.insertMany([
      { email: 'admin@example.com', password: hashedPassword, name: 'Admin User' },
      { email: 'user1@example.com', password: hashedPassword, name: 'John Doe' },
      { email: 'user2@example.com', password: hashedPassword, name: 'Jane Smith' },
    ])
    const [admin, user1, user2] = users

    // ------------------------
    // 2️⃣ Wallets
    // ------------------------
    console.log('Seeding wallets...')
    await Wallet.deleteMany({})
    const wallets = await Wallet.insertMany([
      { user: admin._id, currency: 'USD', amount: 1000 },
      { user: admin._id, currency: 'EUR', amount: 500 },
      { user: user1._id, currency: 'USD', amount: 300 },
      { user: user1._id, currency: 'NGN', amount: 20000 },
      { user: user2._id, currency: 'GBP', amount: 400 },
    ])

    // ------------------------
    // 3️⃣ Transactions
    // ------------------------
    console.log('Seeding transactions...')
    await Transaction.deleteMany({})
    await Transaction.insertMany([
      {
        user: user1._id,
        type: 'PAYMENT',
        fundingAccount: 'Bank of Africa',
        beneficiary: '0xABC123',
        amount: 50,
        settlementAmount: 50,
        fee: 1,
        sourceCurrency: 'USD',
        destinationCurrency: 'EUR',
        fxRate: 1.1,
        status: 'Completed',
        createdAt: new Date(),
      },
      {
        user: user2._id,
        type: 'PAYMENT',
        fundingAccount: 'Access Bank',
        beneficiary: '0xXYZ456',
        amount: 100,
        settlementAmount: 100,
        fee: 2,
        sourceCurrency: 'GBP',
        destinationCurrency: 'USD',
        fxRate: 1.3,
        status: 'Pending',
        createdAt: new Date(),
      },
    ])

    // ------------------------
    // 4️⃣ Funding Accounts
    // ------------------------
    console.log('Seeding funding accounts...')
    await FundingAccount.deleteMany({})
    await FundingAccount.insertMany([
      { name: 'Bank of Africa', accountNumber: '1234567890', bankCode: 'BOA', user: user1._id },
      { name: 'Access Bank', accountNumber: '9876543210', bankCode: 'ACCESS', user: user2._id },
      { name: 'GT Bank', accountNumber: '1122334455', bankCode: 'GTB', user: admin._id },
    ])

    console.log('✅ Seeding complete!')
    await mongoose.disconnect()
    console.log('Disconnected from MongoDB')
  } catch (err) {
    console.error('Seeding failed:', err)
    process.exit(1)
  }
}

seed()
