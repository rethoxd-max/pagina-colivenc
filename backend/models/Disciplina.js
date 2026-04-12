const mongoose = require('mongoose');

const disciplinaSchema = new mongoose.Schema({
    nombre: { type: String, required: true, unique: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    color: { type: String, default: '#005cbf' },
    icono: { type: String, default: 'fa-running' },
}, { timestamps: true });

module.exports = mongoose.model('Disciplina', disciplinaSchema);
