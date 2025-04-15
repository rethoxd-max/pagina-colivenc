const express = require('express');
const router = express.Router();
const PruebaCompeticion = require('../../../models/calendario/competiciones/PruebaCompeticion');
const Competicion = require('../../../models/calendario/competicion');

// GET all pruebas
router.get('/', async (req, res) => {
  try {
    const pruebas = await PruebaCompeticion.find().populate('sector_id');
    res.json(pruebas);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/competicion/:competicionId', async (req, res) => {
  try {
    const competicion = await Competicion.findById(req.params.competicionId).populate({
      path: 'pruebas',
      populate: { path: 'categoria_id' }  // Popula el campo categoria_id
    });

    if (!competicion) {
      return res.status(404).json({ message: 'Competición no encontrada' });
    }

    const pruebas = competicion.pruebas;

    if (!pruebas || pruebas.length === 0) {
      return res.status(404).json({ message: 'No se encontraron pruebas para esta competición' });
    }

    res.json(pruebas);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET pruebas por sector y array de categorías
router.get('/sector/:sector/categorias', async (req, res) => {
  try {
    const { sector } = req.params;
    const { categorias } = req.query;

    // Verificamos que se haya proporcionado un array de categorías
    if (!categorias) {
      return res.status(400).json({ message: 'El parámetro de categorías es requerido' });
    }

    const categoriasArray = categorias.split(',').map(categoria => categoria.trim()); // Convertimos el query en un array

    // Buscamos pruebas que coincidan con el sector y el array de categorías
    const pruebas = await PruebaCompeticion.find({
      sector_id: sector,
      categoria_id: { $in: categoriasArray }  // Buscamos que las categorías estén dentro del array
    }).populate('sector_id').populate('categoria_id');  // Populamos los campos de sector y categoría

    if (!pruebas || pruebas.length === 0) {
      return res.status(404).json({ message: 'No se encontraron pruebas para el sector y las categorías proporcionadas' });
    }

    res.json(pruebas);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});




// GET pruebas by array of IDs using query parameter
router.get('/ids', async (req, res) => {
  try {
    // Verificar si el parámetro 'ids' está presente y no es vacío
    if (!req.query.ids || req.query.ids.trim() === '') {
      return res.status(400).json({ message: 'El parámetro de IDs es requerido' });
    }

    const ids = req.query.ids.split(',').map(id => id.trim()); // Trimear posibles espacios en los IDs
    const pruebas = await PruebaCompeticion.find({ _id: { $in: ids } }).populate('sector_id').populate('categoria_id');

    if (!pruebas || pruebas.length === 0) {
      return res.status(404).json({ message: 'No se encontraron pruebas para los IDs proporcionados' });
    }

    res.json(pruebas);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});




router.get('/sector/:sector_id', async (req, res) => {
  try {
    const pruebas = await PruebaCompeticion.find({ sector_id: req.params.sector_id }).populate('sector_id');
    if (!pruebas || pruebas.length === 0) {
      return res.status(404).json({ message: 'No se encontraron pruebas para este sector' });
    }
    res.json(pruebas);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET prueba by ID
router.get('/:id', async (req, res) => {
  try {
    const prueba = await PruebaCompeticion.findById(req.params.id).populate('sector_id').populate('categoria_id');  // Popula categoria_id
    if (!prueba) return res.status(404).json({ message: 'Prueba no encontrada' });
    res.json(prueba);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


// POST new prueba
router.post('/', async (req, res) => {
  const prueba = new PruebaCompeticion({
    nombre_prueba: req.body.nombre_prueba,
    sector_id: req.body.sector_id,
    categoria_id: req.body.categoria_id  // Incluye categoria_id en la creación
  });
  try {
    const newPrueba = await prueba.save();
    res.status(201).json(newPrueba);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});


// DELETE all pruebas
router.delete('/', async (req, res) => {
  try {
    await PruebaCompeticion.deleteMany({});
    res.json({ message: 'Todas las pruebas eliminadas' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE prueba by ID
router.delete('/:id', async (req, res) => {
  try {
    const prueba = await PruebaCompeticion.findById(req.params.id);
    if (!prueba) return res.status(404).json({ message: 'Prueba no encontrada' });
    await prueba.remove();
    res.json({ message: 'Prueba eliminada' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});



module.exports = router;
