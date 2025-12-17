const stripeKey = process.env.STRIPE_SECRET_KEY;

// En desarrollo, permitir funcionar sin Stripe
if (!stripeKey) {
    console.warn('⚠️  STRIPE_SECRET_KEY no configurada - funciones de pago deshabilitadas');
    module.exports = null;
} else {
    const stripe = require('stripe')(stripeKey, {
        apiVersion: '2023-10-16',
        typescript: true
    });
    module.exports = stripe;
} 