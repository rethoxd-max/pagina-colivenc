const express = require('express');
const router = express.Router();
const Atleta = require('../../models/ranking/Atleta');
const User = require('../../models/User');

// GET all atletas
router.get('/', async (req, res) => {
  try {
    const atletas = await Atleta.find().populate('usuario').sort({ nombre: 1 }); // Ordenar por nombre del atleta (alfabéticamente)
    res.json(atletas);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET atletas por género
router.get('/genero/:genero', async (req, res) => {
  try {
    const genero = req.params.genero;
    if (genero !== 'Masculino' && genero !== 'Femenino') {
      return res.status(400).json({ message: 'El género debe ser Masculino o Femenino' });
    }
    
    const atletas = await Atleta.find({ genero }).populate('usuario').sort({ nombre: 1 });
    res.json(atletas);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET atleta by ID
router.get('/:id', async (req, res) => {
  try {
    const atleta = await Atleta.findById(req.params.id).populate('usuario');
    if (!atleta) return res.status(404).json({ message: 'Atleta no encontrado' });
    res.json(atleta);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET atleta by User ID
router.get('/usuario/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Primero obtener el usuario
    const usuario = await User.findById(userId);
    if (!usuario) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    // Buscar el atleta por el nombre del usuario
    const atleta = await Atleta.findOne({ nombre: usuario.name });

    if (!atleta) {
      return res.status(404).json({ message: 'Atleta no encontrado para este usuario.' });
    }

    // Si encontramos el atleta, actualizamos su referencia al usuario
    if (!atleta.usuario) {
      atleta.usuario = userId;
      await atleta.save();
    }

    res.json(atleta);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


// POST new atleta
router.post('/', async (req, res) => {
  try {
    const { nombre, fecha_nacimiento, genero } = req.body;

    if (!genero || (genero !== 'Masculino' && genero !== 'Femenino')) {
      return res.status(400).json({ message: 'El género debe ser Masculino o Femenino' });
    }

    // Comprobar si ya existe un atleta con el mismo nombre y fecha de nacimiento
    const atletaExistente = await Atleta.findOne({ nombre, fecha_nacimiento });
    if (atletaExistente) {
      return res.status(400).json({ message: 'El atleta ya existe en la base de datos' });
    }

    // Buscamos un usuario con el mismo nombre
    const usuario = await User.findOne({ name: nombre });

    // Creamos el nuevo atleta
    const nuevoAtleta = new Atleta({
      nombre,
      fecha_nacimiento,
      genero,
      usuario: usuario ? usuario._id : null // Si no existe usuario, será null
    });

    const atletaGuardado = await nuevoAtleta.save();
    res.status(201).json(atletaGuardado);
  } catch (err) {
    res.status(400).json({ message: 'Error al crear atleta', error: err.message });
  }
});


// PUT update atleta by ID
router.put('/:id', async (req, res) => {
  try {
    const { nombre, fecha_nacimiento, genero } = req.body;

    if (genero && genero !== 'Masculino' && genero !== 'Femenino') {
      return res.status(400).json({ message: 'El género debe ser Masculino o Femenino' });
    }

    // Buscamos un usuario con el nuevo nombre
    const usuario = await User.findOne({ name: nombre });

    // Actualizamos el atleta
    const atletaActualizado = await Atleta.findByIdAndUpdate(req.params.id, {
      nombre,
      fecha_nacimiento,
      genero,
      usuario: usuario ? usuario._id : null
    }, { new: true }).populate('usuario');

    if (!atletaActualizado) return res.status(404).json({ message: 'Atleta no encontrado' });

    res.status(200).json(atletaActualizado);
  } catch (err) {
    res.status(400).json({ message: 'Error al actualizar atleta', error: err.message });
  }
});

// DELETE all atletas
router.delete('/', async (req, res) => {
  try {
    await Atleta.deleteMany({});
    res.json({ message: 'Todos los atletas eliminados' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE atleta by ID
router.delete('/:id', async (req, res) => {
  try {
    const atleta = await Atleta.findById(req.params.id);
    if (!atleta) return res.status(404).json({ message: 'Atleta no encontrado' });
    await atleta.remove();
    res.json({ message: 'Atleta eliminado' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
