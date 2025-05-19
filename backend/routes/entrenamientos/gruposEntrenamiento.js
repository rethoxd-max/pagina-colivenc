const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const GrupoEntrenamiento = require('../../models/entrenamientos/GrupoEntrenamiento');
const Atleta = require('../../models/ranking/Atleta');
const Usuario = require('../../models/User');
const CalendarioEntrenamiento = require('../../models/entrenamientos/CalendarioEntrenamiento');


// Obtener todos los grupos de entrenamiento
router.get('/', async (req, res) => {
    try {
        const grupos = await GrupoEntrenamiento.find().populate('entrenador atletas');
        res.json(grupos);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Obtener todos los grupos de entrenamiento en los que participa el atleta especificado
router.get('/atleta/:atletaId', async (req, res) => {
    const { atletaId } = req.params;

    // Validar que atletaId sea un ObjectId válido
    if (!mongoose.Types.ObjectId.isValid(atletaId)) {
        return res.status(400).json({ message: 'ID de atleta no válido' });
    }

    try {
        const grupos = await GrupoEntrenamiento.find({ atletas: atletaId })
            .populate('entrenador atletas');

        // Devolver un array vacío en lugar de un 404
        res.json(grupos);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});



// Obtener un grupo de entrenamiento por ID
router.get('/:id', async (req, res) => {
    try {
        const grupo = await GrupoEntrenamiento.findById(req.params.id).populate('entrenador atletas');
        if (!grupo) return res.status(404).json({ message: 'Grupo no encontrado' });
        res.json(grupo);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Crear un nuevo grupo de entrenamiento
router.post('/', async (req, res) => {
    const { nombre_grupo, entrenador, atletas } = req.body; // Ahora debería coincidir con el frontend

    try {
        // 1. Crear el grupo de entrenamiento
        const nuevoGrupo = await GrupoEntrenamiento.create({
            nombre_grupo,  // Ya no es necesario hacer asignación manual
            entrenador: entrenador,
            atletas: atletas
        });

        // 2. Crear el calendario de entrenamiento enlazado al grupo
        const nuevoCalendario = await CalendarioEntrenamiento.create({
            nombre_calendario: `Calendario para ${nombre_grupo}`,
            grupo_entrenamiento: nuevoGrupo._id,
            diasEntrenamiento: []
        });

        res.status(201).json({ grupo: nuevoGrupo, calendario: nuevoCalendario });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});



// Actualizar un grupo de entrenamiento por ID
router.put('/:id', async (req, res) => {
    try {
        const grupo = await GrupoEntrenamiento.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!grupo) return res.status(404).json({ message: 'Grupo no encontrado' });
        res.json(grupo);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Eliminar un grupo de entrenamiento por ID
router.delete('/:id', async (req, res) => {
    try {
        const grupo = await GrupoEntrenamiento.findByIdAndDelete(req.params.id);
        if (!grupo) return res.status(404).json({ message: 'Grupo no encontrado' });
        res.json({ message: 'Grupo eliminado' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Agregar un atleta al grupo
router.post('/:id/atletas', async (req, res) => {
    try {
        const { atletaId } = req.body;
        const grupo = await GrupoEntrenamiento.findById(req.params.id);
        
        if (!grupo) {
            return res.status(404).json({ message: 'Grupo no encontrado' });
        }

        // Verificar si el atleta ya está en el grupo
        if (grupo.atletas.includes(atletaId)) {
            return res.status(400).json({ message: 'El atleta ya está en el grupo' });
        }

        // Agregar el atleta al grupo
        grupo.atletas.push(atletaId);
        await grupo.save();

        // Obtener el grupo actualizado con los datos del atleta
        const grupoActualizado = await GrupoEntrenamiento.findById(req.params.id)
            .populate('entrenador atletas');

        res.json(grupoActualizado);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Eliminar un atleta del grupo
router.delete('/:id/atletas/:atletaId', async (req, res) => {
    try {
        const grupo = await GrupoEntrenamiento.findById(req.params.id);
        
        if (!grupo) {
            return res.status(404).json({ message: 'Grupo no encontrado' });
        }

        // Eliminar el atleta del grupo
        grupo.atletas = grupo.atletas.filter(atletaId => atletaId.toString() !== req.params.atletaId);
        await grupo.save();

        // Obtener el grupo actualizado con los datos del atleta
        const grupoActualizado = await GrupoEntrenamiento.findById(req.params.id)
            .populate('entrenador atletas');

        res.json(grupoActualizado);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Obtener grupos de entrenamiento por entrenador
router.get('/entrenador/:entrenadorId', async (req, res) => {
  try {
    const grupos = await GrupoEntrenamiento.find({ entrenador: req.params.entrenadorId })
      .populate('entrenador')
      .populate('atletas');
    
    if (grupos.length === 0) {
      return res.status(404).json({ message: 'No se encontraron grupos para este entrenador' });
    }

    res.json(grupos);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
