/**
 * Configuración de pruebas combinadas
 * 
 * Cada combinada tiene:
 * - pruebas: Array de pruebas en orden, con nombre y opcionalmente peso/altura de vallas
 * - pruebasConViento: Array de nombres de pruebas que pueden tener medición de viento
 * 
 * Formato del comentario de marcas individuales:
 * Marca/Marca(viento)/Marca/...
 * 
 * Las pruebas que pueden tener viento son:
 * - Carreras de 200m o menos (60ml, 80ml, 100ml, 200ml)
 * - Vallas de 200m o menos (60mv, 80mv, 100mv, 110mv)
 * - Longitud y Triple
 */

const COMBINADAS_CONFIG = {
    // ================== DECATHLON ==================
    'DecatlonM': {
        genero: 'Masculino',
        pcal: 'AL',
        pruebas: [
            { nombre: '100ml' },
            { nombre: 'Longitud' },
            { nombre: 'Peso(7.260kg)' },
            { nombre: 'Altura' },
            { nombre: '400ml' },
            { nombre: '110mv(1.06)' },
            { nombre: 'Disco(2kg)' },
            { nombre: 'Pertiga' },
            { nombre: 'Jabalina(800g)' },
            { nombre: '1500ml' }
        ]
    },
    'DecatlonM Sub20': {
        genero: 'Masculino',
        pcal: 'AL',
        pruebas: [
            { nombre: '100ml' },
            { nombre: 'Longitud' },
            { nombre: 'Peso(5kg)' },
            { nombre: 'Altura' },
            { nombre: '400ml' },
            { nombre: '100mv(0.91)' },
            { nombre: 'Disco(1kg)' },
            { nombre: 'Pertiga' },
            { nombre: 'Jabalina(700g)' },
            { nombre: '1500ml' }
        ]
    },
    'DecatlonM Sub18': {
        genero: 'Masculino',
        pcal: 'AL',
        pruebas: [
            { nombre: '100ml' },
            { nombre: 'Longitud' },
            { nombre: 'Peso(5kg)' },
            { nombre: 'Altura' },
            { nombre: '400ml' },
            { nombre: '100mv(0.91)' },
            { nombre: 'Disco(1kg)' },
            { nombre: 'Pertiga' },
            { nombre: 'Jabalina(700g)' },
            { nombre: '1500ml' }
        ]
    },

    // ================== OCTATLON ==================
    'OctatlonM Sub16': {
        genero: 'Masculino',
        pcal: 'AL',
        pruebas: [
            { nombre: '100ml' },
            { nombre: 'Peso(4kg)' },
            { nombre: 'Altura' },
            { nombre: 'Disco(1kg)' },
            { nombre: '100mv(0.91)' },
            { nombre: 'Pertiga' },
            { nombre: '1000ml' }
        ]
    },

    // ================== HEPTATLON MASCULINO (Pista Cubierta) ==================
    'HeptatlonM': {
        genero: 'Masculino',
        pcal: 'PC',
        pruebas: [
            { nombre: '60ml' },
            { nombre: 'Longitud' },
            { nombre: 'Peso(7.260kg)' },
            { nombre: 'Altura' },
            { nombre: '60mv(1.06)' },
            { nombre: 'Pertiga' },
            { nombre: '1000ml' }
        ]
    },
    'HeptatlonM Sub20': {
        genero: 'Masculino',
        pcal: 'PC',
        pruebas: [
            { nombre: '60ml' },
            { nombre: 'Longitud' },
            { nombre: 'Peso(5kg)' },
            { nombre: 'Altura' },
            { nombre: '60mv(0.91)' },
            { nombre: 'Pertiga' },
            { nombre: '1000ml' }
        ]
    },
    'HeptatlonM Sub18': {
        genero: 'Masculino',
        pcal: 'PC',
        pruebas: [
            { nombre: '60ml' },
            { nombre: 'Longitud' },
            { nombre: 'Peso(5kg)' },
            { nombre: 'Altura' },
            { nombre: '60mv(0.91)' },
            { nombre: 'Pertiga' },
            { nombre: '1000ml' }
        ]
    },

    // ================== HEPTATLON FEMENINO (Aire Libre) ==================
    'HeptatlonF': {
        genero: 'Femenino',
        pcal: 'AL',
        pruebas: [
            { nombre: '100mv(0.84)' },
            { nombre: 'Altura' },
            { nombre: 'Peso(4kg)' },
            { nombre: '200ml' },
            { nombre: 'Longitud' },
            { nombre: 'Jabalina(600g)' },
            { nombre: '800ml' }
        ]
    },
    'HeptatlonF Sub18': {
        genero: 'Femenino',
        pcal: 'AL',
        pruebas: [
            { nombre: '100mv(0.76)' },
            { nombre: 'Altura' },
            { nombre: 'Peso(3kg)' },
            { nombre: '200ml' },
            { nombre: 'Longitud' },
            { nombre: 'Jabalina(500g)' },
            { nombre: '800ml' }
        ]
    },

    // ================== HEXATLON ==================
    'HexatlonM Sub16': {
        genero: 'Masculino',
        pcal: 'PC',
        pruebas: [
            { nombre: '60ml' },
            { nombre: 'Longitud' },
            { nombre: 'Peso(4kg)' },
            { nombre: 'Altura' },
            { nombre: '60mv(0.91)' },
            { nombre: '1000ml' }
        ]
    },
    'HexatlonM Sub14': {
        genero: 'Masculino',
        pcal: 'AL',
        pruebas: [
            { nombre: '80ml' },
            { nombre: 'Longitud' },
            { nombre: 'Peso(3kg)' },
            { nombre: '80mv(0.76)' },
            { nombre: 'Altura' },
            { nombre: 'Jabalina(400g)' }
        ]
    },
    'HexatlonF Sub16': {
        genero: 'Femenino',
        pcal: 'AL',
        pruebas: [
            { nombre: '100mv(0.76)' },
            { nombre: 'Altura' },
            { nombre: 'Peso(3kg)' },
            { nombre: 'Longitud' },
            { nombre: 'Jabalina(500g)' },
            { nombre: '600ml' }
        ]
    },

    // ================== PENTATLON ==================
    'PentatlonF': {
        genero: 'Femenino',
        pcal: 'PC',
        pruebas: [
            { nombre: '60mv(0.84)' },
            { nombre: 'Altura' },
            { nombre: 'Peso(4kg)' },
            { nombre: 'Longitud' },
            { nombre: '800ml' }
        ]
    },
    'PentatlonF Sub18': {
        genero: 'Femenino',
        pcal: 'PC',
        pruebas: [
            { nombre: '60mv(0.76)' },
            { nombre: 'Altura' },
            { nombre: 'Peso(3kg)' },
            { nombre: 'Longitud' },
            { nombre: '800ml' }
        ]
    },
    'PentatlonF Sub16': {
        genero: 'Femenino',
        pcal: 'AL',
        pruebas: [
            { nombre: '60mv(0.76)' },
            { nombre: 'Altura' },
            { nombre: 'Peso(3kg)' },
            { nombre: 'Longitud' },
            { nombre: '600ml' }
        ]
    },
    'PentatlonM Sub14': {
        genero: 'Masculino',
        pcal: 'PC',
        pruebas: [
            { nombre: '60ml' },
            { nombre: 'Longitud' },
            { nombre: 'Peso(3kg)' },
            { nombre: 'Altura' },
            { nombre: '60mv(0.84)' }
        ]
    },

    // ================== TETRATLON ==================
    'TetratlonF Sub14': {
        genero: 'Femenino',
        pcal: 'PC',
        pruebas: [
            { nombre: '60mv(0.76)' },
            { nombre: 'Peso(3kg)' },
            { nombre: 'Longitud' },
            { nombre: '60ml' }
        ]
    }
};

