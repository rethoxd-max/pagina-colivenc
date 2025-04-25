const express = require('express');
const router = express.Router();
const Marca = require('../models/ranking/Marca');
const mongoose = require('mongoose');

// Obtener pruebas en las que un atleta tenga al menos una marca
router.get('/pruebas/atleta/:atletaId', async (req, res) => {
    try {
        const { atletaId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(atletaId)) {
            return res.status(400).json({ message: 'ID de atleta no válido.' });
        }

        // Buscar todas las marcas del atleta y obtener las pruebas junto con su sector
        const marcas = await Marca.find({
            nombre_atleta: new mongoose.Types.ObjectId(atletaId)
        }).populate({
            path: 'nombre_prueba',
            populate: {
                path: 'sector_id',
                model: 'Sector'  // Asegúrate de que 'Sector' sea el modelo correcto del esquema
            }
        }).lean();

        if (!marcas || marcas.length === 0) {
            return res.status(404).json({ message: 'No se encontraron marcas para este atleta.' });
        }

        // Obtener una lista única de pruebas
        const pruebas = [...new Set(marcas.map(marca => marca.nombre_prueba))];

        if (pruebas.length === 0) {
            return res.status(404).json({ message: 'No se encontraron pruebas para este atleta.' });
        }

        // Ordenar pruebas primero por nombre del sector y luego por nombre de la prueba
        const pruebasOrdenadas = pruebas.sort((a, b) => {
            if (a.sector_id.nombre_sector < b.sector_id.nombre_sector) return -1;
            if (a.sector_id.nombre_sector > b.sector_id.nombre_sector) return 1;
            // Si los sectores son iguales, ordenar por el nombre de la prueba
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

// Obtener pruebas en las que un atleta tenga al menos una marca en un año específico
router.get('/pruebas/atleta/:atletaId/anyo/:anyo', async (req, res) => {
    try {
        const { atletaId, anyo } = req.params;

        // Validar el ID del atleta
        if (!mongoose.Types.ObjectId.isValid(atletaId)) {
            return res.status(400).json({ message: 'ID de atleta no válido.' });
        }

        // Validar y convertir el año a número
        const anyoNumero = parseInt(anyo);
        if (isNaN(anyoNumero)) {
            return res.status(400).json({ message: 'El año debe ser un número válido.' });
        }

        // Buscar todas las marcas del atleta en el año especificado y obtener las pruebas junto con su sector
        const marcas = await Marca.find({
            nombre_atleta: new mongoose.Types.ObjectId(atletaId),
            anyo: anyoNumero
        }).populate({
            path: 'nombre_prueba',
            populate: {
                path: 'sector_id',
                model: 'Sector'
            }
        }).lean();

        if (!marcas || marcas.length === 0) {
            return res.status(404).json({ message: 'No se encontraron marcas para este atleta en el año especificado.' });
        }

        // Obtener una lista única de pruebas
        const pruebas = [...new Set(marcas.map(marca => marca.nombre_prueba))];

        if (pruebas.length === 0) {
            return res.status(404).json({ message: 'No se encontraron pruebas para este atleta en el año especificado.' });
        }

        // Ordenar pruebas primero por nombre del sector y luego por nombre de la prueba
        const pruebasOrdenadas = pruebas.sort((a, b) => {
            if (a.sector_id.nombre_sector < b.sector_id.nombre_sector) return -1;
            if (a.sector_id.nombre_sector > b.sector_id.nombre_sector) return 1;
            // Si los sectores son iguales, ordenar por el nombre de la prueba
            if (a.nombre_prueba < b.nombre_prueba) return -1;
            if (a.nombre_prueba > b.nombre_prueba) return 1;
            return 0;
        });

        // Responder con las pruebas ordenadas
        res.json(pruebasOrdenadas);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: err.message });
    }
});




// Obtener todas las marcas de un atleta por su ID
router.get('/marcas/atleta/:atletaId', async (req, res) => {
    try {
        const { atletaId } = req.params;

        // Validar el ID del atleta
        if (!mongoose.Types.ObjectId.isValid(atletaId)) {
            return res.status(400).json({ message: 'ID de atleta no válido.' });
        }

        // Construir la consulta base
        const query = {
            nombre_atleta: new mongoose.Types.ObjectId(atletaId)
        };

        // Obtener las marcas sin filtrar por año
        const marcas = await Marca.find(query)
            .populate('nombre_atleta nombre_prueba categoria PcAL')
            .lean();

        if (!marcas || marcas.length === 0) {
            return res.status(404).json({ message: 'No se encontraron marcas para este atleta.' });
        }

        // Filtrar marcas que tengan un año válido
        const marcasValidas = marcas.filter(marca => {
            return marca.anyo !== undefined && 
                   marca.anyo !== null && 
                   !isNaN(Number(marca.anyo));
        });

        res.json(marcasValidas);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: err.message });
    }
});


// 1. Obtener la mejor marca por prueba de cada atleta
router.get('/mejor-marca/prueba/:pruebaId/atleta/:atletaId', async (req, res) => {
    try {
        const { pruebaId, atletaId } = req.params;

        const marcas = await Marca.find({
            nombre_prueba: pruebaId,
            nombre_atleta: atletaId
        }).populate('nombre_atleta nombre_prueba').lean();

        if (!marcas || marcas.length === 0) {
            return res.status(404).json({ message: 'No se encontraron marcas para el atleta en esta prueba.' });
        }

        const mejorMarca = obtenerMejorMarca(marcas);

        if (!mejorMarca) {
            return res.status(404).json({ message: 'No se encontró una mejor marca válida.' });
        }

        res.json(mejorMarca);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: err.message });
    }
});

