const express = require('express');
const router = express.Router();
const Marca = require('../models/ranking/Marca');
const Categoria = require('../models/ranking/Categoria');
const mongoose = require('mongoose');

// GET all marcas
router.get('/', async (req, res) => {
    try {
        const marcas = await Marca.find().populate('nombre_atleta nombre_prueba categoria');
        res.json(marcas);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// GET categorías disponibles para una prueba (solo las que tienen marcas)
router.get('/categorias-disponibles/:pruebaId', async (req, res) => {
    try {
        const { pruebaId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(pruebaId)) {
            return res.status(400).json({ message: 'ID de prueba no válido.' });
        }

        // Obtener las categorías únicas que tienen marcas en esta prueba
        const categoriasConMarcas = await Marca.distinct('categoria', { 
            nombre_prueba: pruebaId 
        });

        // Obtener los detalles de las categorías
        const categorias = await Categoria.find({ 
            _id: { $in: categoriasConMarcas } 
        }).sort({ orden: 1 });

        res.json(categorias);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// GET años de temporada disponibles para una prueba
router.get('/anyos-disponibles/:pruebaId', async (req, res) => {
    try {
        const { pruebaId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(pruebaId)) {
            return res.status(400).json({ message: 'ID de prueba no válido.' });
        }

        // Obtener los años únicos que tienen marcas en esta prueba
        const anyos = await Marca.distinct('anyo', { 
            nombre_prueba: pruebaId 
        });

        // Ordenar de más reciente a más antiguo
        res.json(anyos.sort((a, b) => b - a));
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.get('/mejores-marcas/prueba/:pruebaId/atleta/:atletaId', async (req, res) => {
    try {
        const { pruebaId, atletaId } = req.params;

        // Obtener todas las marcas del atleta en la prueba seleccionada
        const marcas = await Marca.find({
            nombre_prueba: pruebaId,
            nombre_atleta: atletaId
        })
            .populate('nombre_atleta nombre_prueba')
            .lean();

        // Verifica si se obtuvieron marcas correctamente
        if (!marcas || marcas.length === 0) {
            return res.status(404).json({ message: 'No se encontraron marcas para el atleta en esta prueba.' });
        }

        // Asegúrate de que las marcas tienen los campos que necesitas
        const mejorMarca = obtenerMejorMarca(marcas);

        if (!mejorMarca) {
            return res.status(404).json({ message: 'No se encontró una mejor marca válida.' });
        }

        // Enviar la mejor marca
        res.json(mejorMarca);
    } catch (err) {
        console.error(err); // Esto te permitirá depurar mejor el error
        res.status(500).json({ message: err.message });
    }
});

// GET mejores marcas por prueba
router.get('/mejores-marcas/:pruebaId', async (req, res) => {
    try {
        const pruebaId = req.params.pruebaId;
        const todasMarcas = req.query.todasMarcas === 'true';

        // Validar que el ID sea válido
        if (!mongoose.Types.ObjectId.isValid(pruebaId)) {
            return res.status(400).json({ message: 'ID de prueba no válido.' });
        }

        // Obtener todas las marcas de la prueba seleccionada
        const marcas = await Marca.find({
            nombre_prueba: pruebaId
        })
            .populate('nombre_atleta nombre_prueba categoria')
            .lean();

        if (todasMarcas) {
            // Si se solicitan todas las marcas, devolver todas las marcas ordenadas
            return res.json(marcas.sort(ordenarMarcas));
        }

        // Agrupar las marcas por atleta
        const marcasPorAtleta = marcas.reduce((acc, marca) => {
            const atletaId = marca.nombre_atleta._id.toString();
            if (!acc[atletaId]) acc[atletaId] = [];
            acc[atletaId].push(marca);
            return acc;
        }, {});

        // Filtrar la mejor marca para cada atleta según las reglas
        const mejoresMarcas = Object.values(marcasPorAtleta).map(marcasAtleta => obtenerMejorMarca(marcasAtleta));

        // Ordenar las mejores marcas para el ranking
        const rankingOrdenado = mejoresMarcas.sort(ordenarMarcas);

        // Enviar las mejores marcas ordenadas
        res.json(rankingOrdenado);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// GET mejores marcas por prueba y PcAL (sin categoría - para filtrar todas las categorías por PcAL)
router.get('/mejores-marcas/:pruebaId/pcal/:PcALId', async (req, res) => {
    try {
        const { pruebaId, PcALId } = req.params;
        const todasMarcas = req.query.todasMarcas === 'true';

        // Validar que los IDs sean válidos
        if (!mongoose.Types.ObjectId.isValid(pruebaId) || !mongoose.Types.ObjectId.isValid(PcALId)) {
            return res.status(400).json({ message: 'ID de prueba o PcAL no válido.' });
        }

        // Obtener todas las marcas de la prueba y PcAL seleccionados
        const marcas = await Marca.find({
            nombre_prueba: pruebaId,
            PcAL: PcALId
        })
            .populate('nombre_atleta nombre_prueba categoria PcAL')
            .lean();

        if (todasMarcas) {
            return res.json(marcas.sort(ordenarMarcas));
        }

        // Agrupar las marcas por atleta
        const marcasPorAtleta = marcas.reduce((acc, marca) => {
            const atletaId = marca.nombre_atleta._id.toString();
            if (!acc[atletaId]) acc[atletaId] = [];
            acc[atletaId].push(marca);
            return acc;
        }, {});

        // Filtrar la mejor marca para cada atleta
        const mejoresMarcas = Object.values(marcasPorAtleta).map(marcasAtleta => obtenerMejorMarca(marcasAtleta));

        res.json(mejoresMarcas.sort(ordenarMarcas));
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// GET mejores marcas por prueba, PcAL y género (sin categoría)
router.get('/mejores-marcas/:pruebaId/pcal/:PcALId/genero/:genero', async (req, res) => {
    try {
        const { pruebaId, PcALId, genero } = req.params;
        const todasMarcas = req.query.todasMarcas === 'true';

        // Validar que los IDs sean válidos
        if (!mongoose.Types.ObjectId.isValid(pruebaId) || !mongoose.Types.ObjectId.isValid(PcALId)) {
            return res.status(400).json({ message: 'ID de prueba o PcAL no válido.' });
        }

        if (genero !== 'Masculino' && genero !== 'Femenino') {
            return res.status(400).json({ message: 'El género debe ser Masculino o Femenino' });
        }

        // Obtener todas las marcas de la prueba y PcAL seleccionados
        const marcas = await Marca.find({
            nombre_prueba: pruebaId,
            PcAL: PcALId
        })
            .populate({
                path: 'nombre_atleta',
                match: { genero }
            })
            .populate('nombre_prueba categoria PcAL')
            .lean();

        // Filtrar marcas donde nombre_atleta existe (solo atletas del género seleccionado)
        const marcasFiltradas = marcas.filter(marca => marca.nombre_atleta !== null);

        if (todasMarcas) {
            return res.json(marcasFiltradas.sort(ordenarMarcas));
        }

        // Agrupar las marcas por atleta
        const marcasPorAtleta = marcasFiltradas.reduce((acc, marca) => {
            const atletaId = marca.nombre_atleta._id.toString();
            if (!acc[atletaId]) acc[atletaId] = [];
            acc[atletaId].push(marca);
            return acc;
        }, {});

        // Filtrar la mejor marca para cada atleta
        const mejoresMarcas = Object.values(marcasPorAtleta).map(marcasAtleta => obtenerMejorMarca(marcasAtleta));

        res.json(mejoresMarcas.sort(ordenarMarcas));
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// GET mejores marcas por prueba y género
router.get('/mejores-marcas/:pruebaId/genero/:genero', async (req, res) => {
    try {
        const { pruebaId, genero } = req.params;
        const todasMarcas = req.query.todasMarcas === 'true';

        // Validar que los IDs sean válidos
        if (!mongoose.Types.ObjectId.isValid(pruebaId)) {
            return res.status(400).json({ message: 'ID de prueba no válido.' });
        }

        if (genero !== 'Masculino' && genero !== 'Femenino') {
            return res.status(400).json({ message: 'El género debe ser Masculino o Femenino' });
        }

        // Obtener todas las marcas de la prueba seleccionada
        const marcas = await Marca.find({
            nombre_prueba: pruebaId
        })
            .populate({
                path: 'nombre_atleta',
                match: { genero }
            })
            .populate('nombre_prueba categoria')
            .lean();

        // Filtrar marcas donde nombre_atleta existe (solo atletas del género seleccionado)
        const marcasFiltradas = marcas.filter(marca => marca.nombre_atleta !== null);

        if (todasMarcas) {
            // Si se solicitan todas las marcas, devolver todas las marcas ordenadas
            return res.json(marcasFiltradas.sort(ordenarMarcas));
        }

        // Agrupar las marcas por atleta
        const marcasPorAtleta = marcasFiltradas.reduce((acc, marca) => {
            const atletaId = marca.nombre_atleta._id.toString();
            if (!acc[atletaId]) acc[atletaId] = [];
            acc[atletaId].push(marca);
            return acc;
        }, {});

        // Filtrar la mejor marca para cada atleta según las reglas
        const mejoresMarcas = Object.values(marcasPorAtleta).map(marcasAtleta => obtenerMejorMarca(marcasAtleta));

        // Ordenar las mejores marcas para el ranking
        const rankingOrdenado = mejoresMarcas.sort(ordenarMarcas);

        // Enviar las mejores marcas ordenadas
        res.json(rankingOrdenado);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.get('/mejores-marcas/:pruebaId', async (req, res) => {
    try {
        const pruebaId = req.params.pruebaId;
        const todasMarcas = req.query.todasMarcas === 'true';

        // Obtener todas las marcas de la prueba seleccionada
        const marcas = await Marca.find({ nombre_prueba: pruebaId })
            .populate('nombre_atleta nombre_prueba')
            .lean(); // Usamos lean() para mejorar el rendimiento

        if (todasMarcas) {
            // Si se solicitan todas las marcas, devolver todas las marcas ordenadas
            return res.json(marcas.sort(ordenarMarcas));
        }

        // Agrupar las marcas por atleta
        const marcasPorAtleta = marcas.reduce((acc, marca) => {
            const atletaId = marca.nombre_atleta._id.toString();
            if (!acc[atletaId]) acc[atletaId] = [];
            acc[atletaId].push(marca);
            return acc;
        }, {});

        // Filtrar la mejor marca para cada atleta según las reglas
        const mejoresMarcas = Object.values(marcasPorAtleta).map(marcasAtleta => obtenerMejorMarca(marcasAtleta));

        // Ordenar las mejores marcas para el ranking
        const rankingOrdenado = mejoresMarcas.sort(ordenarMarcas);

        // Enviar las mejores marcas ordenadas
        res.json(rankingOrdenado);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// GET mejores marcas por prueba, categoría y género
router.get('/mejores-marcas/:pruebaId/:categoriaId/genero/:genero', async (req, res) => {
    try {
        const { pruebaId, categoriaId, genero } = req.params;
        const todasMarcas = req.query.todasMarcas === 'true';

        // Validar que los IDs sean válidos
        if (!mongoose.Types.ObjectId.isValid(pruebaId) || !mongoose.Types.ObjectId.isValid(categoriaId)) {
            return res.status(400).json({ message: 'ID de prueba o categoría no válido.' });
        }
        
        if (genero !== 'Masculino' && genero !== 'Femenino') {
            return res.status(400).json({ message: 'El género debe ser Masculino o Femenino' });
        }

        // Obtener todas las marcas de la prueba y categoría seleccionadas
        const marcas = await Marca.find({
            nombre_prueba: pruebaId,
            categoria: categoriaId
        })
            .populate({
                path: 'nombre_atleta',
                match: { genero }
            })
            .populate('nombre_prueba categoria')
            .lean();

        // Filtrar marcas donde nombre_atleta existe (solo atletas del género seleccionado)
        const marcasFiltradas = marcas.filter(marca => marca.nombre_atleta !== null);

        if (marcasFiltradas.length === 0) {
            return res.status(404).json({ message: 'No se encontraron marcas válidas para esta prueba, categoría y género.' });
        }

        if (todasMarcas) {
            // Si se solicitan todas las marcas, devolver todas las marcas ordenadas
            return res.json(marcasFiltradas.sort(ordenarMarcas));
        }

        // Agrupar las marcas por atleta
        const marcasPorAtleta = marcasFiltradas.reduce((acc, marca) => {
            const atletaId = marca.nombre_atleta._id.toString();
            if (!acc[atletaId]) acc[atletaId] = [];
            acc[atletaId].push(marca);
            return acc;
        }, {});

        // Filtrar la mejor marca para cada atleta según las reglas
        const mejoresMarcas = Object.values(marcasPorAtleta).map(marcasAtleta => obtenerMejorMarca(marcasAtleta));

        // Ordenar las mejores marcas para el ranking
        const rankingOrdenado = mejoresMarcas.sort(ordenarMarcas);

        // Enviar las mejores marcas ordenadas
        res.json(rankingOrdenado);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: err.message });
    }
});

router.get('/mejores-marcas/:pruebaId/:categoriaId', async (req, res) => {
    try {
        const pruebaId = req.params.pruebaId;
        const categoriaId = req.params.categoriaId;
        const todasMarcas = req.query.todasMarcas === 'true';

        // Validar que los IDs sean válidos
        if (!mongoose.Types.ObjectId.isValid(pruebaId) || !mongoose.Types.ObjectId.isValid(categoriaId)) {
            return res.status(400).json({ message: 'ID de prueba o categoría no válido.' });
        }

        // Obtener todas las marcas de la prueba seleccionada y la categoría
        const marcas = await Marca.find({
            nombre_prueba: pruebaId,
            categoria: categoriaId
        })
            .populate('nombre_atleta nombre_prueba categoria')
            .lean();

        // Filtrar marcas que tengan todos los campos necesarios
        const marcasValidas = marcas.filter(marca => 
            marca.nombre_atleta && 
            marca.nombre_prueba && 
            marca.categoria
        );

        if (marcasValidas.length === 0) {
            return res.status(404).json({ message: 'No se encontraron marcas válidas para esta prueba y categoría.' });
        }

        if (todasMarcas) {
            // Si se solicitan todas las marcas, devolver todas las marcas ordenadas
            return res.json(marcasValidas.sort(ordenarMarcas));
        }

        // Agrupar las marcas por atleta
        const marcasPorAtleta = marcasValidas.reduce((acc, marca) => {
            const atletaId = marca.nombre_atleta._id.toString();
            if (!acc[atletaId]) acc[atletaId] = [];
            acc[atletaId].push(marca);
            return acc;
        }, {});

        // Filtrar la mejor marca para cada atleta según las reglas
        const mejoresMarcas = Object.values(marcasPorAtleta).map(marcasAtleta => obtenerMejorMarca(marcasAtleta));

        // Ordenar las mejores marcas para el ranking
        const rankingOrdenado = mejoresMarcas.sort(ordenarMarcas);

        // Enviar las mejores marcas ordenadas
        res.json(rankingOrdenado);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: err.message });
    }
});

// GET mejores marcas por prueba, categoría, PcAL y género
router.get('/mejores-marcas/:pruebaId/:categoriaId/:PcALId/genero/:genero', async (req, res) => {
    try {
        const { pruebaId, categoriaId, PcALId, genero } = req.params;
        const todasMarcas = req.query.todasMarcas === 'true';
        
        if (genero !== 'Masculino' && genero !== 'Femenino') {
            return res.status(400).json({ message: 'El género debe ser Masculino o Femenino' });
        }

        // Obtener todas las marcas de la prueba, categoría y PcAL seleccionados
        const marcas = await Marca.find({
            nombre_prueba: pruebaId,
            categoria: categoriaId,
            PcAL: PcALId
        })
            .populate({
                path: 'nombre_atleta',
                match: { genero }
            })
            .populate('nombre_prueba categoria PcAL')
            .lean();

        // Filtrar marcas donde nombre_atleta existe (solo atletas del género seleccionado)
        const marcasFiltradas = marcas.filter(marca => marca.nombre_atleta !== null);

        if (todasMarcas) {
            // Si se solicitan todas las marcas, devolver todas las marcas ordenadas
            return res.json(marcasFiltradas.sort(ordenarMarcas));
        }

        // Agrupar las marcas por atleta
        const marcasPorAtleta = marcasFiltradas.reduce((acc, marca) => {
            const atletaId = marca.nombre_atleta._id.toString();
            if (!acc[atletaId]) acc[atletaId] = [];
            acc[atletaId].push(marca);
            return acc;
        }, {});

        // Filtrar la mejor marca para cada atleta según las reglas
        const mejoresMarcas = Object.values(marcasPorAtleta).map(marcasAtleta => obtenerMejorMarca(marcasAtleta));

        // Ordenar las mejores marcas para el ranking
        const rankingOrdenado = mejoresMarcas.sort(ordenarMarcas);

        // Enviar las mejores marcas ordenadas
        res.json(rankingOrdenado);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: err.message });
    }
});

router.get('/mejores-marcas/:pruebaId/:categoriaId/:PcALId', async (req, res) => {
    try {
        const pruebaId = req.params.pruebaId;
        const categoriaId = req.params.categoriaId;
        const PcALId = req.params.PcALId;
        const todasMarcas = req.query.todasMarcas === 'true';

        // Obtener todas las marcas de la prueba seleccionada y la categoría
        const marcas = await Marca.find({
            nombre_prueba: pruebaId,
            categoria: categoriaId,
            PcAL: PcALId
        })
            .populate('nombre_atleta nombre_prueba categoria PcAL')
            .lean(); // Usamos lean() para mejorar el rendimiento

        if (todasMarcas) {
            // Si se solicitan todas las marcas, devolver todas las marcas ordenadas
            return res.json(marcas.sort(ordenarMarcas));
        }

        // Agrupar las marcas por atleta
        const marcasPorAtleta = marcas.reduce((acc, marca) => {
            const atletaId = marca.nombre_atleta._id.toString();
            if (!acc[atletaId]) acc[atletaId] = [];
            acc[atletaId].push(marca);
            return acc;
        }, {});

        // Filtrar la mejor marca para cada atleta según las reglas
        const mejoresMarcas = Object.values(marcasPorAtleta).map(marcasAtleta => obtenerMejorMarca(marcasAtleta));

        // Ordenar las mejores marcas para el ranking
        const rankingOrdenado = mejoresMarcas.sort(ordenarMarcas);

        // Enviar las mejores marcas ordenadas
        res.json(rankingOrdenado);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Función para ordenar las marcas en el ranking
function ordenarMarcas(a, b) {
    if (a.metros && b.metros) {
        return b.metros - a.metros;
    } else if (a.puntos && b.puntos) {
        return b.puntos - a.puntos;
    } else {
        const totalSegundosA = (a.horas || 0) * 3600 + (a.minutos || 0) * 60 + (a.segundos || 0);
        const totalSegundosB = (b.horas || 0) * 3600 + (b.minutos || 0) * 60 + (b.segundos || 0);
        return totalSegundosA - totalSegundosB;
    }
}

// GET marca by ID
router.get('/:id', async (req, res) => {
    try {
        const marca = await Marca.findById(req.params.id).populate('nombre_atleta nombre_prueba categoria');
        if (!marca) return res.status(404).json({ message: 'Marca no encontrada' });
        res.json(marca);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// POST new marca
router.post('/', async (req, res) => {
    const marca = new Marca({
        nombre_atleta: req.body.nombre_atleta,
        nombre_prueba: req.body.nombre_prueba,
        horas: req.body.horas,
        minutos: req.body.minutos,
        segundos: req.body.segundos,
        metros: req.body.metros,
        puntos: req.body.puntos,
        lugar: req.body.lugar,
        viento: req.body.viento,
        comentario: req.body.comentario,
        categoria: req.body.categoria,
        anyo: req.body.anyo,
        PcAL: req.body.PcAL
    });
    try {
        const newMarca = await marca.save();
        res.status(201).json(newMarca);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// DELETE all marcas
router.delete('/', async (req, res) => {
    try {
        await Marca.deleteMany({});
        res.json({ message: 'Todas las marcas eliminadas' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// DELETE marca by ID
router.delete('/:id', async (req, res) => {
    try {
        const marca = await Marca.findById(req.params.id);
        if (!marca) return res.status(404).json({ message: 'Marca no encontrada' });
        await marca.remove();
        res.json({ message: 'Marca eliminada' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Función para obtener la mejor marca según las reglas de tiempo, metros o puntos
function obtenerMejorMarca(marcasAtleta) {
    return marcasAtleta.reduce((mejorMarca, marcaActual) => {
        const esMarcaPorMetros = (
            marcaActual.segundos == null &&
            marcaActual.minutos == null &&
            marcaActual.horas == null &&
            marcaActual.puntos == null
        );

        const esMarcaPorPuntos = (
            marcaActual.segundos == null &&
            marcaActual.minutos == null &&
            marcaActual.horas == null &&
            marcaActual.metros == null
        );

        if (esMarcaPorMetros) {
            return mejorMarca.metros === undefined || marcaActual.metros > mejorMarca.metros ? marcaActual : mejorMarca;
        } else if (esMarcaPorPuntos) {
            return mejorMarca.puntos === undefined || marcaActual.puntos > mejorMarca.puntos ? marcaActual : mejorMarca;
        } else {
            const totalSegundosActual = (marcaActual.horas || 0) * 3600 + (marcaActual.minutos || 0) * 60 + (marcaActual.segundos || 0);
            const totalSegundosMejor = (mejorMarca.horas || 0) * 3600 + (mejorMarca.minutos || 0) * 60 + (mejorMarca.segundos || 0);
            return totalSegundosActual < totalSegundosMejor ? marcaActual : mejorMarca;
        }
    });
}

// GET categorías que tienen al menos una marca en toda la base de datos
router.get('/categorias-con-marcas', async (req, res) => {
    try {
        const grupos = await Marca.aggregate([
            { $match: { categoria: { $exists: true, $ne: null } } },
            { $group: { _id: '$categoria' } }
        ]);
        const ids = grupos.map(g => g._id);
        const categorias = await Categoria.find({
            _id: { $in: ids }
        }).sort({ orden: 1, nombre_categoria: 1 });
        res.json(categorias);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
