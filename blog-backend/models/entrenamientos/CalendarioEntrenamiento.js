const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const calendarioEntrenamientoSchema = new Schema({
    nombre_calendario: String,
    grupo_entrenamiento: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'GrupoEntrenamiento',
    },
    diasEntrenamiento: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'DiaEntrenamiento'
        }
    ],

});


module.exports = mongoose.model('CalendarioEntrenamiento', calendarioEntrenamientoSchema);
