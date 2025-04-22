const express = require('express');
const router = express.Router();
const Entrenamiento = require('../../models/entrenamientos/Entrenamiento');
const DiaEntrenamiento = require('../../models/entrenamientos/DiaEntrenamiento');
const mongoose = require('mongoose');

// Obtener todos los entrenamientos de un día específico
router.get('/dia/:diaId', async (req, res) => {
    try {
        const entrenamientos = await Entrenamiento.find({ dia_entrenamiento: req.params.diaId });
        res.json(entrenamientos);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Obtener un entrenamiento por ID
router.get('/:id', async (req, res) => {
    try {
        const entrenamiento = await Entrenamiento.findById(req.params.id)
            .populate('dia_entrenamiento');
        if (!entrenamiento) {
            return res.status(404).json({ message: 'Entrenamiento no encontrado' });
        }
        res.json(entrenamiento);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Crear un nuevo entrenamiento
router.post('/:diaId', async (req, res) => {
    try {
        // Verificar que el día existe
        const dia = await DiaEntrenamiento.findById(req.params.diaId);
        if (!dia) {
            return res.status(404).json({ message: 'Día de entrenamiento no encontrado' });
        }

        // Crear el entrenamiento
        const entrenamiento = new Entrenamiento({
            ...req.body,
            dia_entrenamiento: req.params.diaId
        });
        const nuevoEntrenamiento = await entrenamiento.save();

        // Actualizar el día con el nuevo entrenamiento
        await DiaEntrenamiento.findByIdAndUpdate(
            req.params.diaId,
            { $push: { entrenamientos: nuevoEntrenamiento._id } }
        );

        res.status(201).json(nuevoEntrenamiento);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Actualizar un entrenamiento por ID
router.put('/:id', async (req, res) => {
    try {
        const entrenamiento = await Entrenamiento.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );
        if (!entrenamiento) {
            return res.status(404).json({ message: 'Entrenamiento no encontrado' });
        }
        res.json(entrenamiento);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Eliminar un entrenamiento por ID
router.delete('/:id', async (req, res) => {
    try {
        const entrenamiento = await Entrenamiento.findById(req.params.id);
        if (!entrenamiento) {
            return res.status(404).json({ message: 'Entrenamiento no encontrado' });
        }

        // Eliminar la referencia del entrenamiento en el día
        await DiaEntrenamiento.updateOne(
            { _id: entrenamiento.dia_entrenamiento },
            { $pull: { entrenamientos: entrenamiento._id } }
        );

        // Eliminar el entrenamiento
        await Entrenamiento.deleteOne({ _id: req.params.id });
        
        res.json({ message: 'Entrenamiento eliminado' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
