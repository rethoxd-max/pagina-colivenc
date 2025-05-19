const mongoose = require('mongoose');

const productoSchema = new mongoose.Schema({
    nombre: {
        type: String,
        required: true,
        trim: true
    },
    descripcion: {
        type: String,
        required: true
    },
    precio: {
        type: Number,
        required: true,
        min: 0
    },
    imagen: {
        type: String,
        required: true
    },
    tallas: [{
        type: String,
        required: true
    }],
    stock: {
        type: Number,
        required: true,
        min: 0
    },
    categoria: {
        type: String,
        required: true
    },
    stripeProductId: {
        type: String,
        required: true
    },
    stripePriceId: {
        type: String,
        required: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Producto', productoSchema); 