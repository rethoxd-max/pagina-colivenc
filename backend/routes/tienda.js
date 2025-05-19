const express = require('express');
const router = express.Router();
const stripe = require('../config/stripe');
const Producto = require('../models/Producto');
const Orden = require('../models/Orden');
const auth = require('../middleware/auth');

// Verificar la clave de Stripe
const stripeKey = process.env['STRIPE_SECRET_KEY'];
if (!stripeKey) {
    console.error('Error: STRIPE_SECRET_KEY no está configurada en las variables de entorno');
    process.exit(1);
}

// Inicializar Stripe
const stripeInstance = require('stripe')(stripeKey, {
    apiVersion: '2023-10-16',
    typescript: true
});

// Obtener todos los productos
router.get('/productos', async (req, res) => {
    try {
        const productos = await Producto.find();
        res.json(productos);
    } catch (error) {
        console.error('Error al obtener productos:', error);
        res.status(500).json({ mensaje: 'Error al obtener los productos', error: error.message });
    }
});

// Crear una sesión de Stripe para el pago
router.post('/crear-sesion', auth, async (req, res) => {
    console.log('Body recibido:', req.body);
    const { productoId, talla } = req.body;
    console.log('Datos extraídos:', { productoId, talla });

    if (!productoId || !talla) {
        return res.status(400).json({ mensaje: "Faltan datos requeridos" });
    }

    try {
        console.log('Iniciando creación de sesión de pago');
        const producto = await Producto.findById(productoId);
        console.log('Producto encontrado:', !!producto);

        if (!producto) {
            return res.status(404).json({ mensaje: "Producto no encontrado" });
        }

        // Verificar que el usuario existe y tiene un ID válido
        if (!req.user || !req.user._id) {
            console.log('Usuario no autenticado o sin _id');
            return res.status(401).json({ mensaje: "Usuario no autenticado" });
        }

        const session = await stripeInstance.checkout.sessions.create({
            payment_method_types: ["card"],
            line_items: [
                {
                    price_data: {
                        currency: "eur",
                        product_data: {
                            name: producto.nombre,
                            images: [producto.imagen],
                        },
                        unit_amount: producto.precio * 100,
                    },
                    quantity: 1,
                },
            ],
            mode: "payment",
            success_url: `${process.env['FRONTEND_URL']}/tienda/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env['FRONTEND_URL']}/tienda/cancel`,
            metadata: {
                productoId: producto._id.toString(),
                talla: talla,
                usuarioId: req.user._id.toString()
            },
        });

        res.json({ sessionId: session.id });
    } catch (error) {
        console.error("Error al crear sesión:", error);
        res.status(500).json({ mensaje: "Error al procesar el pago" });
    }
});

// Webhook de Stripe para procesar pagos exitosos
router.post('/webhook', async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
        event = stripeInstance.webhooks.constructEvent(
            req.body,
            sig,
            process.env['STRIPE_WEBHOOK_SECRET']
        );
    } catch (err) {
        console.error('Error en webhook:', err);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    if (event.type === 'checkout.session.completed') {
        const session = event.data.object;
        
        try {
            // Actualizar la orden
            const orden = await Orden.findOne({ stripeSessionId: session.id });
            if (orden) {
                orden.estado = 'completada';
                orden.stripePaymentIntentId = session.payment_intent;
                await orden.save();

                // Actualizar el stock del producto
                const producto = await Producto.findById(orden.productos[0].producto);
                if (producto) {
                    producto.stock -= 1;
                    await producto.save();
                }
            }
        } catch (error) {
            console.error('Error al procesar el webhook:', error);
            return res.status(500).json({ error: 'Error al procesar el pago' });
        }
    }

    res.json({ received: true });
});

// Obtener las órdenes de un usuario
router.get('/mis-ordenes', auth, async (req, res) => {
    try {
        const ordenes = await Orden.find({ usuario: req.user._id })
            .populate('productos.producto')
            .sort({ createdAt: -1 });
        res.json(ordenes);
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al obtener las órdenes', error: error.message });
    }
});

module.exports = router; 