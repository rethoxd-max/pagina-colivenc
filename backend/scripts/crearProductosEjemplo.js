require('dotenv').config();
const mongoose = require('mongoose');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Producto = require('../models/Producto');

const productosEjemplo = [
    {
        nombre: "Camiseta Club Colivenc",
        descripcion: "Camiseta oficial del Club Colivenc con el logo del club en el pecho. Material transpirable y cómodo para entrenamientos.",
        precio: 25.00,
        imagen: "https://api.cecolivenc.es/uploads/camiseta-colivenc.jpg",
        tallas: ["S", "M", "L", "XL"],
        stock: 50,
        categoria: "Ropa"
    },
    {
        nombre: "Pantalón Corto Running",
        descripcion: "Pantalón corto técnico para running con bolsillos laterales. Ideal para entrenamientos y competiciones.",
        precio: 30.00,
        imagen: "https://api.cecolivenc.es/uploads/pantalon-running.jpg",
        tallas: ["S", "M", "L"],
        stock: 30,
        categoria: "Ropa"
    },
    {
        nombre: "Gorra Club Colivenc",
        descripcion: "Gorra con el logo del club bordado. Protección UV y ajuste regulable.",
        precio: 15.00,
        imagen: "https://api.cecolivenc.es/uploads/gorra-colivenc.jpg",
        tallas: ["Única"],
        stock: 40,
        categoria: "Accesorios"
    }
];

async function crearProductos() {
    try {
        // Conectar a MongoDB
        await mongoose.connect('mongodb://127.0.0.1:27017/colivenc');
        console.log('Conectado a MongoDB');

        // Crear productos en Stripe y guardarlos en la base de datos
        for (const producto of productosEjemplo) {
            // Crear producto en Stripe
            const stripeProduct = await stripe.products.create({
                name: producto.nombre,
                description: producto.descripcion,
                images: [producto.imagen]
            });

            // Crear precio en Stripe
            const stripePrice = await stripe.prices.create({
                product: stripeProduct.id,
                unit_amount: Math.round(producto.precio * 100), // Stripe usa céntimos
                currency: 'eur'
            });

            // Crear producto en la base de datos
            const nuevoProducto = new Producto({
                ...producto,
                stripeProductId: stripeProduct.id,
                stripePriceId: stripePrice.id
            });

            await nuevoProducto.save();
            console.log(`Producto creado: ${producto.nombre}`);
        }

        console.log('Todos los productos han sido creados exitosamente');
    } catch (error) {
        console.error('Error al crear los productos:', error);
    } finally {
        await mongoose.disconnect();
    }
}

crearProductos(); 