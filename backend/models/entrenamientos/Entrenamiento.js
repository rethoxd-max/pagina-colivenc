const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const entrenamientoSchema = new Schema({
    dia_entrenamiento: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'DiaEntrenamiento',
        required: true,
    },
    tipo: {
        type: String,
        enum: ['Técnica', 'Pesas', 'Series', 'Velocidad', 'Vallas', 'Multisaltos', 'Multilanzamientos', 'Rodaje', 'Cuestas', 'Lastre', 'Extras', 'Test', 'Competición'],
        required: true
    },
    tecnica: [{
        tecnica: String
    }],

    pesas: [{
        series: String,
        repeticiones: String,
        porcentaje: String,
        comentario: String
    }],

    serie: [{
        numeroSeries: String,
        metros: String,
        recuperacion: String,
        tiempoObjetivo: String,
        comentario: String
    }],

    velocidad: [{
        numeroSeries: String,
        metros: String,
        recuperacion: String,
        porcentaje: String,
        comentario: String
    }],

    vallas: [{
        numeroSeries: String,
        numeroVallas: String,
        recuperacion: String,
        comentario: String
    }],

    multisaltos: [{
        numeroSaltos: String,
        tipo: {
            type: String,
            enum: ['Hierba', 'Foso', 'Vallas']
        },
        comentario: String
    }],

    multilanzamientos: [{
        numeroLanzamientos: String,
        tipo: {
            type: String,
            enum: ['Hierba', 'Step', 'Pared', 'Bola']
        },
        comentario: String
    }],

    rodaje: {
        tiempo: String,
        comentario: String
    },

    cuestas: [{
        numeroCuestas: String,
        metros: String,
        recuperacion: String,
        comentario: String
    }],

    lastre: [{
        numeroSeries: String,
        metros: String,
        kilos: String,
        recuperacion: String,
        comentario: String
    }],

    extras: [{
        comentario: String
    }],

    test: {
        comentario: String
    },

    competicion: {
        nombre: String,
        fecha: Date,
        lugar: String,
        competicionId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Competicion'
        }
    },

    resultados: [{
        atleta: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Atleta'
        },
        resultado: String,
        fecha: {
            type: Date,
            default: Date.now
        }
    }]
});

module.exports = mongoose.model('Entrenamiento', entrenamientoSchema);
