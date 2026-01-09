import { loadStripe } from '@stripe/stripe-js';

const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;

if (!stripePublishableKey) {
  console.warn('Missing Stripe publishable key');
}

export const stripePromise = stripePublishableKey ? loadStripe(stripePublishableKey) : null;

export const PRICE_ID = import.meta.env.VITE_STRIPE_PRICE_ID;
export const PRICE_AMOUNT = 29;
export const TRIAL_DAYS = 3;




