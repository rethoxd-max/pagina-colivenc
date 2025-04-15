const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserSchema = new Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  userTypes: {
    type: [String], // Array de strings para los tipos de usuario
    enum: ['Admin', 'Entrenador', 'Atleta', 'Viewer', 'Editor'], // Opciones válidas para los tipos de usuario
    default: ['Viewer'] // Valor por defecto
  }
});

module.exports = mongoose.model('User', UserSchema);