// 2. Obtener la mejor marca por prueba y categoría de cada atleta
router.get('/mejor-marca/prueba/:pruebaId/categoria/:categoriaId/atleta/:atletaId', async (req, res) => {
    try {
        const { pruebaId, categoriaId, atletaId } = req.params;

        const marcas = await Marca.find({
            nombre_prueba: pruebaId,
            categoria: categoriaId,
            nombre_atleta: atletaId
        }).populate('nombre_atleta nombre_prueba categoria').lean();

        if (!marcas || marcas.length === 0) {
            return res.status(404).json({ message: 'No se encontraron marcas para el atleta en esta prueba y categoría.' });
        }

        const mejorMarca = obtenerMejorMarca(marcas);

        if (!mejorMarca) {
            return res.status(404).json({ message: 'No se encontró una mejor marca válida.' });
        }

        res.json(mejorMarca);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: err.message });
    }
});


// Obtener la mejor marca por prueba y PcAL
router.get('/mejor-marca/prueba/:pruebaId/PcAL/:PcALId/atleta/:atletaId', async (req, res) => {
    try {
        const { pruebaId, PcALId, atletaId } = req.params;

        const marcas = await Marca.find({
            nombre_prueba: pruebaId,
            PcAL: PcALId,
            nombre_atleta: atletaId
        }).populate('nombre_atleta nombre_prueba PcAL').lean();

        if (!marcas || marcas.length === 0) {
            return res.status(404).json({ message: 'No se encontraron marcas para el atleta en esta prueba y categoría.' });
        }

        const mejorMarca = obtenerMejorMarca(marcas);

        if (!mejorMarca) {
            return res.status(404).json({ message: 'No se encontró una mejor marca válida.' });
        }

        res.json(mejorMarca);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: err.message });
    }
});

// 3. Obtener la mejor marca por prueba, categoría y PcAL de cada atleta
router.get('/mejor-marca/prueba/:pruebaId/categoria/:categoriaId/PcAL/:PcALId/atleta/:atletaId', async (req, res) => {
    try {
        const { pruebaId, categoriaId, PcALId, atletaId } = req.params;

        const marcas = await Marca.find({
            nombre_prueba: pruebaId,
            categoria: categoriaId,
            PcAL: PcALId,
            nombre_atleta: atletaId
        }).populate('nombre_atleta nombre_prueba categoria PcAL').lean();

        if (!marcas || marcas.length === 0) {
            return res.status(404).json({ message: 'No se encontraron marcas para el atleta en esta prueba, categoría y PcAL.' });
        }

        const mejorMarca = obtenerMejorMarca(marcas);

        if (!mejorMarca) {
            return res.status(404).json({ message: 'No se encontró una mejor marca válida.' });
        }

        res.json(mejorMarca);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: err.message });
    }
});

