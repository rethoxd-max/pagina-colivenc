// @ts-nocheck
const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const Competicion = require('../../models/calendario/competicion');
const Inscripcion = require('../../models/calendario/Inscripcion');
const { registrarInscripcionEnSheets } = require('../../services/googleSheets');

// Rate limiter: máximo 5 inscripciones públicas por IP cada 15 minutos
const publicInscripcionLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: { mensaje: 'Demasiadas solicitudes. Inténtalo de nuevo en 15 minutos.' },
    standardHeaders: true,
    legacyHeaders: false
});

// GET /inscripciones-publicas/:token
// Devuelve datos básicos de la competición para mostrar en el formulario público
router.get('/:token', async (req, res) => {
    try {
        const competicion = await Competicion.findOne({ tokenPublico: req.params.token })
            .select('nombre fecha lugar descripcion tipo imageUrl tokenPublico');
        if (!competicion) {
            return res.status(404).json({ mensaje: 'Competición no encontrada o enlace inválido' });
        }
        return res.json(competicion);
    } catch (error) {
        return res.status(500).json({ mensaje: 'Error en el servidor', error: String(error) });
    }
});

// POST /inscripciones-publicas/:token
// Registra un atleta sin necesidad de autenticación
router.post('/:token', publicInscripcionLimiter, async (req, res) => {
    try {
        const { nombre_atleta } = req.body;

        if (!nombre_atleta || !nombre_atleta.trim()) {
            return res.status(400).json({ mensaje: 'El nombre del atleta es obligatorio' });
        }

        const competicion = await Competicion.findOne({ tokenPublico: req.params.token });
        if (!competicion) {
            return res.status(404).json({ mensaje: 'Competición no encontrada o enlace inválido' });
        }

        // Guardar inscripción sin usuario (inscripción pública)
        const nuevaInscripcion = new Inscripcion({
            nombre_atleta: nombre_atleta.trim(),
            competicion: competicion._id,
            pruebasSeleccionadas: [],
            fechaInscripcion: new Date(),
            usuario: null
        });

        await nuevaInscripcion.save();

        // Registrar en Google Sheets
        try {
            await registrarInscripcionEnSheets({
                nombreAtleta: nombre_atleta.trim(),
                competicionNombre: competicion.nombre,
                fechaCompeticion: competicion.fecha,
                pruebas: [],
                usuarioNombre: 'Inscripción pública',
                fechaNacimiento: null,
                numeroLicencia: '',
                fechaInscripcion: nuevaInscripcion.fechaInscripcion
            });
        } catch (sheetsError) {
            console.error('Error al guardar en Google Sheets (no bloquea):', String(sheetsError));
        }

        return res.status(201).json({ mensaje: '¡Inscripción realizada con éxito!' });
    } catch (error) {
        console.error('Error en inscripción pública:', error);
        return res.status(500).json({ mensaje: 'Error al procesar la inscripción', error: String(error) });
    }
});

module.exports = router;
