const mongoose = require('mongoose');

const HorarioEscuelaSchema = new mongoose.Schema({
    seccion: { type: String, required: true, trim: true },
    categoria: { type: String, required: true, trim: true },
    horario: { type: String, required: true, trim: true },
    dias: [{ type: String, trim: true }],
    orden: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('HorarioEscuela', HorarioEscuelaSchema);
