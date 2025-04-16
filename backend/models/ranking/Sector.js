const mongoose = require('mongoose');

const sectorSchema = new mongoose.Schema({
    nombre_sector: {
        type: String,
        required: true,
        unique: true
    }
});

module.exports = mongoose.model('Sector', sectorSchema);
