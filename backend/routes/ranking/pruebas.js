const express = require('express');
const router = express.Router();
const Prueba = require('../../models/ranking/Prueba');
const Competicion = require('../../models/calendario/competicion');
const Marca = require('../../models/ranking/Marca');
const mongoose = require('mongoose');

// GET pruebas que tienen marcas para una categoría y sector específicos
router.get('/por-categoria-sector/:categoriaId/:sectorId', async (req, res) => {
  try {
    const { categoriaId, sectorId } = req.params;
    const { genero } = req.query;

    if (!mongoose.Types.ObjectId.isValid(categoriaId) || !mongoose.Types.ObjectId.isValid(sectorId)) {
      return res.status(400).json({ message: 'IDs no válidos.' });
    }

    let pruebasConMarcas;

    if (genero) {
      // Usar aggregation para filtrar por género del atleta
      const resultado = await Marca.aggregate([
        { $match: { categoria: new mongoose.Types.ObjectId(categoriaId) } },
        { $lookup: {
          from: 'atletas',
          localField: 'nombre_atleta',
          foreignField: '_id',
          as: 'atleta'
        }},
        { $unwind: '$atleta' },
        { $match: { 'atleta.genero': genero } },
        { $group: { _id: '$nombre_prueba' } }
      ]);
      pruebasConMarcas = resultado.map(r => r._id);
    } else {
      // Sin filtro de género, obtener directamente
      pruebasConMarcas = await Marca.distinct('nombre_prueba', { 
        categoria: new mongoose.Types.ObjectId(categoriaId) 
      });
    }

    // Obtener las pruebas de ese sector que tienen marcas
    const pruebas = await Prueba.find({ 
      _id: { $in: pruebasConMarcas },
      sector_id: new mongoose.Types.ObjectId(sectorId)
    }).populate('sector_id').lean();

    // Ordenar por nombre
    const pruebasOrdenadas = pruebas.sort((a, b) => {
      if (a.nombre_prueba < b.nombre_prueba) return -1;
      if (a.nombre_prueba > b.nombre_prueba) return 1;
      return 0;
    });

    res.json(pruebasOrdenadas);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
});

// GET all pruebas by sector
router.get('/', async (req, res) => {
  try {
    const pruebas = await Prueba.find().populate('sector_id').lean();
    const pruebasOrdenadas = pruebas.sort((a, b) => {
      if (a.sector_id.nombre_sector < b.sector_id.nombre_sector) return -1;
      if (a.sector_id.nombre_sector > b.sector_id.nombre_sector) return 1;
      if (a.nombre_prueba < b.nombre_prueba) return -1;
      if (a.nombre_prueba > b.nombre_prueba) return 1;
      return 0;
    });
    res.json(pruebasOrdenadas);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});



router.get('/competicion/:competicionId', async (req, res) => {
  try {
    const competicion = await Competicion.findById(req.params.competicionId).populate('pruebas');

    if (!competicion) {
      return res.status(404).json({ message: 'Competición no encontrada' });
    }

    const pruebas = competicion.pruebas.sort((a, b) => {
      if (a.nombre_prueba < b.nombre_prueba) return -1;
      if (a.nombre_prueba > b.nombre_prueba) return 1;
      return 0;
    });

    res.json(pruebas);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


// GET pruebas by array of IDs using query parameter
router.get('/ids', async (req, res) => {
  try {
    if (!req.query.ids || req.query.ids.trim() === '') {
      return res.status(400).json({ message: 'El parámetro de IDs es requerido' });
    }

    const ids = req.query.ids.split(',').map(id => id.trim());
    const pruebas = await Prueba.find({ _id: { $in: ids } }).populate('sector_id').lean();

    const pruebasOrdenadas = pruebas.sort((a, b) => {
      if (a.sector_id.nombre_sector < b.sector_id.nombre_sector) return -1;
      if (a.sector_id.nombre_sector > b.sector_id.nombre_sector) return 1;
      if (a.nombre_prueba < b.nombre_prueba) return -1;
      if (a.nombre_prueba > b.nombre_prueba) return 1;
      return 0;
    });

    res.json(pruebasOrdenadas);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


router.get('/sector/:sector_id', async (req, res) => {
  try {
    const pruebas = await Prueba.find({ sector_id: req.params.sector_id }).populate('sector_id').sort({ nombre_prueba: 1 });
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
    const prueba = await Prueba.findById(req.params.id).populate('sector_id');
    if (!prueba) return res.status(404).json({ message: 'Prueba no encontrada' });
    res.json(prueba);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST new prueba
router.post('/', async (req, res) => {
  const prueba = new Prueba({
    nombre_prueba: req.body.nombre_prueba,
    sector_id: req.body.sector_id
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
    await Prueba.deleteMany({});
    res.json({ message: 'Todas las pruebas eliminadas' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE prueba by ID
router.delete('/:id', async (req, res) => {
  try {
    const prueba = await Prueba.findById(req.params.id);
    if (!prueba) return res.status(404).json({ message: 'Prueba no encontrada' });
    await prueba.remove();
    res.json({ message: 'Prueba eliminada' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
