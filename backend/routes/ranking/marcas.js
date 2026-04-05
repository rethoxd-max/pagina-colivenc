const express = require('express');
const router = express.Router();
const Marca = require('../../models/ranking/Marca');
const Atleta = require('../../models/ranking/Atleta');
const Prueba = require('../../models/ranking/Prueba');
const Sector = require('../../models/ranking/Sector');
const PcAL = require('../../models/ranking/PcAL');
const { calcularCategoria, parsearFecha } = require('../../utils/categoriaUtils');
const auth = require('../../middleware/auth');
const { 
    obtenerConfigCombinada, 
    parsearMarcasCombinada 
} = require('../../config/combinadas');

/**
 * Escapa caracteres especiales de expresiones regulares
 * para poder buscar texto literal que contenga paréntesis, corchetes, etc.
 * @param {string} text - Texto a escapar
 * @returns {string} - Texto con caracteres especiales escapados
 */
function escapeRegex(text) {
    return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Parsea el tiempo según el sector de la prueba
 * @param {string} marcaStr - Marca en formato texto
 * @param {string} sectorNombre - Nombre del sector
 * @returns {Object} - Objeto con horas, minutos, segundos, metros, puntos, viento, comentario
 */
function parsearMarca(marcaStr, sectorNombre) {
    const resultado = {
        horas: null,
        minutos: null,
        segundos: null,
        metros: null,
        puntos: null,
        viento: null,
        comentario: null
    };

    // Normalizar el string
    marcaStr = marcaStr.trim();

    // Sectores que usan metros (Lanzamientos, Saltos)
    const sectoresMetros = ['Lanzamientos', 'Saltos'];
    // Sectores que usan puntos (Combinadas)
    const sectoresPuntos = ['Combinadas'];

    if (sectoresMetros.includes(sectorNombre)) {
        // Formato: "6.70" o "6.70 +1.2" (metros y viento opcional)
        const partes = marcaStr.split(/\s+/);
        resultado.metros = parseFloat(partes[0].replace(',', '.'));
        if (partes.length > 1) {
            resultado.viento = parseFloat(partes[1].replace(',', '.'));
        }
    } else if (sectoresPuntos.includes(sectorNombre)) {
        // Formato: "5000" o "5000,11.50/5.60/14.00" (puntos y comentario opcional con marcas individuales)
        // El comentario viene como campo adicional separado por coma
        resultado.puntos = parseInt(marcaStr, 10);
    } else {
        // Carreras: formato puede ser "11.45", "1:30.50", "2:05:30.00"
        // También puede incluir viento: "11.45 +1.2"
        const partesViento = marcaStr.split(/\s+/);
        let tiempoStr = partesViento[0];
        
        if (partesViento.length > 1) {
            resultado.viento = parseFloat(partesViento[1].replace(',', '.'));
        }

        // Parsear el tiempo
        const partesTiempo = tiempoStr.split(':');
        
        if (partesTiempo.length === 1) {
            // Solo segundos: "11.45"
            resultado.segundos = parseFloat(partesTiempo[0].replace(',', '.'));
        } else if (partesTiempo.length === 2) {
            // Minutos:Segundos: "1:30.50"
            resultado.minutos = parseInt(partesTiempo[0], 10);
            resultado.segundos = parseFloat(partesTiempo[1].replace(',', '.'));
        } else if (partesTiempo.length === 3) {
            // Horas:Minutos:Segundos: "2:05:30.00"
            resultado.horas = parseInt(partesTiempo[0], 10);
            resultado.minutos = parseInt(partesTiempo[1], 10);
            resultado.segundos = parseFloat(partesTiempo[2].replace(',', '.'));
        }
    }

    return resultado;
}

/**
 * Divide el CSV en competiciones y pruebas
 * - 1 línea vacía = nueva prueba dentro de la misma competición
 * - 2+ líneas vacías = nueva competición
 * 
 * @param {string} csvData - Datos CSV completos
 * @returns {Array} - Array de competiciones, cada una con cabecera y array de pruebas
 */
function dividirEnCompeticionesYPruebas(csvData) {
    const lineas = csvData.split('\n');
    const competiciones = [];
    
    let bloqueActual = [];
    let lineasVaciasConsecutivas = 0;
    
    for (const linea of lineas) {
        const lineaTrimmed = linea.trim();
        
        if (lineaTrimmed === '') {
            lineasVaciasConsecutivas++;
            
            // Si hay 2+ líneas vacías consecutivas, es nueva competición
            if (lineasVaciasConsecutivas >= 2 && bloqueActual.length > 0) {
                competiciones.push(bloqueActual);
                bloqueActual = [];
            } else if (lineasVaciasConsecutivas === 1 && bloqueActual.length > 0) {
                // 1 línea vacía: marcador para nueva prueba dentro de la competición
                bloqueActual.push('__NUEVA_PRUEBA__');
            }
        } else {
            lineasVaciasConsecutivas = 0;
            bloqueActual.push(lineaTrimmed);
        }
    }
    
    // No olvidar el último bloque
    if (bloqueActual.length > 0) {
        competiciones.push(bloqueActual);
    }
    
    return competiciones;
}

/**
 * Procesa una competición completa con múltiples pruebas
 * @param {Array} lineas - Líneas de la competición (con marcadores __NUEVA_PRUEBA__)
 * @param {number} numeroCompeticion - Número de la competición
 * @param {boolean} soloPreview - Si es true, no crea sectores ni pruebas nuevas
 * @returns {Object} - Objeto con cabecera y array de pruebas procesadas
 */
async function procesarCompeticion(lineas, numeroCompeticion, soloPreview = false) {
    const resultado = {
        valido: true,
        cabecera: null,
        pruebas: [],
        errores: []
    };

    if (lineas.length < 3) {
        resultado.valido = false;
        resultado.errores.push({
            competicion: numeroCompeticion,
            error: 'La competición debe tener al menos 3 líneas: cabecera, prueba y al menos una marca'
        });
        return resultado;
    }

    // Línea 1: Lugar,Fecha,PC/AL
    const cabecera = lineas[0].split(',').map(s => s.trim());
    if (cabecera.length < 3) {
        resultado.valido = false;
        resultado.errores.push({
            competicion: numeroCompeticion,
            error: 'La primera línea debe tener formato: Lugar,Fecha,PC/AL'
        });
        return resultado;
    }

    const lugar = cabecera[0];
    let fechaCompeticion;
    try {
        fechaCompeticion = parsearFecha(cabecera[1]);
    } catch (e) {
        resultado.valido = false;
        resultado.errores.push({
            competicion: numeroCompeticion,
            error: `Fecha inválida: ${cabecera[1]}`
        });
        return resultado;
    }
    const pcAlTexto = cabecera[2].toUpperCase().trim();

    // Buscar PcAL en la BD
    let pcAlDoc;
    if (pcAlTexto === 'PC' || pcAlTexto === 'PISTA CUBIERTA') {
        // Buscar "Pista Cubierta" o variantes
        pcAlDoc = await PcAL.findOne({ PcAL: { $regex: /pista.*cubierta/i } });
        // Si no encuentra, buscar "PC" exacto
        if (!pcAlDoc) {
            pcAlDoc = await PcAL.findOne({ PcAL: { $regex: /^pc$/i } });
        }
    } else if (pcAlTexto === 'AL' || pcAlTexto === 'AIRE LIBRE') {
        // Buscar "Aire Libre" o variantes
        pcAlDoc = await PcAL.findOne({ PcAL: { $regex: /aire.*libre/i } });
        // Si no encuentra, buscar "AL" exacto
        if (!pcAlDoc) {
            pcAlDoc = await PcAL.findOne({ PcAL: { $regex: /^al$/i } });
        }
    }

    // Búsqueda genérica si no se encontró
    if (!pcAlDoc) {
        pcAlDoc = await PcAL.findOne({ PcAL: { $regex: new RegExp(`^${escapeRegex(pcAlTexto)}$`, 'i') } });
    }

    resultado.cabecera = {
        lugar,
        fecha: cabecera[1],
        fechaCompeticion,
        pcAL: pcAlDoc?.PcAL || pcAlTexto,
        pcALValido: !!pcAlDoc,
        pcAlDoc
    };

    if (!pcAlDoc) {
        resultado.valido = false;
        resultado.errores.push({
            competicion: numeroCompeticion,
            error: `No se encontró el tipo PC/AL: ${pcAlTexto}. Use PC o AL.`
        });
    }

    // Dividir las líneas restantes en pruebas usando el marcador
    const lineasRestantes = lineas.slice(1);
    const bloquesPruebas = [];
    let bloquePruebaActual = [];
    
    for (const linea of lineasRestantes) {
        if (linea === '__NUEVA_PRUEBA__') {
            if (bloquePruebaActual.length > 0) {
                bloquesPruebas.push(bloquePruebaActual);
                bloquePruebaActual = [];
            }
        } else {
            bloquePruebaActual.push(linea);
        }
    }
    if (bloquePruebaActual.length > 0) {
        bloquesPruebas.push(bloquePruebaActual);
    }

    // Procesar cada prueba
    let numeroPrueba = 0;
    for (const bloquePrueba of bloquesPruebas) {
        numeroPrueba++;
        
        if (bloquePrueba.length < 2) {
            resultado.errores.push({
                competicion: numeroCompeticion,
                prueba: numeroPrueba,
                error: 'Cada prueba debe tener al menos sector,prueba y una marca'
            });
            continue;
        }

        // Nuevo formato: sector,prueba
        const lineaPrueba = bloquePrueba[0].trim();
        const partesPrueba = lineaPrueba.split(',').map(s => s.trim());
        
        let nombreSector, nombrePrueba;
        
        if (partesPrueba.length >= 2) {
            // Nuevo formato: sector,prueba
            nombreSector = partesPrueba[0];
            nombrePrueba = partesPrueba[1];
        } else {
            // Formato antiguo: solo prueba (para compatibilidad)
            nombrePrueba = partesPrueba[0];
            nombreSector = null;
        }

        // Buscar o crear sector
        let sectorDoc = null;
        let sectorExiste = false;
        if (nombreSector) {
            sectorDoc = await Sector.findOne({ 
                nombre_sector: { $regex: new RegExp(`^${escapeRegex(nombreSector)}$`, 'i') } 
            });
            sectorExiste = !!sectorDoc;
            
            if (!sectorDoc && !soloPreview) {
                // Crear sector si no existe
                sectorDoc = new Sector({ nombre_sector: nombreSector });
                await sectorDoc.save();
            }
        }

        // Buscar prueba
        let pruebaDoc = await Prueba.findOne({ 
            nombre_prueba: { $regex: new RegExp(`^${escapeRegex(nombrePrueba)}$`, 'i') } 
        }).populate('sector_id');

        const pruebaExiste = !!pruebaDoc;

        // Si la prueba no existe y tenemos sector (o nombreSector para crearlo), crearla
        if (!pruebaDoc && (sectorDoc || nombreSector) && !soloPreview) {
            // Si no tenemos sectorDoc pero sí nombreSector, crear el sector primero
            if (!sectorDoc && nombreSector) {
                sectorDoc = new Sector({ nombre_sector: nombreSector });
                await sectorDoc.save();
            }
            
            pruebaDoc = new Prueba({ 
                nombre_prueba: nombrePrueba,
                sector_id: sectorDoc._id 
            });
            await pruebaDoc.save();
            pruebaDoc = await Prueba.findById(pruebaDoc._id).populate('sector_id');
        }

        const pruebaResultado = {
            numero: numeroPrueba,
            nombre: nombrePrueba,
            sector: nombreSector || (pruebaDoc?.sector_id?.nombre_sector) || 'Desconocido',
            encontrada: pruebaExiste,
            sectorEncontrado: sectorExiste || !nombreSector,
            seCrearaSector: !sectorExiste && !!nombreSector,
            seCrearaPrueba: !pruebaExiste && !!nombreSector,
            pruebaDoc,
            sectorDoc,
            marcas: [],
            resumen: { totalMarcas: 0, validos: 0, invalidos: 0 }
        };

        // Solo error si no existe la prueba Y no podemos crearla (sin sector)
        if (!pruebaDoc && !nombreSector) {
            resultado.valido = false;
            resultado.errores.push({
                competicion: numeroCompeticion,
                prueba: numeroPrueba,
                error: `No se encontró la prueba: ${nombrePrueba}. Use el formato: Sector,Prueba para crear nuevas pruebas.`
            });
        }

        const sectorNombre = pruebaDoc?.sector_id?.nombre_sector || nombreSector || 'Desconocido';
        const esCombinada = sectorNombre === 'Combinadas';
        // Detectar si es prueba de relevos (contiene "relevo" o patrones como 4x100, 4x400, etc.)
        const esRelevo = /relevo|^\d+x\d+/i.test(nombrePrueba);
        // Permitir comentario en Combinadas y Relevos
        const permiteComentario = esCombinada || esRelevo;

        // Procesar marcas de esta prueba
        for (let i = 1; i < bloquePrueba.length; i++) {
            const linea = bloquePrueba[i];
            pruebaResultado.resumen.totalMarcas++;

            try {
                const campos = linea.split(',').map(s => s.trim());
                
                if (campos.length < 4) {
                    pruebaResultado.marcas.push({
                        valido: false,
                        error: `Formato inválido. Debe ser: Nombre,FechaNac,Genero,Marca${permiteComentario ? '[,Comentario]' : ''}`,
                        texto: linea
                    });
                    pruebaResultado.resumen.invalidos++;
                    continue;
                }

                const nombreAtleta = campos[0];
                const fechaNacStr = campos[1];
                const generoAbrev = campos[2].toUpperCase();
                const marcaStr = campos[3];
                const comentario = permiteComentario && campos.length > 4 ? campos[4] : null;

                // Convertir género
                let genero;
                if (generoAbrev === 'M' || generoAbrev === 'MASCULINO') {
                    genero = 'Masculino';
                } else if (generoAbrev === 'F' || generoAbrev === 'FEMENINO') {
                    genero = 'Femenino';
                } else {
                    pruebaResultado.marcas.push({
                        valido: false,
                        error: `Género inválido: ${generoAbrev}. Use M o F.`,
                        texto: linea
                    });
                    pruebaResultado.resumen.invalidos++;
                    continue;
                }

                // Parsear fecha de nacimiento
                let fechaNacimiento;
                try {
                    fechaNacimiento = parsearFecha(fechaNacStr);
                } catch (e) {
                    pruebaResultado.marcas.push({
                        valido: false,
                        error: `Fecha de nacimiento inválida: ${fechaNacStr}`,
                        texto: linea
                    });
                    pruebaResultado.resumen.invalidos++;
                    continue;
                }

                // Buscar atleta existente
                const atleta = await Atleta.findOne({ 
                    nombre: { $regex: new RegExp(`^${escapeRegex(nombreAtleta)}$`, 'i') },
                    fecha_nacimiento: fechaNacimiento
                });

                // Calcular categoría
                const categoria = await calcularCategoria(fechaNacimiento, fechaCompeticion);

                // Parsear la marca
                const marcaParsed = parsearMarca(marcaStr, sectorNombre);
                
                if (comentario) {
                    marcaParsed.comentario = comentario;
                }

                pruebaResultado.marcas.push({
                    valido: true,
                    atleta: nombreAtleta,
                    fechaNacimiento: fechaNacStr,
                    fechaNacimientoDate: fechaNacimiento,
                    genero,
                    atletaExiste: !!atleta,
                    atletaDoc: atleta,
                    categoria: categoria?.nombre_categoria || 'No calculada',
                    categoriaDoc: categoria,
                    marca: marcaStr,
                    marcaParsed,
                    comentario
                });
                pruebaResultado.resumen.validos++;

            } catch (err) {
                pruebaResultado.marcas.push({
                    valido: false,
                    error: err.message,
                    texto: linea
                });
                pruebaResultado.resumen.invalidos++;
            }
        }

        resultado.pruebas.push(pruebaResultado);
    }

    return resultado;
}

/**
 * POST /importar-csv
 * Importa marcas desde formato CSV con soporte para múltiples competiciones y pruebas
 * 
 * Formato esperado:
 * - 1 línea vacía = nueva prueba dentro de la misma competición
 * - 2+ líneas vacías = nueva competición
 * 
 * Estructura:
 * Línea 1: Lugar,Fecha,PC/AL
 * Línea 2: Nombre Prueba
 * Líneas siguientes: NombreAtleta,FechaNacimiento,Genero,Marca[,Comentario]
 * (línea vacía para nueva prueba)
 * Nombre Otra Prueba
 * Más atletas...
 * (dos líneas vacías para nueva competición)
 * 
 * Ejemplo:
 * Valencia,19/12/2025,PC
 * Longitud
 * Pablo García,05/04/2000,M,6.70
 * 
 * 100m
 * Juan Pérez,10/03/2007,M,11.45
 * 
 * 
 * Madrid,20/12/2025,AL
 * 200m
 * Ana García,22/09/2008,F,25.30
 */
router.post('/importar-csv', auth, async (req, res) => {
    try {
        const { csvData } = req.body;
        
        if (!csvData || typeof csvData !== 'string') {
            return res.status(400).json({ message: 'Se requiere csvData como string' });
        }

        // Dividir en competiciones y pruebas
        const competicionesLineas = dividirEnCompeticionesYPruebas(csvData);
        
        if (competicionesLineas.length === 0) {
            return res.status(400).json({ message: 'No se encontraron datos válidos en el CSV' });
        }

        const resultadosGlobales = [];
        const erroresGlobales = [];
        let totalMarcasCreadas = 0;
        let totalPruebasProcesadas = 0;
        let atletasCreados = 0;

        // FASE 1: Procesar todas las competiciones y recopilar datos
        const competicionesProcesadas = [];
        const atletasNuevosMap = new Map(); // Clave: "nombre|fechaNac|genero", Valor: datos del atleta

        for (let i = 0; i < competicionesLineas.length; i++) {
            const lineasCompeticion = competicionesLineas[i];
            const numeroCompeticion = i + 1;
            
            const competicionProcesada = await procesarCompeticion(lineasCompeticion, numeroCompeticion, false);
            competicionesProcesadas.push({ numeroCompeticion, competicionProcesada });
            
            if (!competicionProcesada.valido) {
                erroresGlobales.push(...competicionProcesada.errores);
                continue;
            }

            // Recopilar atletas nuevos de todas las pruebas
            for (const prueba of competicionProcesada.pruebas) {
                for (const marcaData of prueba.marcas) {
                    if (marcaData.valido && !marcaData.atletaDoc) {
                        // Generar clave única para el atleta
                        const fechaNacISO = marcaData.fechaNacimientoDate.toISOString();
                        const clave = `${marcaData.atleta.toLowerCase()}|${fechaNacISO}|${marcaData.genero}`;
                        
                        if (!atletasNuevosMap.has(clave)) {
                            atletasNuevosMap.set(clave, {
                                nombre: marcaData.atleta,
                                fecha_nacimiento: marcaData.fechaNacimientoDate,
                                genero: marcaData.genero
                            });
                        }
                    }
                }
            }
        }

        // FASE 2: Crear todos los atletas nuevos de una vez
        const atletasCreadosMap = new Map(); // Clave → documento atleta
        
        for (const [clave, datosAtleta] of atletasNuevosMap) {
            try {
                // Verificar una vez más que no exista (por si acaso)
                let atleta = await Atleta.findOne({
                    nombre: { $regex: new RegExp(`^${escapeRegex(datosAtleta.nombre)}$`, 'i') },
                    fecha_nacimiento: datosAtleta.fecha_nacimiento
                });
                
                if (!atleta) {
                    atleta = new Atleta(datosAtleta);
                    await atleta.save();
                    atletasCreados++;
                }
                
                atletasCreadosMap.set(clave, atleta);
            } catch (err) {
                erroresGlobales.push({
                    fase: 'creación de atleta',
                    atleta: datosAtleta.nombre,
                    error: err.message
                });
            }
        }

        // FASE 3: Crear todas las marcas
        for (const { numeroCompeticion, competicionProcesada } of competicionesProcesadas) {
            if (!competicionProcesada.valido) continue;

            const { cabecera } = competicionProcesada;

            for (const prueba of competicionProcesada.pruebas) {
                totalPruebasProcesadas++;
                
                // Solo verificar si pruebaDoc existe (puede haber sido creada durante el procesamiento)
                if (!prueba.pruebaDoc) {
                    erroresGlobales.push({
                        competicion: numeroCompeticion,
                        prueba: prueba.numero,
                        error: `Prueba no encontrada y no se pudo crear: ${prueba.nombre}. Use el formato: Sector,Prueba`
                    });
                    continue;
                }

                for (const marcaData of prueba.marcas) {
                    if (!marcaData.valido) {
                        erroresGlobales.push({
                            competicion: numeroCompeticion,
                            prueba: prueba.numero,
                            texto: marcaData.texto,
                            error: marcaData.error
                        });
                        continue;
                    }

                    try {
                        // Obtener atleta (existente o recién creado)
                        let atleta = marcaData.atletaDoc;
                        let atletaCreado = false;
                        
                        if (!atleta) {
                            const fechaNacISO = marcaData.fechaNacimientoDate.toISOString();
                            const clave = `${marcaData.atleta.toLowerCase()}|${fechaNacISO}|${marcaData.genero}`;
                            atleta = atletasCreadosMap.get(clave);
                            atletaCreado = true;
                            
                            if (!atleta) {
                                throw new Error('No se pudo encontrar o crear el atleta');
                            }
                        }

                        // Crear la marca
                        const nuevaMarca = new Marca({
                            nombre_atleta: atleta._id,
                            nombre_prueba: prueba.pruebaDoc._id,
                            horas: marcaData.marcaParsed.horas,
                            minutos: marcaData.marcaParsed.minutos,
                            segundos: marcaData.marcaParsed.segundos,
                            metros: marcaData.marcaParsed.metros,
                            puntos: marcaData.marcaParsed.puntos,
                            viento: marcaData.marcaParsed.viento,
                            comentario: marcaData.comentario || marcaData.marcaParsed.comentario,
                            lugar: cabecera.lugar,
                            categoria: marcaData.categoriaDoc?._id,
                            anyo: cabecera.fechaCompeticion.getFullYear(),
                            fecha_realizacion: cabecera.fecha,
                            PcAL: cabecera.pcAlDoc._id
                        });

                        await nuevaMarca.save();
                        totalMarcasCreadas++;

                        resultadosGlobales.push({
                            competicion: numeroCompeticion,
                            lugar: cabecera.lugar,
                            fecha: cabecera.fecha,
                            prueba: prueba.nombre,
                            atleta: marcaData.atleta,
                            atletaCreado,
                            categoria: marcaData.categoria,
                            marca: marcaData.marca,
                            comentario: marcaData.comentario,
                            marcaId: nuevaMarca._id
                        });

                        // =============== PROCESAR MARCAS INDIVIDUALES DE COMBINADAS ===============
                        const sectorNombre = prueba.pruebaDoc?.sector_id?.nombre_sector || '';
                        if (sectorNombre === 'Combinadas' && marcaData.comentario) {
                            const pcalTexto = cabecera.pcAlDoc?.PcAL || '';
                            const pcalNormalizado = pcalTexto.toUpperCase().includes('PISTA') ? 'PC' : 
                                                    pcalTexto.toUpperCase().includes('AIRE') ? 'AL' : pcalTexto.toUpperCase();
                            
                            const configCombinada = obtenerConfigCombinada(
                                prueba.nombre, 
                                marcaData.genero,
                                pcalNormalizado
                            );
                            
                            if (configCombinada) {
                                const marcasIndividuales = parsearMarcasCombinada(
                                    marcaData.comentario, 
                                    configCombinada.pruebas
                                );
                                
                                let marcasIndivCreadas = 0;
                                for (const marcaIndiv of marcasIndividuales) {
                                    if (!marcaIndiv || !marcaIndiv.pruebaConfig) continue;
                                    
                                    try {
                                        // El nombre ya incluye la especificación: "Peso(4kg)", "110mv(1.06)", etc.
                                        const nombrePrueba = marcaIndiv.pruebaConfig.nombre;
                                        
                                        // Buscar la prueba individual en la BD
                                        let pruebaIndivDoc = await Prueba.findOne({
                                            nombre_prueba: { $regex: new RegExp(`^${escapeRegex(nombrePrueba)}$`, 'i') }
                                        }).populate('sector_id');
                                        
                                        // Búsqueda más flexible si no encuentra
                                        if (!pruebaIndivDoc) {
                                            pruebaIndivDoc = await Prueba.findOne({
                                                nombre_prueba: { $regex: new RegExp(escapeRegex(nombrePrueba), 'i') }
                                            }).populate('sector_id');
                                        }
                                        
                                        if (pruebaIndivDoc) {
                                            const nuevaMarcaIndiv = new Marca({
                                                nombre_atleta: atleta._id,
                                                nombre_prueba: pruebaIndivDoc._id,
                                                horas: marcaIndiv.horas,
                                                minutos: marcaIndiv.minutos,
                                                segundos: marcaIndiv.segundos,
                                                metros: marcaIndiv.metros,
                                                viento: marcaIndiv.viento,
                                                comentario: `De ${prueba.nombre}`,
                                                lugar: cabecera.lugar,
                                                categoria: marcaData.categoriaDoc?._id,
                                                anyo: cabecera.fechaCompeticion.getFullYear(),
                                                fecha_realizacion: cabecera.fecha,
                                                PcAL: cabecera.pcAlDoc._id
                                            });
                                            
                                            await nuevaMarcaIndiv.save();
                                            totalMarcasCreadas++;
                                            marcasIndivCreadas++;
                                        }
                                    } catch (errIndiv) {
                                        // Error no crítico, continuar con las demás marcas
                                        console.warn(`Error creando marca individual ${marcaIndiv.pruebaConfig?.nombre}: ${errIndiv.message}`);
                                    }
                                }
                                
                                if (marcasIndivCreadas > 0) {
                                    resultadosGlobales.push({
                                        competicion: numeroCompeticion,
                                        lugar: cabecera.lugar,
                                        fecha: cabecera.fecha,
                                        prueba: `${prueba.nombre} (marcas individuales)`,
                                        atleta: marcaData.atleta,
                                        atletaCreado: false,
                                        categoria: marcaData.categoria,
                                        marca: `${marcasIndivCreadas} marcas creadas`,
                                        comentario: marcaData.comentario
                                    });
                                }
                            }
                        }
                        // =============== FIN PROCESAR MARCAS INDIVIDUALES ===============

                    } catch (err) {
                        erroresGlobales.push({
                            competicion: numeroCompeticion,
                            prueba: prueba.numero,
                            atleta: marcaData.atleta,
                            error: err.message
                        });
                    }
                }
            }
        }

        res.status(201).json({
            message: `Importación completada. ${totalMarcasCreadas} marcas creadas, ${atletasCreados} atletas nuevos, ${erroresGlobales.length} errores.`,
            resumen: {
                competicionesProcesadas: competicionesLineas.length,
                pruebasProcesadas: totalPruebasProcesadas,
                totalMarcasCreadas,
                atletasCreados,
                totalErrores: erroresGlobales.length
            },
            resultados: resultadosGlobales,
            errores: erroresGlobales
        });

    } catch (err) {
        console.error('Error en importación CSV:', err);
        res.status(500).json({ message: err.message });
    }
});

/**
 * POST /previsualizar-csv
 * Previsualiza la importación sin guardar en BD - soporta múltiples competiciones y pruebas
 */
router.post('/previsualizar-csv', auth, async (req, res) => {
    try {
        const { csvData } = req.body;
        
        if (!csvData || typeof csvData !== 'string') {
            return res.status(400).json({ message: 'Se requiere csvData como string' });
        }

        // Dividir en competiciones y pruebas
        const competicionesLineas = dividirEnCompeticionesYPruebas(csvData);
        
        if (competicionesLineas.length === 0) {
            return res.status(400).json({ message: 'No se encontraron datos válidos en el CSV' });
        }

        const competicionesPrevisualizadas = [];
        let totalValidos = 0;
        let totalInvalidos = 0;
        let totalPruebas = 0;

        // Procesar cada competición
        for (let i = 0; i < competicionesLineas.length; i++) {
            const lineasCompeticion = competicionesLineas[i];
            const numeroCompeticion = i + 1;
            
            const competicionProcesada = await procesarCompeticion(lineasCompeticion, numeroCompeticion, true);
            
            // Calcular totales
            for (const prueba of competicionProcesada.pruebas) {
                totalValidos += prueba.resumen.validos;
                totalInvalidos += prueba.resumen.invalidos;
                totalPruebas++;
            }
            
            // Limpiar datos internos antes de enviar
            const pruebasLimpias = competicionProcesada.pruebas.map(prueba => ({
                numero: prueba.numero,
                nombre: prueba.nombre,
                encontrada: prueba.encontrada,
                sector: prueba.sector,
                sectorEncontrado: prueba.sectorEncontrado,
                seCrearaSector: prueba.seCrearaSector,
                seCrearaPrueba: prueba.seCrearaPrueba,
                resumen: prueba.resumen,
                marcas: prueba.marcas.map(m => ({
                    valido: m.valido,
                    atleta: m.atleta,
                    fechaNacimiento: m.fechaNacimiento,
                    genero: m.genero,
                    atletaExiste: m.atletaExiste,
                    categoria: m.categoria,
                    marca: m.marca,
                    comentario: m.comentario,
                    marcaParsed: m.marcaParsed,
                    error: m.error,
                    texto: m.texto
                }))
            }));

            competicionesPrevisualizadas.push({
                numero: numeroCompeticion,
                valido: competicionProcesada.valido,
                cabecera: competicionProcesada.cabecera ? {
                    lugar: competicionProcesada.cabecera.lugar,
                    fecha: competicionProcesada.cabecera.fecha,
                    pcAL: competicionProcesada.cabecera.pcAL,
                    pcALValido: competicionProcesada.cabecera.pcALValido
                } : null,
                pruebas: pruebasLimpias,
                errores: competicionProcesada.errores
            });
        }

        res.json({
            totalCompeticiones: competicionesLineas.length,
            totalPruebas,
            resumenGlobal: {
                totalMarcas: totalValidos + totalInvalidos,
                validos: totalValidos,
                invalidos: totalInvalidos
            },
            competiciones: competicionesPrevisualizadas
        });

    } catch (err) {
        console.error('Error en previsualización CSV:', err);
        res.status(500).json({ message: err.message });
    }
});

// GET lugares únicos de las marcas existentes con su PC/AL más frecuente
router.get('/lugares', async (req, res) => {
    try {
        // Agregación para obtener lugares únicos con conteo de PC/AL
        const lugaresAgrupados = await Marca.aggregate([
            {
                $match: { lugar: { $ne: null, $ne: '' } }
            },
            {
                $lookup: {
                    from: 'pcals',
                    localField: 'PcAL',
                    foreignField: '_id',
                    as: 'pcalInfo'
                }
            },
            {
                $unwind: '$pcalInfo'
            },
            {
                $group: {
                    _id: {
                        lugar: '$lugar',
                        pcAL: '$pcalInfo.PcAL'
                    },
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { count: -1 }
            },
            {
                $group: {
                    _id: '$_id.lugar',
                    variantes: {
                        $push: {
                            pcAL: '$_id.pcAL',
                            count: '$count'
                        }
                    },
                    totalMarcas: { $sum: '$count' }
                }
            },
            {
                $project: {
                    _id: 0,
                    nombre: '$_id',
                    pcAL: { $arrayElemAt: ['$variantes.pcAL', 0] }, // El más frecuente (ya ordenado)
                    totalMarcas: 1,
                    variantes: 1
                }
            },
            {
                $sort: { totalMarcas: -1 }
            }
        ]);

        res.json(lugaresAgrupados);
    } catch (err) {
        console.error('Error al obtener lugares:', err);
        res.status(500).json({ message: err.message });
    }
});

// GET all marcas
router.get('/', async (req, res) => {
    try {
        const marcas = await Marca.find().populate('nombre_atleta nombre_prueba categoria');
        res.json(marcas);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// GET todas las marcas de un atleta en una prueba específica
router.get('/atleta/:atletaId/prueba/:pruebaId', async (req, res) => {
    try {
        const { atletaId, pruebaId } = req.params;
        const marcas = await Marca.find({
            nombre_atleta: atletaId,
            nombre_prueba: pruebaId
        }).populate('nombre_atleta nombre_prueba categoria PcAL');
        
        res.json(marcas);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// GET todas las marcas para una prueba
router.get('/prueba/:pruebaId', async (req, res) => {
    try {
        const { pruebaId } = req.params;
        const marcas = await Marca.find({
            nombre_prueba: pruebaId
        }).populate('nombre_atleta nombre_prueba categoria PcAL');
        
        res.json(marcas);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

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
router.post('/', auth, async (req, res) => {
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
        fecha_realizacion: req.body.fecha_realizacion,
        PcAL: req.body.PcAL,
    });
    try {
        const newMarca = await marca.save();
        res.status(201).json(newMarca);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Actualizar una marca
router.put('/:id', auth, async (req, res) => {
    try {
        const marca = await Marca.findById(req.params.id);
        if (!marca) return res.status(404).json({ message: 'Marca no encontrada' });

        // Actualizar campos
        Object.assign(marca, req.body);
        await marca.save();

        res.json(marca);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});


// DELETE all marcas
router.delete('/', auth, async (req, res) => {
    try {
        await Marca.deleteMany({});
        res.json({ message: 'Todas las marcas eliminadas' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// DELETE marca by ID
router.delete('/:id', auth, async (req, res) => {
    try {
        const marca = await Marca.findByIdAndDelete(req.params.id);
        if (!marca) return res.status(404).json({ message: 'Marca no encontrada' });
        res.json({ message: 'Marca eliminada' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});


module.exports = router;
