const mongoose = require('mongoose');

const marcaSchema = new mongoose.Schema({
    nombre_atleta: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Atleta',
        required: true,
    },
    nombre_prueba: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Prueba',
        required: true,
    },
    horas: Number,
    minutos: Number,
    segundos: Number,
    metros: Number,
    puntos: Number,
    lugar: String,
    viento: Number,
    comentario: String,
    categoria: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Categoria',
        required: true,
    },
    anyo: { type: Number, required: true },
    PcAL: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'PcAL',
        required: true
    },
    fecha_realizacion: { type: String },
});

module.exports = mongoose.model('Marca', marcaSchema);
