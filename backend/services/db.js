import dotenv from 'dotenv';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
    console.error('❌ MONGO_URI is not defined in .env');
    process.exit(1);
}

let isConnected = false;

/**
 * Connect to MongoDB
 * @param {object} mongooseInstance - Optional mongoose instance (for testing)
 */
export const connectDB = async (mongooseInstance) => {
    const mongoose = mongooseInstance ?? (await import('mongoose')).default;

    if (isConnected) return;

    try {
        await mongoose.connect(MONGO_URI);
        isConnected = true;
        console.log('✅ MongoDB connected');
    } catch (error) {
        console.error('❌ MongoDB connection error:', error);
        process.exit(1);
    }
};

/**
 * Disconnect from MongoDB
 * @param {object} mongooseInstance - Optional mongoose instance (for testing)
 */
export const disconnectDB = async (mongooseInstance) => {
    const mongoose = mongooseInstance ?? (await import('mongoose')).default;

    if (!isConnected) return;

    try {
        await mongoose.disconnect();
        isConnected = false;
        console.log('🔌 MongoDB disconnected');
    } catch (error) {
        console.error('❌ Error disconnecting MongoDB:', error);
    }
};

/**
 * Test-only: reset connection state
 */
export const __resetConnectionState = () => {
    isConnected = false;
};
