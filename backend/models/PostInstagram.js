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
}, { timestamps: true });

module.exports = mongoose.model('PostInstagram', PostInstagramSchema);
