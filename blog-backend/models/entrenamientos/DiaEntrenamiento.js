const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const diaEntrenamientoSchema = new Schema({
    fecha: Date,
    entrenamientos: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Entrenamiento'
        }
    ],
});


module.exports = mongoose.model('DiaEntrenamiento', diaEntrenamientoSchema);
