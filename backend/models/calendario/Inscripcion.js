const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Esquema de inscripción
const InscripcionSchema = new Schema({
    nombre_atleta: {
        type: String,
        required: true  // El nombre del atleta es obligatorio
    },
    competicion: {
        type: Schema.Types.ObjectId,
        ref: 'Competicion',  // Referencia al modelo Competición
        required: true
    },
    pruebasSeleccionadas: [{
        type: Schema.Types.ObjectId,
        ref: 'PruebaCompeticion',  // Referencia al modelo de pruebas de la competición
        required: true
    }],
    fechaInscripcion: {
        type: Date,
        default: Date.now  // Fecha y hora de la inscripción
    },
    usuario: {  // Campo de usuario
        type: Schema.Types.ObjectId,
        ref: 'User',  // Referencia al modelo Usuario
        required: false  // Si es necesario que el usuario esté presente o no
    }
});

// Índice para queries por competición y usuario
InscripcionSchema.index({ competicion: 1, usuario: 1 });

// Crear el modelo a partir del esquema
const Inscripcion = mongoose.model('Inscripcion', InscripcionSchema);

module.exports = Inscripcion;
