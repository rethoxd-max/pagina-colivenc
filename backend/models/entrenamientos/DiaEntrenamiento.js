const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const diaEntrenamientoSchema = new Schema({
    fecha: {
        type: Date,
        required: true
    },
    calendario_entrenamiento: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'CalendarioEntrenamiento',
        required: true
    },
    entrenamientos: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Entrenamiento'
        }
    ],
});

module.exports = mongoose.model('DiaEntrenamiento', diaEntrenamientoSchema);
