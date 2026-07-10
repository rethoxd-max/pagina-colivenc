const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const PostSchema = new Schema({
    title: {
        type: String,
        required: true
    },
    content: {
        type: String,
        required: true
    },
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    imageUrl: { type: String },
    category: { type: String, default: '' },
    disciplina: { type: mongoose.Schema.Types.ObjectId, ref: 'Disciplina', default: null },
    destacado: { type: Boolean, default: false },
    competicion: { type: mongoose.Schema.Types.ObjectId, ref: 'Competicion', default: null },
    date: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Post', PostSchema);