// Pruebas que pueden tener medición de viento (200m o menos, vallas de 200m o menos, y saltos horizontales)
const PRUEBAS_CON_VIENTO = [
    '60ml', '80ml', '100ml', '200ml',
    '60mv', '80mv', '100mv', '110mv',
    'Longitud', 'Triple'
];

/**
 * Obtiene la configuración de una combinada por nombre de prueba
 * Busca coincidencia parcial para soportar variantes de nombres
 * @param {string} nombrePrueba - Nombre de la prueba combinada
 * @param {string} genero - Género del atleta (Masculino/Femenino)
 * @param {string} pcal - Tipo PC/AL
 * @returns {Object|null} - Configuración de la combinada o null
 */
function obtenerConfigCombinada(nombrePrueba, genero, pcal) {
    const nombreNormalizado = nombrePrueba.toLowerCase().replace(/\s+/g, ' ').trim();
    
    // Buscar coincidencia exacta primero
    for (const [nombre, config] of Object.entries(COMBINADAS_CONFIG)) {
        const nombreConfigNorm = nombre.toLowerCase().replace(/\s+/g, ' ').trim();
        if (nombreNormalizado === nombreConfigNorm) {
            // Verificar género y PC/AL si están especificados
            if (config.genero === genero || !genero) {
                if (!pcal || config.pcal === pcal.toUpperCase()) {
                    return { nombre, ...config };
                }
            }
        }
    }
    
    // Buscar coincidencia parcial
    for (const [nombre, config] of Object.entries(COMBINADAS_CONFIG)) {
        const nombreConfigNorm = nombre.toLowerCase().replace(/\s+/g, ' ').trim();
        if (nombreNormalizado.includes(nombreConfigNorm) || nombreConfigNorm.includes(nombreNormalizado)) {
            if (config.genero === genero || !genero) {
                if (!pcal || config.pcal === pcal.toUpperCase()) {
                    return { nombre, ...config };
                }
            }
        }
    }
    
    return null;
}

