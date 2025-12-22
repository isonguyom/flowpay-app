import { jest } from '@jest/globals';
import * as stripeService from '../../../services/stripeService.js'; // update path if needed

describe('Stripe Service', () => {
    let originalStripeSecretKey;
    let mockStripeClass;

    beforeEach(() => {
        // Backup original environment variable
        originalStripeSecretKey = process.env.STRIPE_SECRET_KEY;

        // Reset singleton
        stripeService.__resetStripe?.();

        // Mock Stripe constructor
        mockStripeClass = jest.fn();
        jest.unstable_mockModule('stripe', () => {
            return {
                default: mockStripeClass
            };
        });
    });

    afterEach(() => {
        // Restore env
        process.env.STRIPE_SECRET_KEY = originalStripeSecretKey;
        jest.resetModules();
        jest.clearAllMocks();
    });

    it('should throw error if STRIPE_SECRET_KEY is not defined', () => {
        process.env.STRIPE_SECRET_KEY = '';
        expect(() => stripeService.getStripe()).toThrow('STRIPE_SECRET_KEY not defined');
    });

    it('should create a new Stripe instance if not initialized', () => {
        process.env.STRIPE_SECRET_KEY = 'sk_test_123';

        const stripeInstance = stripeService.getStripe();

        expect(stripeInstance).toBeDefined();
        // The returned object is the singleton Stripe instance
        expect(stripeService.getStripe()).toBe(stripeInstance);
    });

    it('should return the same instance on multiple calls', () => {
        process.env.STRIPE_SECRET_KEY = 'sk_test_123';

        const first = stripeService.getStripe();
        const second = stripeService.getStripe();

        expect(first).toBe(second); // singleton check
    });
});
