const mongoose = require('mongoose');

const InvitacionCodigoSchema = new mongoose.Schema({
    codigo: {
        type: String,
        required: true,
        unique: true
    },
    usado: {
        type: Boolean,
        default: false
    },
    creadoPor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    usadoPor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    creadoEn: {
        type: Date,
        default: Date.now
    },
    usadoEn: {
        type: Date,
        default: null
    }
});

module.exports = mongoose.model('InvitacionCodigo', InvitacionCodigoSchema);
