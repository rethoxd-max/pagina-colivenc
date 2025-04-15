const mongoose = require('mongoose');

const atletaSchema = new mongoose.Schema({
    nombre: {
        type: String,
        required: true,
    },
    fecha_nacimiento: {
        type: Date,
    }
});

module.exports = mongoose.model('Atleta', atletaSchema);
