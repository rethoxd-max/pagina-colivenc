const mongoose = require('mongoose');

const categoriaSchema = new mongoose.Schema({
    nombre_categoria: {
        type: String,
        required: true,
        unique: true,
    },
    // Tipo de categoría: 'formacion' (Sub10-Absoluto) o 'master' (M35, M40, etc.)
    tipo: {
        type: String,
        enum: ['formacion', 'master'],
        required: true,
        default: 'formacion'
    },
    // Para categorías de formación: años de nacimiento relativos a la temporada
    // Ejemplo: Sub18 en temporada 2025 = nacidos 2007-2008
    // anyo_nacimiento_min/max se calculan dinámicamente según la temporada
    edad_min: {
        type: Number,
        required: false // Solo para categorías master
    },
    edad_max: {
        type: Number,
        required: false // Solo para categorías master
    },
    // Para categorías de formación: offset respecto al año de temporada
    // Sub18: offset_min = 17, offset_max = 18 (año_temporada - 17 y año_temporada - 18)
    offset_edad_min: {
        type: Number,
        required: false
    },
    offset_edad_max: {
        type: Number,
        required: false
    },
    // Orden para mostrar en selectores
    orden: {
        type: Number,
        default: 0
    }
});

module.exports = mongoose.model('Categoria', categoriaSchema);
