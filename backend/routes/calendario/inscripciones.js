const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');

// Modelo de inscripción
const Inscripcion = require('../../models/calendario/Inscripcion');

// Ruta para crear una inscripción
router.post('/', auth, async (req, res) => {
    try {
        const { nombre_atleta, competicionId, pruebas } = req.body;
        const usuario = req.user;  // Obtener el usuario autenticado desde el token

        // Validar datos
        if (!nombre_atleta || !competicionId || !Array.isArray(pruebas)) {
            throw new Error('Datos inválidos');
        }

        // Crear la nueva inscripción
        const nuevaInscripcion = new Inscripcion({
            nombre_atleta: nombre_atleta,
            competicion: competicionId,
            pruebasSeleccionadas: pruebas,
            fechaInscripcion: new Date(),
            usuario: usuario.id  // Guardar referencia al entrenador desde el token
        });

        // Guardar la inscripción
        await nuevaInscripcion.save();

        return res.status(201).json({ message: 'Inscripción creada con éxito' });
    } catch (error) {
        console.error('Error al crear inscripción:', error);
        return res.status(500).json({ message: 'Error al inscribirse', error: error.message });
    }
});

router.put('/:inscripcionId/:competicionId', auth, async (req, res) => {
    try {
        const { inscripcionId, competicionId } = req.params;
        const { atleta: nombre_atleta, pruebasSeleccionadas: pruebas } = req.body;  // No traemos `usuario` de los datos enviados

        // Validación básica
        if (!nombre_atleta || !competicionId || !Array.isArray(pruebas)) {
            return res.status(400).json({ message: 'Datos inválidos o incompletos' });
        }

        // Intentar encontrar la inscripción por su ID
        const inscripcion = await Inscripcion.findById(inscripcionId);
        if (!inscripcion) {
            return res.status(404).json({ message: 'Inscripción no encontrada' });
        }

        // Verificar que el competicionId coincida
        if (inscripcion.competicion.toString() !== competicionId) {
            return res.status(400).json({ message: 'El ID de la competición no coincide con la inscripción' });
        }

        // Actualizamos solo los campos proporcionados
        // Deja el campo `usuario` tal como estaba en la inscripción original
        inscripcion.nombre_atleta = nombre_atleta;
        inscripcion.competicion = competicionId;
        inscripcion.pruebasSeleccionadas = pruebas;

        // Guardamos los cambios en la inscripción existente
        await inscripcion.save();

        return res.status(200).json({
            message: 'Inscripción actualizada con éxito',
            inscripcion
        });
    } catch (error) {
        console.error('Error al actualizar la inscripción:', error);
        return res.status(500).json({ message: 'Error al actualizar la inscripción', error: error.message });
    }
});


// Ruta para eliminar una inscripción
router.delete('/:id', async (req, res) => {
    try {
        const inscripcionId = req.params.id;

        // Buscar la inscripción por ID y eliminarla
        const inscripcionEliminada = await Inscripcion.findByIdAndDelete(inscripcionId);

        if (!inscripcionEliminada) {
            return res.status(404).json({ message: 'Inscripción no encontrada' });
        }

        res.status(200).json({ message: 'Inscripción eliminada con éxito' });
    } catch (error) {
        res.status(500).json({ message: 'Error al eliminar la inscripción', error });
    }
});

// Ruta para obtener una inscripción por su ID
router.get('/inscripcion/:id', auth, async (req, res) => {
    try {
        const inscripcionId = req.params.id;

        // Buscar la inscripción por ID
        const inscripcion = await Inscripcion.findById(inscripcionId).populate('usuario competicion pruebasSeleccionadas');

        if (!inscripcion) {
            return res.status(404).json({ message: 'Inscripción no encontrada' });
        }

        // Retornar los detalles de la inscripción
        res.status(200).json(inscripcion);
    } catch (error) {
        console.error('Error al obtener la inscripción:', error);
        return res.status(500).json({ message: 'Error al obtener la inscripción', error: error.message });
    }
});


router.get('/entrenador/:entrenadorId/competicion/:competicionId', auth, async (req, res) => {
    try {
        const { entrenadorId, competicionId } = req.params;

        // Buscar inscripciones por entrenador y competición
        const inscripciones = await Inscripcion.find({ competicion: competicionId })
            .populate({
                path: 'pruebasSeleccionadas', // Rellenar las pruebas seleccionadas
                select: 'nombre_prueba categoria_id', // Incluir el nombre de la prueba y la categoría
                populate: {
                    path: 'categoria_id', // Hacer populate del campo categoria_id
                    select: 'nombre_categoria' // Incluir solo el nombre de la categoría
                }
            });
        if (!inscripciones || inscripciones.length === 0) {
            return res.status(404).json({ message: 'No se encontraron inscripciones para este entrenador en la competición especificada.' });
        }

        res.status(200).json(inscripciones);
    } catch (error) {
        console.error('Error al obtener inscripciones:', error);
        res.status(500).json({ message: 'Error al obtener inscripciones', error: error.message });
    }
});

router.get('/competicion/:competicionId', auth, async (req, res) => {
    try {
        const { competicionId } = req.params;

        // Buscar las inscripciones y hacer populate de las pruebasSeleccionadas
        const inscripciones = await Inscripcion.find({ competicion: competicionId })
            .populate({
                path: 'pruebasSeleccionadas', // Rellenar las pruebas seleccionadas
                select: 'nombre_prueba categoria_id', // Incluir el nombre de la prueba y la categoría
                populate: {
                    path: 'categoria_id', // Hacer populate del campo categoria_id
                    select: 'nombre_categoria' // Incluir solo el nombre de la categoría
                }
            });
        if (!inscripciones || inscripciones.length === 0) {
            return res.status(404).json({ message: 'No se encontraron inscripciones para esta competición.' });
        }

        res.status(200).json(inscripciones);
    } catch (error) {
        console.error('Error al obtener inscripciones de la competición:', error);
        res.status(500).json({ message: 'Error al obtener las inscripciones de la competición', error: error.message });
    }
});





module.exports = router;
