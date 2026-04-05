const mongoose = require('mongoose');

const marcaSchema = new mongoose.Schema({
    nombre_atleta: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Atleta',
        required: true,
    },
    nombre_prueba: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Prueba',
        required: true,
    },
    horas: Number,
    minutos: Number,
    segundos: Number,
    metros: Number,
    puntos: Number,
    lugar: String,
    viento: Number,
    comentario: String,
    categoria: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Categoria',
        required: false, // Se calcula automáticamente si no se proporciona
    },
    anyo: { 
        type: Number, 
        required: true,
        validate: {
            validator: function(v) {
                return v !== undefined && v !== null && !isNaN(v);
            },
            message: function(props) {
                return `${props.value} no es un año válido`;
            }
        }
    },
    PcAL: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'PcAL',
        required: true
    },
    fecha_realizacion: { type: String },
});

// Índice para las queries del ranking principal (prueba + año + categoría)
marcaSchema.index({ nombre_prueba: 1, anyo: 1, categoria: 1 });
// Índice para el perfil del atleta
marcaSchema.index({ nombre_atleta: 1, anyo: 1 });
// Índice para filtros PC/AL
marcaSchema.index({ PcAL: 1 });

module.exports = mongoose.model('Marca', marcaSchema);
