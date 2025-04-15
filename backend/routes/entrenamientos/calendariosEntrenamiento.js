const express = require('express');
const router = express.Router();
const CalendarioEntrenamiento = require('../../models/entrenamientos/CalendarioEntrenamiento');
const mongoose = require('mongoose');
const Atleta = require('../../models/ranking/Atleta');
const GrupoEntrenamiento = require('../../models/entrenamientos/GrupoEntrenamiento');


// Obtener todos los calendarios de entrenamiento
router.get('/', async (req, res) => {
    try {
        const calendarios = await CalendarioEntrenamiento.find().populate('grupo_entrenamiento diasEntrenamiento');
        res.json(calendarios);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Endpoint para obtener el grupo y calendario de un atleta
router.get('/:atletaId', async (req, res) => {
    const { atletaId } = req.params;

    try {
        // 1. Busca el atleta para confirmar si tiene usuario asignado
        const atleta = await Atleta.findById(atletaId).populate('usuario');
        if (!atleta) return res.status(404).json({ message: 'Atleta no encontrado' });

        // 2. Encuentra el grupo de entrenamiento al que pertenece el atleta
        const grupo = await GrupoEntrenamiento.findOne({ atletas: atleta._id });
        if (!grupo) return res.status(404).json({ message: 'Grupo de entrenamiento no encontrado' });

        // 3. Busca el calendario de entrenamiento asociado al grupo
        const calendario = await CalendarioEntrenamiento.findOne({ grupo_entrenamiento: grupo._id })
            .populate('diasEntrenamiento') || { diasEntrenamiento: [] }; // Si no existe, devuelve un array vacío

        // 4. Devolver siempre un objeto calendario con diasEntrenamiento, aunque esté vacío
        res.status(200).json({ grupo, calendario });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});


// Obtener un calendario de entrenamiento por ID
router.get('/:id', async (req, res) => {
    try {
        const calendario = await CalendarioEntrenamiento.findById(req.params.id).populate('grupo_entrenamiento diasEntrenamiento');
        if (!calendario) return res.status(404).json({ message: 'Calendario no encontrado' });
        res.json(calendario);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Crear un nuevo calendario de entrenamiento
router.post('/', async (req, res) => {
    const calendario = new CalendarioEntrenamiento(req.body);
    try {
        const nuevoCalendario = await calendario.save();
        res.status(201).json(nuevoCalendario);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Actualizar un calendario de entrenamiento por ID
router.put('/:id', async (req, res) => {
    try {
        const calendario = await CalendarioEntrenamiento.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!calendario) return res.status(404).json({ message: 'Calendario no encontrado' });
        res.json(calendario);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Eliminar un calendario de entrenamiento por ID
router.delete('/:id', async (req, res) => {
    try {
        const calendario = await CalendarioEntrenamiento.findByIdAndDelete(req.params.id);
        if (!calendario) return res.status(404).json({ message: 'Calendario no encontrado' });
        res.json({ message: 'Calendario eliminado' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;