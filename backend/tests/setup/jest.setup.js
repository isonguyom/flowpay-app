import dotenv from 'dotenv';
import { jest } from '@jest/globals'; // <- import jest

dotenv.config({ path: '.env.test' });

console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('STRIPE_SECRET_KEY loaded:', !!process.env.STRIPE_SECRET_KEY);

// Increase timeout safety for slow DB / CI
jest.setTimeout(30000);
