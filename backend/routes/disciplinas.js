const express = require('express');
const router = express.Router();
const Disciplina = require('../models/Disciplina');
const auth = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

// GET / — todas las disciplinas
router.get('/', async (req, res) => {
    try {
        const disciplinas = await Disciplina.find().sort({ nombre: 1 });
        res.json(disciplinas);
    } catch (err) {
        res.status(500).json({ mensaje: 'Error al obtener disciplinas' });
    }
});

// GET /:id — una disciplina
router.get('/:id', async (req, res) => {
    try {
        const disciplina = await Disciplina.findById(req.params.id);
        if (!disciplina) return res.status(404).json({ mensaje: 'Disciplina no encontrada' });
        res.json(disciplina);
    } catch (err) {
        res.status(500).json({ mensaje: 'Error al obtener disciplina' });
    }
});

// POST / — crear disciplina (solo admin)
router.post('/', auth, [
    body('nombre').trim().notEmpty().withMessage('El nombre es obligatorio'),
    body('slug').trim().notEmpty().withMessage('El slug es obligatorio'),
], async (req, res) => {
    if (!req.user.userTypes.includes('Admin')) return res.status(403).json({ mensaje: 'Acceso denegado' });

    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errores: errors.array() });

    try {
        const { nombre, slug, color, icono } = req.body;
        const disciplina = new Disciplina({ nombre, slug, color, icono });
        await disciplina.save();
        res.status(201).json(disciplina);
    } catch (err) {
        if (err.code === 11000) {
            return res.status(400).json({ mensaje: 'Ya existe una disciplina con ese nombre o slug' });
        }
        res.status(500).json({ mensaje: 'Error al crear la disciplina' });
    }
});

// PUT /:id — editar disciplina (solo admin)
router.put('/:id', auth, [
    body('nombre').optional().trim().notEmpty(),
    body('slug').optional().trim().notEmpty(),
], async (req, res) => {
    if (!req.user.userTypes.includes('Admin')) return res.status(403).json({ mensaje: 'Acceso denegado' });

    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errores: errors.array() });

    try {
        const { nombre, slug, color, icono } = req.body;
        const disciplina = await Disciplina.findByIdAndUpdate(
            req.params.id,
            { nombre, slug, color, icono },
            { new: true, runValidators: true }
        );
        if (!disciplina) return res.status(404).json({ mensaje: 'Disciplina no encontrada' });
        res.json(disciplina);
    } catch (err) {
        if (err.code === 11000) {
            return res.status(400).json({ mensaje: 'Ya existe una disciplina con ese nombre o slug' });
        }
        res.status(500).json({ mensaje: 'Error al actualizar la disciplina' });
    }
});

// DELETE /:id — eliminar disciplina (solo admin)
router.delete('/:id', auth, async (req, res) => {
    if (!req.user.userTypes.includes('Admin')) return res.status(403).json({ mensaje: 'Acceso denegado' });
    try {
        const disciplina = await Disciplina.findByIdAndDelete(req.params.id);
        if (!disciplina) return res.status(404).json({ mensaje: 'Disciplina no encontrada' });
        res.json({ mensaje: 'Disciplina eliminada' });
    } catch (err) {
        res.status(500).json({ mensaje: 'Error al eliminar la disciplina' });
    }
});

module.exports = router;