// 4. Obtener la mejor marca por prueba de cada atleta, filtrando por año
router.get('/mejor-marca/prueba/:pruebaId/anyo/:anyo/atleta/:atletaId', async (req, res) => {
    try {
        const { pruebaId, anyo, atletaId } = req.params;

        const marcas = await Marca.find({
            nombre_prueba: pruebaId,
            anyo: anyo,
            nombre_atleta: atletaId
        }).populate('nombre_atleta nombre_prueba').lean();

        if (!marcas || marcas.length === 0) {
            return res.status(404).json({ message: 'No se encontraron marcas para el atleta en esta prueba y año.' });
        }

        const mejorMarca = obtenerMejorMarca(marcas);

        if (!mejorMarca) {
            return res.status(404).json({ message: 'No se encontró una mejor marca válida.' });
        }

        res.json(mejorMarca);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: err.message });
    }
});

// 5. Obtener la mejor marca por prueba y categoría de cada atleta, filtrando por año
router.get('/mejor-marca/prueba/:pruebaId/categoria/:categoriaId/anyo/:anyo/atleta/:atletaId', async (req, res) => {
    try {
        const { pruebaId, categoriaId, anyo, atletaId } = req.params;

        const marcas = await Marca.find({
            nombre_prueba: pruebaId,
            categoria: categoriaId,
            anyo: anyo,
            nombre_atleta: atletaId
        }).populate('nombre_atleta nombre_prueba categoria').lean();

        if (!marcas || marcas.length === 0) {
            return res.status(404).json({ message: 'No se encontraron marcas para el atleta en esta prueba, categoría y año.' });
        }

        const mejorMarca = obtenerMejorMarca(marcas);

        if (!mejorMarca) {
            return res.status(404).json({ message: 'No se encontró una mejor marca válida.' });
        }

        res.json(mejorMarca);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: err.message });
    }
});


// Obtener la mejor marca por prueba y PcAL, filtrando por año
router.get('/mejor-marca/prueba/:pruebaId/PcAL/:PcALId/anyo/:anyo/atleta/:atletaId', async (req, res) => {
    try {
        const { pruebaId, PcALId, anyo, atletaId } = req.params;

        // Asegúrate de que PcALId sea un ObjectId válido
        if (!mongoose.Types.ObjectId.isValid(PcALId)) {
            return res.status(400).json({ message: 'ID de PcAL no válido' });
        }

        const marcas = await Marca.find({
            nombre_prueba: pruebaId,
            PcAL: PcALId,  // PcAL es ahora un ObjectId que hace referencia al documento de PcAL
            anyo: anyo,
            nombre_atleta: atletaId
        }).populate('nombre_atleta nombre_prueba PcAL').lean();  // Populamos PcAL, nombre_atleta y nombre_prueba

        if (!marcas || marcas.length === 0) {
            return res.status(404).json({ message: 'No se encontraron marcas para el atleta en esta prueba, PcAL y año.' });
        }

        const mejorMarca = obtenerMejorMarca(marcas);

        if (!mejorMarca) {
            return res.status(404).json({ message: 'No se encontró una mejor marca válida.' });
        }

        res.json(mejorMarca);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: err.message });
    }
});


// 6. Obtener la mejor marca por prueba, categoría y PcAL de cada atleta, filtrando por año
router.get('/mejor-marca/prueba/:pruebaId/categoria/:categoriaId/PcAL/:PcALId/anyo/:anyo/atleta/:atletaId', async (req, res) => {
    try {
        const { pruebaId, categoriaId, PcALId, anyo, atletaId } = req.params;

        const marcas = await Marca.find({
            nombre_prueba: pruebaId,
            categoria: categoriaId,
            PcAL: PcALId,
            anyo: anyo,
            nombre_atleta: atletaId
        }).populate('nombre_atleta nombre_prueba categoria PcAL').lean();

        if (!marcas || marcas.length === 0) {
            return res.status(404).json({ message: 'No se encontraron marcas para el atleta en esta prueba, categoría, PcAL y año.' });
        }

        const mejorMarca = obtenerMejorMarca(marcas);

        if (!mejorMarca) {
            return res.status(404).json({ message: 'No se encontró una mejor marca válida.' });
        }

        res.json(mejorMarca);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: err.message });
    }
});

