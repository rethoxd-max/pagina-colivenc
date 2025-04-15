const mongoose = require('mongoose');

const PcALSchema = new mongoose.Schema({
    PcAL: {
        type: String,
        required: true,
    }
});

module.exports = mongoose.model('PcAL', PcALSchema);