const mongoose = require('mongoose');

const categoriaCompeticionSchema = new mongoose.Schema({
    nombre_categoria: {
        type: String,
        required: true,
        unique: true,
    },
});

module.exports = mongoose.model('CategoriaCompeticion', categoriaCompeticionSchema);
