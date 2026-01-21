import Stripe from 'stripe';
import asyncHandler from '../utils/asyncHandler.js';
import apiError from '../utils/apiError.js';
import apiResponse from '../utils/apiResponse.js';
import { User } from '../model/user.model.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
    apiVersion: '2024-06-20',
});

const PRICE_MAP = {
    individual: process.env.STRIPE_PRICE_INDIVIDUAL,
    team: process.env.STRIPE_PRICE_TEAM,
    pro: process.env.STRIPE_PRICE_PRO,
};

export const createCheckoutSession = asyncHandler(async (req, res) => {
    const { plan } = req.body;
    const priceId = PRICE_MAP[plan];
    if (!priceId) throw new apiError(400, 'Invalid plan');
    if (!process.env.STRIPE_SECRET_KEY) throw new apiError(500, 'Stripe not configured');

    const session = await stripe.checkout.sessions.create({
        mode: 'subscription',
        line_items: [{ price: priceId, quantity: 1 }],
        success_url: `${process.env.FRONTEND_URL}/billing/success`,
        cancel_url: `${process.env.FRONTEND_URL}/billing/cancel`,
        customer_email: req.user.email,
        metadata: { userId: req.user._id.toString(), plan },
    });

    return res.status(200).json(new apiResponse(200, { url: session.url }, 'Checkout created'));
});

export const handleWebhook = asyncHandler(async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;
    try {
        event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET || '');
    } catch (err) {
        throw new apiError(400, `Webhook signature failed: ${err.message}`);
    }

    if (event.type === 'checkout.session.completed') {
        const session = event.data.object;
        const userId = session.metadata?.userId;
        const plan = session.metadata?.plan;
        if (userId && plan) {
            await User.findByIdAndUpdate(userId, {
                plan,
                stripeCustomerId: session.customer,
                stripeSubscriptionId: session.subscription,
            });
        }
    }

    res.json({ received: true });
});