// Obtener todas las marcas de un atleta por prueba y año, ordenadas por fecha de realización
router.get('/marcas/prueba/:pruebaId/anyo/:anyo/atleta/:atletaId', async (req, res) => {
    try {
        const { pruebaId, anyo, atletaId } = req.params;

        // Verificar si los IDs son válidos
        if (!mongoose.Types.ObjectId.isValid(pruebaId) || !mongoose.Types.ObjectId.isValid(atletaId)) {
            return res.status(400).json({ message: 'ID de prueba o atleta no válido.' });
        }

        // Buscar las marcas del atleta para la prueba específica en el año proporcionado
        const marcas = await Marca.find({
            nombre_prueba: pruebaId,
            anyo: anyo,
            nombre_atleta: atletaId
        }).populate('nombre_atleta nombre_prueba').lean();

        // Si no se encuentran marcas, devolver un mensaje de error
        if (!marcas || marcas.length === 0) {
            return res.status(404).json({ message: 'No se encontraron marcas para este atleta en esta prueba y año.' });
        }

        // Ordenar las marcas por fecha_realizacion de más reciente a más antigua
        const marcasOrdenadas = marcas.sort((a, b) => {
            const fechaA = convertirFecha(a.fecha_realizacion);
            const fechaB = convertirFecha(b.fecha_realizacion);
            return fechaB - fechaA; // De más reciente a más antigua
        });

        // Devolver las marcas ordenadas
        res.json(marcasOrdenadas);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
});

function convertirFecha(fechaString) {
    const [dia, mes, anio] = fechaString.split('/');
    return new Date(`${anio}-${mes}-${dia}`);
}



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

// Obtener la mejor marca con viento legal por prueba de cada atleta
router.get('/mejor-marca-legal/prueba/:pruebaId/atleta/:atletaId', async (req, res) => {
    try {
        const { pruebaId, atletaId } = req.params;

        const marcas = await Marca.find({
            nombre_prueba: pruebaId,
            nombre_atleta: atletaId,
            viento: { $exists: true, $lte: 2.0, $gte: -2.0 } // Viento legal: entre -2.0 y 2.0 m/s
        }).populate('nombre_atleta nombre_prueba').lean();

        if (!marcas || marcas.length === 0) {
            return res.status(404).json({ message: 'No se encontraron marcas con viento legal para el atleta en esta prueba.' });
        }

        const mejorMarcaLegal = obtenerMejorMarca(marcas);

        if (!mejorMarcaLegal) {
            return res.status(404).json({ message: 'No se encontró una mejor marca con viento legal válida.' });
        }

        res.json(mejorMarcaLegal);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: err.message });
    }
});

// Obtener la mejor marca con viento legal por prueba y categoría de cada atleta
router.get('/mejor-marca-legal/prueba/:pruebaId/categoria/:categoriaId/atleta/:atletaId', async (req, res) => {
    try {
        const { pruebaId, categoriaId, atletaId } = req.params;

        const marcas = await Marca.find({
            nombre_prueba: pruebaId,
            categoria: categoriaId,
            nombre_atleta: atletaId,
            viento: { $exists: true, $lte: 2.0, $gte: -2.0 }
        }).populate('nombre_atleta nombre_prueba categoria').lean();

        if (!marcas || marcas.length === 0) {
            return res.status(404).json({ message: 'No se encontraron marcas con viento legal para el atleta en esta prueba y categoría.' });
        }

        const mejorMarcaLegal = obtenerMejorMarca(marcas);

        if (!mejorMarcaLegal) {
            return res.status(404).json({ message: 'No se encontró una mejor marca con viento legal válida.' });
        }

        res.json(mejorMarcaLegal);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: err.message });
    }
});

