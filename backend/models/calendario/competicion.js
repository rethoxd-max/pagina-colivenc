const crypto = require('crypto');
const mongoose = require('mongoose');

// Esquema para la colección de 'competicion'
const competicionSchema = new mongoose.Schema({
    nombre: { type: String, required: true },
    fecha: { type: Date, required: true },
    lugar: { type: String, required: true },
    descripcion: { type: String },
    tipo: { type: String },
    imageUrl: { type: String },
    pruebas: [{ type: mongoose.Schema.Types.ObjectId, ref: 'PruebaCompeticion' }],
    sectores: [{ type: mongoose.Schema.Types.ObjectId, ref: 'SectorCompeticion' }],
    categorias: [{ type: mongoose.Schema.Types.ObjectId, ref: 'CategoriaCompeticion'}],
    tokenPublico: { type: String, unique: true, default: () => crypto.randomBytes(8).toString('hex') },
    enlaces: [{
        nombre: { type: String, required: true },
        url: { type: String, required: true },
        origen: { type: String, enum: ['url', 'archivo'], default: 'url' }
    }],
    disciplina: { type: mongoose.Schema.Types.ObjectId, ref: 'Disciplina', default: null },
});

module.exports = mongoose.model('Competicion', competicionSchema);
