import Stripe from 'stripe';
import dotenv from 'dotenv';

dotenv.config();

let stripe = null;

/**
 * Returns a singleton Stripe client instance
 * @returns {Stripe} Stripe client
 */

export const getStripe = () => {
  if (!stripe) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY not defined')
    }

    stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2022-11-15' // <- use a valid Stripe API version
    })
  }
  return stripe
}
