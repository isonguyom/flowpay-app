import dotenv from 'dotenv';

dotenv.config({ path: '.env.test' });

// Increase timeout safety for slow CI / DB
jest.setTimeout(30000);
