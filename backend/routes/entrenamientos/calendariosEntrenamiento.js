const express = require('express');
const router = express.Router();
const CalendarioEntrenamiento = require('../../models/entrenamientos/CalendarioEntrenamiento');
const DiaEntrenamiento = require('../../models/entrenamientos/DiaEntrenamiento');
const mongoose = require('mongoose');
const Atleta = require('../../models/ranking/Atleta');
const GrupoEntrenamiento = require('../../models/entrenamientos/GrupoEntrenamiento');
const User = require('../../models/User');
const auth = require('../../middleware/auth');

// Obtener todos los calendarios de entrenamiento
router.get('/', async (req, res) => {
    try {
        const calendarios = await CalendarioEntrenamiento.find()
            .populate('grupo_entrenamiento')
            .populate({
                path: 'diasEntrenamiento',
                populate: {
                    path: 'entrenamientos'
                }
            });
        res.json(calendarios);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Endpoint para obtener el calendario de un grupo de entrenamiento
router.get('/:grupoId', async (req, res) => {
    const { grupoId } = req.params;

    try {
        // 1. Verificar que el grupo existe
        const grupo = await GrupoEntrenamiento.findById(grupoId);
        if (!grupo) {
            return res.status(404).json({ message: 'Grupo de entrenamiento no encontrado' });
        }

        // 2. Buscar el calendario asociado al grupo
        let calendario = await CalendarioEntrenamiento.findOne({ grupo_entrenamiento: grupoId })
            .populate({
                path: 'diasEntrenamiento',
                populate: {
                    path: 'entrenamientos'
                }
            });

        // 3. Si no existe el calendario, crear uno nuevo
        if (!calendario) {
            calendario = await CalendarioEntrenamiento.create({
                nombre_calendario: `Calendario de ${grupo.nombre_grupo}`,
                grupo_entrenamiento: grupoId,
                diasEntrenamiento: []
            });
        }

        // 4. Devolver el grupo y el calendario
        res.status(200).json({ grupo, calendario });
    } catch (error) {
        console.error('Error en calendariosEntrenamiento:', error);
        res.status(500).json({ message: error.message });
    }
});

// Obtener un calendario de entrenamiento por ID
router.get('/calendario/:id', async (req, res) => {
    try {
        const calendario = await CalendarioEntrenamiento.findById(req.params.id)
            .populate('grupo_entrenamiento')
            .populate({
                path: 'diasEntrenamiento',
                populate: {
                    path: 'entrenamientos'
                }
            });
        if (!calendario) {
            return res.status(404).json({ message: 'Calendario no encontrado' });
        }
        res.json(calendario);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Crear un nuevo calendario de entrenamiento
router.post('/', auth, async (req, res) => {
    try {
        const calendario = new CalendarioEntrenamiento(req.body);
        const nuevoCalendario = await calendario.save();
        res.status(201).json(nuevoCalendario);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Actualizar un calendario de entrenamiento por ID
router.put('/:id', auth, async (req, res) => {
    try {
        const calendario = await CalendarioEntrenamiento.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        ).populate('grupo_entrenamiento diasEntrenamiento');
        
        if (!calendario) {
            return res.status(404).json({ message: 'Calendario no encontrado' });
        }
        res.json(calendario);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Eliminar un calendario de entrenamiento por ID
router.delete('/:id', auth, async (req, res) => {
    try {
        const calendario = await CalendarioEntrenamiento.findById(req.params.id);
        if (!calendario) {
            return res.status(404).json({ message: 'Calendario no encontrado' });
        }

        // Obtener todos los días para extraer los IDs de sus entrenamientos
        const dias = await DiaEntrenamiento.find({ _id: { $in: calendario.diasEntrenamiento } });
        const entrenamientoIds = dias.flatMap(d => d.entrenamientos);

        // Eliminar todos los entrenamientos
        if (entrenamientoIds.length > 0) {
            const Entrenamiento = mongoose.model('Entrenamiento');
            await Entrenamiento.deleteMany({ _id: { $in: entrenamientoIds } });
        }

        // Eliminar todos los días de entrenamiento asociados
        await DiaEntrenamiento.deleteMany({ 
            _id: { $in: calendario.diasEntrenamiento } 
        });

        // Eliminar el calendario
        await CalendarioEntrenamiento.deleteOne({ _id: calendario._id });
        
        res.json({ message: 'Calendario, días y entrenamientos eliminados' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;