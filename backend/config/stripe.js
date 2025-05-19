const stripeKey = process.env.STRIPE_SECRET_KEY;

if (!stripeKey) {
    console.error('Error: STRIPE_SECRET_KEY no está configurada en las variables de entorno');
    process.exit(1);
}

const stripe = require('stripe')(stripeKey, {
    apiVersion: '2023-10-16',
    typescript: true
});

module.exports = stripe; 