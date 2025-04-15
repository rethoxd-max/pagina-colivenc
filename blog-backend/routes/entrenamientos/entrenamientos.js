const express = require('express');
const router = express.Router();
const Entrenamiento = require('../../models/entrenamientos/Entrenamiento');
const mongoose = require('mongoose');

// Obtener todos los entrenamientos
router.get('/', async (req, res) => {
    try {
        const entrenamientos = await Entrenamiento.find().populate('dia_entrenamiento');
        res.json(entrenamientos);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Obtener un entrenamiento por ID
router.get('/:id', async (req, res) => {
    try {
        const entrenamiento = await Entrenamiento.findById(req.params.id).populate('dia_entrenamiento');
        if (!entrenamiento) return res.status(404).json({ message: 'Entrenamiento no encontrado' });
        res.json(entrenamiento);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Crear un nuevo entrenamiento
router.post('/:diaEntrenamientoId', async (req, res) => {
    const entrenamiento = new Entrenamiento(req.body);
    try {
        const nuevoEntrenamiento = await entrenamiento.save();
        res.status(201).json(nuevoEntrenamiento);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});


// Actualizar un entrenamiento por ID
router.put('/:id', async (req, res) => {
    try {
        const entrenamiento = await Entrenamiento.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!entrenamiento) return res.status(404).json({ message: 'Entrenamiento no encontrado' });
        res.json(entrenamiento);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Eliminar un entrenamiento por ID
router.delete('/:id', async (req, res) => {
    try {
        const entrenamiento = await Entrenamiento.findByIdAndDelete(req.params.id);
        if (!entrenamiento) return res.status(404).json({ message: 'Entrenamiento no encontrado' });
        res.json({ message: 'Entrenamiento eliminado' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
