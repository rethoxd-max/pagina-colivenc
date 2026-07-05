const express = require('express');
const router = express.Router();
const HorarioEscuela = require('../models/HorarioEscuela');
const auth = require('../middleware/auth');

function puedeGestionar(req) {
    return req.user.userTypes.includes('Admin') || req.user.userTypes.includes('Editor');
}

// GET / — obtener todos los horarios (público, para el mini componente del Home)
router.get('/', async (req, res) => {
    try {
        const horarios = await HorarioEscuela.find().sort({ seccion: 1, orden: 1, createdAt: 1 });
        res.json(horarios);
    } catch (err) {
        res.status(500).json({ mensaje: 'Error al obtener los horarios' });
    }
});

// POST / — crear tarjeta de horario (Admin/Editor)
router.post('/', auth, async (req, res) => {
    if (!puedeGestionar(req)) return res.status(403).json({ mensaje: 'Acceso denegado' });
    try {
        const { seccion, categoria, horario, dias, orden } = req.body;
        if (!seccion || !categoria || !horario) {
            return res.status(400).json({ mensaje: 'Sección, categoría y horario son obligatorios' });
        }
        const nuevo = new HorarioEscuela({
            seccion: seccion.trim(),
            categoria: categoria.trim(),
            horario: horario.trim(),
            dias: Array.isArray(dias) ? dias : [],
            orden: orden || 0,
        });
        await nuevo.save();
        res.status(201).json(nuevo);
    } catch (err) {
        res.status(500).json({ mensaje: 'Error al crear el horario' });
    }
});

// PUT /:id — editar tarjeta de horario (Admin/Editor)
router.put('/:id', auth, async (req, res) => {
    if (!puedeGestionar(req)) return res.status(403).json({ mensaje: 'Acceso denegado' });
    try {
        const { seccion, categoria, horario, dias, orden } = req.body;
        if (!seccion || !categoria || !horario) {
            return res.status(400).json({ mensaje: 'Sección, categoría y horario son obligatorios' });
        }
        const actualizado = await HorarioEscuela.findByIdAndUpdate(
            req.params.id,
            { seccion: seccion.trim(), categoria: categoria.trim(), horario: horario.trim(), dias: Array.isArray(dias) ? dias : [], orden: orden || 0 },
            { new: true, runValidators: true }
        );
        if (!actualizado) return res.status(404).json({ mensaje: 'Horario no encontrado' });
        res.json(actualizado);
    } catch (err) {
        res.status(500).json({ mensaje: 'Error al actualizar el horario' });
    }
});

// DELETE /:id — eliminar tarjeta de horario (Admin/Editor)
router.delete('/:id', auth, async (req, res) => {
    if (!puedeGestionar(req)) return res.status(403).json({ mensaje: 'Acceso denegado' });
    try {
        const eliminado = await HorarioEscuela.findByIdAndDelete(req.params.id);
        if (!eliminado) return res.status(404).json({ mensaje: 'Horario no encontrado' });
        res.json({ mensaje: 'Horario eliminado' });
    } catch (err) {
        res.status(500).json({ mensaje: 'Error al eliminar el horario' });
    }
});

module.exports = router;
