const express = require('express');
const router = express.Router();
const DiaEntrenamiento = require('../../models/entrenamientos/DiaEntrenamiento');
const mongoose = require('mongoose');

// Obtener todos los días de entrenamiento
router.get('/', async (req, res) => {
    try {
        const dias = await DiaEntrenamiento.find().populate('entrenamientos');
        res.json(dias);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Obtener un día de entrenamiento por ID
router.get('/:id', async (req, res) => {
    try {
        const dia = await DiaEntrenamiento.findById(req.params.id).populate('entrenamientos');
        if (!dia) return res.status(404).json({ message: 'Día no encontrado' });
        res.json(dia);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Obtener o crear un día de entrenamiento por fecha y atletaId
router.get('/:atletaId/:fecha', async (req, res) => {
    const { atletaId, fecha } = req.params;
    try {
        const diaEntrenamiento = await DiaEntrenamiento.findOne({ atletaId, fecha: new Date(fecha) });
        if (diaEntrenamiento) {
            // Si existe, devolver el día de entrenamiento
            res.json(diaEntrenamiento);
        } else {
            // Si no existe, crear un nuevo día de entrenamiento
            const nuevoDia = new DiaEntrenamiento({ atletaId, fecha: new Date(fecha), entrenamientos: [] });
            await nuevoDia.save();
            res.status(201).json(nuevoDia);
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.post('/:diaEntrenamientoId/entrenamientos', async (req, res) => {
    const { diaEntrenamientoId } = req.params;
    const entrenamientoData = { ...req.body, dia_entrenamiento: diaEntrenamientoId }; // Agregar el día de entrenamiento

    try {
        // Crear el nuevo entrenamiento
        const Entrenamiento = mongoose.model('Entrenamiento'); // Asegúrate de que el modelo está registrado
        const entrenamiento = new Entrenamiento(entrenamientoData);
        const nuevoEntrenamiento = await entrenamiento.save();

        // Agregar el ID del entrenamiento al día de entrenamiento
        const diaEntrenamiento = await DiaEntrenamiento.findByIdAndUpdate(
            diaEntrenamientoId,
            { $push: { entrenamientos: nuevoEntrenamiento._id } },
            { new: true }
        ).populate('entrenamientos');

        if (!diaEntrenamiento) {
            return res.status(404).json({ message: 'Día de entrenamiento no encontrado' });
        }

        res.status(201).json(diaEntrenamiento);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});


// Crear un nuevo día de entrenamiento
router.post('/', async (req, res) => {
    const dia = new DiaEntrenamiento(req.body);
    try {
        const nuevoDia = await dia.save();
        res.status(201).json(nuevoDia);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Actualizar un día de entrenamiento por ID
router.put('/:id', async (req, res) => {
    try {
        const dia = await DiaEntrenamiento.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!dia) return res.status(404).json({ message: 'Día no encontrado' });
        res.json(dia);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Eliminar un día de entrenamiento por ID
router.delete('/:id', async (req, res) => {
    try {
        const dia = await DiaEntrenamiento.findByIdAndDelete(req.params.id);
        if (!dia) return res.status(404).json({ message: 'Día no encontrado' });
        res.json({ message: 'Día eliminado' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