/**
 * Parsea el comentario de una combinada y extrae las marcas individuales
 * Formato: Marca/Marca(viento)/Marca/...
 * 
 * @param {string} comentario - Comentario con las marcas separadas por /
 * @param {Array} pruebasConfig - Array de configuración de pruebas de la combinada
 * @returns {Array} - Array de objetos con la marca parseada para cada prueba
 */
function parsearMarcasCombinada(comentario, pruebasConfig) {
    if (!comentario || !pruebasConfig) {
        return [];
    }
    
    // Separar por /
    const marcasTexto = comentario.split('/').map(m => m.trim());
    const resultado = [];
    
    for (let i = 0; i < pruebasConfig.length && i < marcasTexto.length; i++) {
        const pruebaConfig = pruebasConfig[i];
        const marcaTexto = marcasTexto[i];
        
        if (!marcaTexto) {
            resultado.push(null);
            continue;
        }
        
        const marcaParsed = parsearMarcaIndividual(marcaTexto, pruebaConfig.nombre);
        marcaParsed.pruebaConfig = pruebaConfig;
        resultado.push(marcaParsed);
    }
    
    return resultado;
}

/**
 * Parsea una marca individual de combinada
 * Formatos soportados:
 * - "11.23" (tiempo en segundos)
 * - "11.23(+1.5)" o "11.23(-0.3)" (tiempo con viento)
 * - "1:23.45" (minutos:segundos)
 * - "6.85" (metros para saltos/lanzamientos)
 * - "6.85(+1.2)" (metros con viento para longitud/triple)
 * 
 * @param {string} marcaTexto - Texto de la marca
 * @param {string} nombrePrueba - Nombre de la prueba para determinar el tipo
 * @returns {Object} - Objeto con la marca parseada
 */
function parsearMarcaIndividual(marcaTexto, nombrePrueba) {
    const resultado = {
        horas: null,
        minutos: null,
        segundos: null,
        metros: null,
        viento: null,
        textoOriginal: marcaTexto
    };
    
    // Extraer viento si existe (formato: valor(viento) o valor (+viento))
    let textoSinViento = marcaTexto;
    const regexViento = /\(([+-]?\d+[.,]?\d*)\)$/;
    const matchViento = marcaTexto.match(regexViento);
    
    if (matchViento) {
        resultado.viento = parseFloat(matchViento[1].replace(',', '.'));
        textoSinViento = marcaTexto.replace(regexViento, '').trim();
    }
    
    // Determinar si es tiempo o metros según la prueba
    const pruebasMetros = ['Longitud', 'Triple', 'Altura', 'Pertiga', 'Peso', 'Disco', 'Jabalina', 'Martillo', 'Bala'];
    const esMetros = pruebasMetros.some(p => nombrePrueba.toLowerCase().includes(p.toLowerCase()));
    
    if (esMetros) {
        // Metros
        resultado.metros = parseFloat(textoSinViento.replace(',', '.'));
    } else {
        // Tiempo
        const partesTiempo = textoSinViento.split(':');
        
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
 * Verifica si una prueba puede tener medición de viento
 * @param {string} nombrePrueba - Nombre de la prueba
 * @returns {boolean} - True si puede tener viento
 */
function pruebaAdmiteViento(nombrePrueba) {
    const nombreNorm = nombrePrueba.toLowerCase();
    return PRUEBAS_CON_VIENTO.some(p => nombreNorm.includes(p.toLowerCase()));
}

module.exports = {
    COMBINADAS_CONFIG,
    PRUEBAS_CON_VIENTO,
    obtenerConfigCombinada,
    parsearMarcasCombinada,
    parsearMarcaIndividual,
    pruebaAdmiteViento
};
