const express = require('express');
const router = express.Router();
const DiaEntrenamiento = require('../../models/entrenamientos/DiaEntrenamiento');
const CalendarioEntrenamiento = require('../../models/entrenamientos/CalendarioEntrenamiento');
const mongoose = require('mongoose');
const auth = require('../../middleware/auth');

// Obtener todos los días de entrenamiento de un calendario específico
router.get('/calendario/:calendarioId', async (req, res) => {
    try {
        const dias = await DiaEntrenamiento.find({ 
            calendario_entrenamiento: req.params.calendarioId 
        }).populate('entrenamientos');
        res.json(dias);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Obtener un día de entrenamiento por ID
router.get('/:id', async (req, res) => {
    try {
        const dia = await DiaEntrenamiento.findById(req.params.id)
            .populate('entrenamientos')
            .populate('calendario_entrenamiento');
        if (!dia) return res.status(404).json({ message: 'Día no encontrado' });
        res.json(dia);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Obtener un día de entrenamiento por fecha y calendarioId (solo lectura, no crea)
router.get('/:calendarioId/:fecha', async (req, res) => {
    const { calendarioId, fecha } = req.params;
    try {
        const diaEntrenamiento = await DiaEntrenamiento.findOne({ 
            calendario_entrenamiento: calendarioId, 
            fecha: new Date(fecha) 
        }).populate('entrenamientos');

        if (!diaEntrenamiento) {
            return res.status(404).json({ message: 'Día no encontrado' });
        }

        res.json(diaEntrenamiento);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Crear un día de entrenamiento para una fecha concreta
router.post('/:calendarioId/:fecha', auth, async (req, res) => {
    const { calendarioId, fecha } = req.params;
    try {
        const calendario = await CalendarioEntrenamiento.findById(calendarioId);
        if (!calendario) {
            return res.status(404).json({ message: 'Calendario no encontrado' });
        }

        const existente = await DiaEntrenamiento.findOne({
            calendario_entrenamiento: calendarioId,
            fecha: new Date(fecha)
        });
        if (existente) return res.status(200).json(existente);

        const nuevoDia = new DiaEntrenamiento({ 
            calendario_entrenamiento: calendarioId, 
            fecha: new Date(fecha), 
            entrenamientos: [] 
        });
        await nuevoDia.save();

        await CalendarioEntrenamiento.findByIdAndUpdate(
            calendarioId,
            { $push: { diasEntrenamiento: nuevoDia._id } }
        );

        res.status(201).json(nuevoDia);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Añadir un entrenamiento a un día específico
router.post('/:diaId/entrenamientos', auth, async (req, res) => {
    const { diaId } = req.params;
    const entrenamientoData = { ...req.body, dia_entrenamiento: diaId };

    try {
        // Verificar que el día existe
        const diaEntrenamiento = await DiaEntrenamiento.findById(diaId);
        if (!diaEntrenamiento) {
            return res.status(404).json({ message: 'Día de entrenamiento no encontrado' });
        }

        // Crear el nuevo entrenamiento
        const Entrenamiento = mongoose.model('Entrenamiento');
        const entrenamiento = new Entrenamiento(entrenamientoData);
        const nuevoEntrenamiento = await entrenamiento.save();

        // Actualizar el día de entrenamiento
        const diaActualizado = await DiaEntrenamiento.findByIdAndUpdate(
            diaId,
            { $push: { entrenamientos: nuevoEntrenamiento._id } },
            { new: true }
        ).populate('entrenamientos');

        res.status(201).json(diaActualizado);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Actualizar un día de entrenamiento por ID
router.put('/:id', auth, async (req, res) => {
    try {
        const dia = await DiaEntrenamiento.findByIdAndUpdate(
            req.params.id, 
            req.body, 
            { new: true }
        ).populate('entrenamientos');
        
        if (!dia) return res.status(404).json({ message: 'Día no encontrado' });
        res.json(dia);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Eliminar un día de entrenamiento por ID
router.delete('/:id', auth, async (req, res) => {
    try {
        const dia = await DiaEntrenamiento.findById(req.params.id);
        if (!dia) return res.status(404).json({ message: 'Día no encontrado' });

        // Eliminar todos los entrenamientos asociados
        const Entrenamiento = mongoose.model('Entrenamiento');
        await Entrenamiento.deleteMany({ _id: { $in: dia.entrenamientos } });

        // Eliminar el día del calendario
        await CalendarioEntrenamiento.updateOne(
            { _id: dia.calendario_entrenamiento },
            { $pull: { diasEntrenamiento: dia._id } }
        );

        // Eliminar el día
        await DiaEntrenamiento.deleteOne({ _id: dia._id });
        
        res.json({ message: 'Día y sus entrenamientos eliminados' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
