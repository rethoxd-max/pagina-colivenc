const mongoose = require('mongoose');

const pruebaSchema = new mongoose.Schema({
    nombre_prueba: {
        type: String,
        required: true,
    },
    sector_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Sector',
        required: true,
    }
});

module.exports = mongoose.model('Prueba', pruebaSchema);
