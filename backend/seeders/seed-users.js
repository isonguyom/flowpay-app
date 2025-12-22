import dotenv from 'dotenv';
dotenv.config();

import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import { sanitizeCurrency } from '../config/currencies.js';
import { USER_ROLES, USER_STATUS } from '../helpers/userHelpers.js';
import { connectDB, disconnectDB } from '../services/db.js';

const seedUsers = async () => {
    await connectDB();
    console.log('MongoDB connected');

    // Clear existing users
    await User.deleteMany({});
    console.log('Existing users cleared');

    const users = [
        { name: 'Alice', email: 'alice@example.com', password: 'password123', role: USER_ROLES.ADMIN, status: USER_STATUS.ACTIVE },
        { name: 'Bob', email: 'bob@example.com', password: 'password123', role: USER_ROLES.USER, status: USER_STATUS.ACTIVE },
    ];

    for (const user of users) {
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(user.password, salt);

        await User.create({
            name: user.name,
            email: user.email,
            passwordHash,
            defaultCurrency: sanitizeCurrency(user.defaultCurrency || 'USD'), // ensures valid currency
            role: user.role,
            status: user.status,
            isActive: user.status === USER_STATUS.ACTIVE,
        });
    }

    console.log('Users seeded successfully');
    await disconnectDB();
};

seedUsers().catch(err => {
    console.error(err);
    process.exit(1);
});
