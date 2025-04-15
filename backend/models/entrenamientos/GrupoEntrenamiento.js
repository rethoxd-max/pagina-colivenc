const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const grupoEntrenamientoSchema = new Schema({
    nombre_grupo: {
        type: String,
        required: true
    },
    entrenador: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    atletas: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }
    ]
});


module.exports = mongoose.model('GrupoEntrenamiento', grupoEntrenamientoSchema);
