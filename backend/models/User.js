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
    type: [String],
    enum: ['Admin', 'Entrenador', 'Atleta', 'Viewer', 'Editor'],
    default: ['Viewer']
  },
  telefono: {
    type: String,
    default: ''
  },
  fechaNacimiento: {
    type: Date,
    default: null
  },
  numeroLicencia: {
    type: String,
    default: ''
  },
  activo: {
    type: Boolean,
    default: true
  },
  stripeCustomerId: {
    type: String,
    default: null
  }
});

// Índice en name para búsquedas por nombre de atleta
UserSchema.index({ name: 1 });

module.exports = mongoose.model('User', UserSchema);
