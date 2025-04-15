// models/competicion.js
const mongoose = require('mongoose');

// Esquema para la colección de 'competicion'
const competicionSchema = new mongoose.Schema({
    nombre: { type: String, required: true },
    fecha: { type: Date, required: true },
    lugar: { type: String, required: true },
    descripcion: { type: String },
    tipo: { type: String },
    imageUrl: { type: String },
    pruebas: [{ type: mongoose.Schema.Types.ObjectId, ref: 'PruebaCompeticion' }], // Referencia a las pruebas
    sectores: [{ type: mongoose.Schema.Types.ObjectId, ref: 'SectorCompeticion' }],  // Referencia a los sectores
    categorias: [{ type: mongoose.Schema.Types.ObjectId, red: 'CategoriasCompeticion'}],
});

module.exports = mongoose.model('Competicion', competicionSchema);
