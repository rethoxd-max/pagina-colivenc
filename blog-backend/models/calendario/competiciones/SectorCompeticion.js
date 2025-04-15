const mongoose = require('mongoose');

const sectorCompeticionSchema = new mongoose.Schema({
    nombre_sector: {
        type: String,
        required: true,
    }
});

module.exports = mongoose.model('SectorCompeticion', sectorCompeticionSchema);
