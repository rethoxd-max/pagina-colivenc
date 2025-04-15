const mongoose = require('mongoose');

const atletaSchema = new mongoose.Schema({
    nombre: { type: String, required: true },
    fecha_nacimiento: { type: Number, required: true },
});

atletaSchema.index({ nombre: 1, fecha_nacimiento: 1 }, { unique: true });

module.exports = mongoose.model('Atleta', atletaSchema);
