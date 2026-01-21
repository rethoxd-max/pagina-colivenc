const express = require('express');
const router = express.Router();
const Atleta = require('../../models/ranking/Atleta');
const User = require('../../models/User');
const { generarSlugUnico } = require('../../utils/slugUtils');
const mongoose = require('mongoose');

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

// GET atleta by slug o ID (slug tiene prioridad)
router.get('/:identificador', async (req, res) => {
  try {
    const { identificador } = req.params;
    let atleta;
    
    // Primero intentar buscar por slug
    atleta = await Atleta.findOne({ slug: identificador }).populate('usuario');
    
    // Si no se encuentra por slug y es un ObjectId válido, buscar por ID
    if (!atleta && mongoose.Types.ObjectId.isValid(identificador)) {
      atleta = await Atleta.findById(identificador).populate('usuario');
    }
    
    if (!atleta) {
      return res.status(404).json({ message: 'Atleta no encontrado' });
    }
    
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

    // Generar slug único
    const slug = await generarSlugUnico(nombre, Atleta);

    // Buscamos un usuario con el mismo nombre
    const usuario = await User.findOne({ name: nombre });

    // Creamos el nuevo atleta
    const nuevoAtleta = new Atleta({
      nombre,
      slug,
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


// PUT update atleta by slug o ID
router.put('/:identificador', async (req, res) => {
  try {
    const { identificador } = req.params;
    const { nombre, fecha_nacimiento, genero } = req.body;

    if (genero && genero !== 'Masculino' && genero !== 'Femenino') {
      return res.status(400).json({ message: 'El género debe ser Masculino o Femenino' });
    }

    // Buscar atleta por slug o ID
    let atleta;
    atleta = await Atleta.findOne({ slug: identificador });
    if (!atleta && mongoose.Types.ObjectId.isValid(identificador)) {
      atleta = await Atleta.findById(identificador);
    }
    
    if (!atleta) {
      return res.status(404).json({ message: 'Atleta no encontrado' });
    }

    // Buscamos un usuario con el nuevo nombre
    const usuario = await User.findOne({ name: nombre });

    // Si el nombre ha cambiado, generar nuevo slug
    let nuevoSlug = atleta.slug;
    if (nombre && nombre !== atleta.nombre) {
      nuevoSlug = await generarSlugUnico(nombre, Atleta, atleta._id);
    }

    // Actualizamos el atleta
    atleta.nombre = nombre || atleta.nombre;
    atleta.slug = nuevoSlug;
    atleta.fecha_nacimiento = fecha_nacimiento || atleta.fecha_nacimiento;
    atleta.genero = genero || atleta.genero;
    atleta.usuario = usuario ? usuario._id : atleta.usuario;

    const atletaActualizado = await atleta.save();
    await atletaActualizado.populate('usuario');

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

// DELETE atleta by slug o ID
router.delete('/:identificador', async (req, res) => {
  try {
    const { identificador } = req.params;
    let atleta;
    
    // Buscar por slug primero
    atleta = await Atleta.findOne({ slug: identificador });
    if (!atleta && mongoose.Types.ObjectId.isValid(identificador)) {
      atleta = await Atleta.findById(identificador);
    }
    
    if (!atleta) {
      return res.status(404).json({ message: 'Atleta no encontrado' });
    }
    
    await Atleta.deleteOne({ _id: atleta._id });
    res.json({ message: 'Atleta eliminado' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
