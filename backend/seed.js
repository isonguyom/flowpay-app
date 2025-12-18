require('dotenv').config()
const mongoose = require('mongoose')
const Wallet = require('./models/Wallet')
const User = require('./models/User') // if you have a User model

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })

const seed = async () => {
    try {
        // Optional: clear previous data
        await Wallet.deleteMany({})

        // Example: Seed default wallets for users
        const users = await User.find({}) // all users
        for (const user of users) {
            await Wallet.create({
                user: user._id,
                currency: 'NGN',
                amount: 0, // default 0 balance
            })
        }

        console.log('Database seeding complete')
        process.exit()
    } catch (err) {
        console.error('Seeding error:', err)
        process.exit(1)
    }
}

seed()