// Obtener la mejor marca con viento legal por prueba y PcAL de cada atleta
router.get('/mejor-marca-legal/prueba/:pruebaId/PcAL/:PcALId/atleta/:atletaId', async (req, res) => {
    try {
        const { pruebaId, PcALId, atletaId } = req.params;

        const marcas = await Marca.find({
            nombre_prueba: pruebaId,
            PcAL: PcALId,
            nombre_atleta: atletaId,
            viento: { $exists: true, $lte: 2.0, $gte: -2.0 }
        }).populate('nombre_atleta nombre_prueba PcAL').lean();

        if (!marcas || marcas.length === 0) {
            return res.status(404).json({ message: 'No se encontraron marcas con viento legal para el atleta en esta prueba y PcAL.' });
        }

        const mejorMarcaLegal = obtenerMejorMarca(marcas);

        if (!mejorMarcaLegal) {
            return res.status(404).json({ message: 'No se encontró una mejor marca con viento legal válida.' });
        }

        res.json(mejorMarcaLegal);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: err.message });
    }
});

// Obtener la mejor marca con viento legal por prueba, categoría y PcAL de cada atleta
router.get('/mejor-marca-legal/prueba/:pruebaId/categoria/:categoriaId/PcAL/:PcALId/atleta/:atletaId', async (req, res) => {
    try {
        const { pruebaId, categoriaId, PcALId, atletaId } = req.params;

        const marcas = await Marca.find({
            nombre_prueba: pruebaId,
            categoria: categoriaId,
            PcAL: PcALId,
            nombre_atleta: atletaId,
            viento: { $exists: true, $lte: 2.0, $gte: -2.0 }
        }).populate('nombre_atleta nombre_prueba categoria PcAL').lean();

        if (!marcas || marcas.length === 0) {
            return res.status(404).json({ message: 'No se encontraron marcas con viento legal para el atleta en esta prueba, categoría y PcAL.' });
        }

        const mejorMarcaLegal = obtenerMejorMarca(marcas);

        if (!mejorMarcaLegal) {
            return res.status(404).json({ message: 'No se encontró una mejor marca con viento legal válida.' });
        }

        res.json(mejorMarcaLegal);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: err.message });
    }
});

// Obtener la mejor marca con viento legal por prueba y año de cada atleta
router.get('/mejor-marca-legal/prueba/:pruebaId/anyo/:anyo/atleta/:atletaId', async (req, res) => {
    try {
        const { pruebaId, anyo, atletaId } = req.params;

        const marcas = await Marca.find({
            nombre_prueba: pruebaId,
            anyo: anyo,
            nombre_atleta: atletaId,
            viento: { $exists: true, $lte: 2.0, $gte: -2.0 }
        }).populate('nombre_atleta nombre_prueba').lean();

        if (!marcas || marcas.length === 0) {
            return res.status(404).json({ message: 'No se encontraron marcas con viento legal para el atleta en esta prueba y año.' });
        }

        const mejorMarcaLegal = obtenerMejorMarca(marcas);

        if (!mejorMarcaLegal) {
            return res.status(404).json({ message: 'No se encontró una mejor marca con viento legal válida.' });
        }

        res.json(mejorMarcaLegal);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: err.message });
    }
});

// Obtener la mejor marca con viento legal por prueba, PcAL y año de cada atleta
router.get('/mejor-marca-legal/prueba/:pruebaId/PcAL/:PcALId/anyo/:anyo/atleta/:atletaId', async (req, res) => {
    try {
        const { pruebaId, PcALId, anyo, atletaId } = req.params;

        const marcas = await Marca.find({
            nombre_prueba: pruebaId,
            PcAL: PcALId,
            anyo: anyo,
            nombre_atleta: atletaId,
            viento: { $exists: true, $lte: 2.0, $gte: -2.0 }
        }).populate('nombre_atleta nombre_prueba PcAL').lean();

        if (!marcas || marcas.length === 0) {
            return res.status(404).json({ message: 'No se encontraron marcas con viento legal para el atleta en esta prueba, PcAL y año.' });
        }

        const mejorMarcaLegal = obtenerMejorMarca(marcas);

        if (!mejorMarcaLegal) {
            return res.status(404).json({ message: 'No se encontró una mejor marca con viento legal válida.' });
        }

        res.json(mejorMarcaLegal);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
