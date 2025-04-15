const mongoose = require('mongoose');

const pruebaCompeticionSchema = new mongoose.Schema({
    nombre_prueba: {
        type: String,
        required: true,
    },
    sector_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'SectorCompeticion',
        required: true,
    },
    categoria_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'CategoriaCompeticion',
        required: true,
    },
});

module.exports = mongoose.model('PruebaCompeticion', pruebaCompeticionSchema);
