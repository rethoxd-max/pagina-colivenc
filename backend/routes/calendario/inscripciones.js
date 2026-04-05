const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');

// Modelo de inscripción
const Inscripcion = require('../../models/calendario/Inscripcion');
const Competicion = require('../../models/calendario/competicion');
const User = require('../../models/User');
const { registrarInscripcionEnSheets, eliminarInscripcionEnSheets, editarInscripcionEnSheets } = require('../../services/googleSheets');

// Ruta para crear una inscripción
router.post('/', auth, async (req, res) => {
    try {
        const { nombre_atleta, competicionId, pruebas } = req.body;
        const usuario = req.user;  // Obtener el usuario autenticado desde el token

        // Validar datos
        if (!nombre_atleta || !competicionId || !Array.isArray(pruebas)) {
            throw new Error('Datos inválidos');
        }

        // Verificar que el usuario esté activo
        const usuarioActivo = await User.findById(usuario.id).select('activo');
        if (!usuarioActivo || !usuarioActivo.activo) {
            return res.status(403).json({ message: 'Tu cuenta no está activa. Contacta con el administrador.' });
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

        // Registrar en Google Sheets
        try {
            const competicion = await Competicion.findById(competicionId);
            const usuarioData = await User.findById(usuario.id);
            const inscripcionPopulada = await Inscripcion.findById(nuevaInscripcion._id)
                .populate({
                    path: 'pruebasSeleccionadas',
                    select: 'nombre_prueba'
                });

            await registrarInscripcionEnSheets({
                inscripcionId: nuevaInscripcion._id.toString(),
                nombreAtleta: nombre_atleta,
                competicionNombre: competicion ? competicion.nombre : 'Sin nombre',
                fechaCompeticion: competicion ? competicion.fecha : null,
                pruebas: inscripcionPopulada.pruebasSeleccionadas.map(p => p.nombre_prueba),
                usuarioNombre: usuarioData ? usuarioData.name : 'N/A',
                fechaNacimiento: usuarioData ? usuarioData.fechaNacimiento : null,
                numeroLicencia: usuarioData ? usuarioData.numeroLicencia : '',
                fechaInscripcion: nuevaInscripcion.fechaInscripcion
            });
        } catch (sheetsError) {
            console.error('Error al guardar en Google Sheets (no bloquea):', sheetsError.message);
        }

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

        // Actualizar en Google Sheets
        try {
            const competicion = await Competicion.findById(competicionId);
            const usuarioData = inscripcion.usuario ? await User.findById(inscripcion.usuario) : null;
            const inscripcionPopulada = await Inscripcion.findById(inscripcionId)
                .populate({ path: 'pruebasSeleccionadas', select: 'nombre_prueba' });

            await editarInscripcionEnSheets({
                inscripcionId: inscripcionId,
                nombreAtleta: nombre_atleta,
                competicionNombre: competicion ? competicion.nombre : '',
                fechaCompeticion: competicion ? competicion.fecha : null,
                pruebas: inscripcionPopulada.pruebasSeleccionadas.map(p => p.nombre_prueba),
                usuarioNombre: usuarioData ? usuarioData.name : 'N/A',
                fechaNacimiento: usuarioData ? usuarioData.fechaNacimiento : null,
                numeroLicencia: usuarioData ? usuarioData.numeroLicencia : '',
                fechaInscripcion: inscripcion.fechaInscripcion
            });
        } catch (sheetsError) {
            console.error('Error al actualizar en Google Sheets (no bloquea):', sheetsError.message);
        }

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
router.delete('/:id', auth, async (req, res) => {
    try {
        const inscripcionId = req.params.id;

        const inscripcion = await Inscripcion.findById(inscripcionId).populate('competicion');
        if (!inscripcion) {
            return res.status(404).json({ message: 'Inscripción no encontrada' });
        }

        // Solo el propietario o un Admin pueden eliminar
        const esAdmin = req.user.userTypes.includes('Admin');
        const esPropietario = inscripcion.usuario && inscripcion.usuario.toString() === req.user._id.toString();
        if (!esAdmin && !esPropietario) {
            return res.status(403).json({ message: 'No autorizado para eliminar esta inscripción' });
        }

        await Inscripcion.findByIdAndDelete(inscripcionId);

        // Eliminar de Google Sheets (no bloquea)
        try {
            await eliminarInscripcionEnSheets({
                inscripcionId: inscripcionId,
                competicionNombre: inscripcion.competicion?.nombre || '',
                fechaCompeticion: inscripcion.competicion?.fecha || null
            });
        } catch (sheetsError) {
            console.error('Error al eliminar de Google Sheets (no bloquea):', sheetsError.message);
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
        const usuarioActual = req.user.id;

        // Buscar inscripciones por entrenador, competición y usuario actual
        const inscripciones = await Inscripcion.find({ 
            competicion: competicionId,
            usuario: usuarioActual // Filtrar por el usuario actual
        })
            .populate({
                path: 'pruebasSeleccionadas',
                select: 'nombre_prueba categoria_id',
                populate: {
                    path: 'categoria_id',
                    select: 'nombre_categoria'
                }
            });

        // Devolver un array vacío en lugar de 404 si no hay inscripciones
        res.status(200).json(inscripciones || []);
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
