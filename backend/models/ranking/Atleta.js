const mongoose = require('mongoose');

const atletaSchema = new mongoose.Schema({
    nombre: { type: String, required: true },
    fecha_nacimiento: { 
        type: Date, 
        required: true,
        validate: {
            validator: function(value) {
                // Validar que la fecha sea válida y no sea en el futuro
                return value instanceof Date && !isNaN(value.getTime()) && value <= new Date();
            },
            message: 'La fecha de nacimiento debe ser una fecha válida y no puede ser en el futuro'
        }
    },
    usuario: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Referencia al modelo de usuario
        required: false // No es requerido
    },
});

// Índice para asegurar que no haya duplicados de nombre y fecha de nacimiento
atletaSchema.index({ nombre: 1, fecha_nacimiento: 1 }, { unique: true });

module.exports = mongoose.model('Atleta', atletaSchema);
