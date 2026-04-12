const mongoose = require('mongoose');

const PostInstagramSchema = new mongoose.Schema({
    url: {
        type: String,
        required: true,
        unique: true,
        trim: true,
    },
    imagenUrl: { type: String, default: '' },
    descripcion: { type: String, default: '' },
    likes: { type: Number, default: 0 },
    comentarios: { type: Number, default: 0 },
    orden: {
        type: Number,
        default: 0,
    },
}, { timestamps: true });

module.exports = mongoose.model('PostInstagram', PostInstagramSchema);
