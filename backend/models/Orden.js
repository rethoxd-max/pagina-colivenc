const mongoose = require('mongoose');

const ordenSchema = new mongoose.Schema({
    usuario: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    productos: [{
        producto: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Producto',
            required: true
        },
        talla: {
            type: String,
            required: true
        },
        cantidad: {
            type: Number,
            required: true,
            min: 1
        },
        precio: {
            type: Number,
            required: true
        }
    }],
    total: {
        type: Number,
        required: true
    },
    estado: {
        type: String,
        enum: ['pendiente', 'completada', 'cancelada'],
        default: 'pendiente'
    },
    stripeSessionId: {
        type: String,
        required: true
    },
    stripePaymentIntentId: {
        type: String
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Orden', ordenSchema); 