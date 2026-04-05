const mongoose = require('mongoose');

const ordenSchema = new mongoose.Schema({
    usuario: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false,
        default: null
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
        required: true,
        unique: true
    },
    stripePaymentIntentId: {
        type: String
    }
}, {
    timestamps: true
});

// Índice para consultar órdenes de un usuario
ordenSchema.index({ usuario: 1 });
// TTL: borrar órdenes canceladas 30 días después de su última actualización
ordenSchema.index({ updatedAt: 1 }, {
    expireAfterSeconds: 30 * 24 * 3600,
    partialFilterExpression: { estado: 'cancelada' }
});

module.exports = mongoose.model('Orden', ordenSchema);