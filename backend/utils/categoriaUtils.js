const Categoria = require('../models/ranking/Categoria');

/**
 * Obtiene el año de temporada atlética para una fecha dada.
 * La temporada atlética va del 1 de diciembre al 30 de noviembre.
 * Ejemplo: 15/03/2025 → temporada 2025
 *          05/12/2024 → temporada 2025 (diciembre pertenece a la siguiente temporada)
 * 
 * @param {Date} fecha - Fecha de la competición
 * @returns {number} - Año de la temporada atlética
 */
function obtenerTemporada(fecha) {
    const mes = fecha.getMonth(); // 0-11 (0 = enero, 11 = diciembre)
    const anyo = fecha.getFullYear();
    
    // Si es diciembre (mes 11), pertenece a la temporada del año siguiente
    if (mes === 11) {
        return anyo + 1;
    }
    return anyo;
}

/**
 * Calcula la edad exacta de un atleta en una fecha específica.
 * 
 * @param {Date} fechaNacimiento - Fecha de nacimiento del atleta
 * @param {Date} fechaCompeticion - Fecha de la competición
 * @returns {number} - Edad en años cumplidos
 */
function calcularEdadExacta(fechaNacimiento, fechaCompeticion) {
    let edad = fechaCompeticion.getFullYear() - fechaNacimiento.getFullYear();
    const mesNac = fechaNacimiento.getMonth();
    const diaNac = fechaNacimiento.getDate();
    const mesComp = fechaCompeticion.getMonth();
    const diaComp = fechaCompeticion.getDate();
    
    // Si aún no ha cumplido años en el año de la competición
    if (mesComp < mesNac || (mesComp === mesNac && diaComp < diaNac)) {
        edad--;
    }
    
    return edad;
}

/**
 * Calcula la categoría de un atleta basándose en su fecha de nacimiento
 * y la fecha de la competición.
 * 
 * Reglas:
 * - Categorías de formación (Sub10 a Absoluto): Por año de nacimiento y temporada atlética
 * - Categorías Master (M35, M40...): Por edad exacta en la fecha de competición
 * 
 * @param {Date} fechaNacimiento - Fecha de nacimiento del atleta
 * @param {Date} fechaCompeticion - Fecha de la competición
 * @returns {Promise<Object|null>} - Categoría encontrada o null
 */
async function calcularCategoria(fechaNacimiento, fechaCompeticion) {
    const anyoNacimiento = fechaNacimiento.getFullYear();
    const temporada = obtenerTemporada(fechaCompeticion);
    const edadExacta = calcularEdadExacta(fechaNacimiento, fechaCompeticion);
    
    // Edad "de temporada" = diferencia entre temporada y año de nacimiento
    const edadTemporada = temporada - anyoNacimiento;
    
    console.log(`[Categoría] Atleta nacido ${anyoNacimiento}, Competición temporada ${temporada}, Edad temporada: ${edadTemporada}, Edad exacta: ${edadExacta}`);
    
    // Primero verificamos si es categoría Master (35 años o más por edad exacta)
    if (edadExacta >= 35) {
        // Buscar la categoría master correspondiente
        const categoriasMaster = await Categoria.find({ tipo: 'master' }).sort({ edad_min: -1 });
        
        for (const cat of categoriasMaster) {
            if (cat.edad_min && edadExacta >= cat.edad_min && (!cat.edad_max || edadExacta <= cat.edad_max)) {
                console.log(`[Categoría] → Master: ${cat.nombre_categoria}`);
                return cat;
            }
        }
    }
    
    // Si no es Master, buscamos categoría de formación por edad de temporada
    // Ordenamos de menor a mayor edad para encontrar la categoría más joven que aplique
    const categoriasFormacion = await Categoria.find({ 
        tipo: 'formacion',
        offset_edad_min: { $exists: true, $ne: null },
        offset_edad_max: { $exists: true, $ne: null }
    }).sort({ offset_edad_min: 1 });
    
    console.log(`[Categoría] Categorías de formación encontradas: ${categoriasFormacion.length}`);
    
    for (const cat of categoriasFormacion) {
        // offset_edad_min y offset_edad_max representan el rango de edades de temporada
        // Ejemplo: Sub18 tiene offset_edad_min=16, offset_edad_max=17
        // Significa atletas de 16-17 años de edad de temporada
        
        if (edadTemporada >= cat.offset_edad_min && edadTemporada <= cat.offset_edad_max) {
            console.log(`[Categoría] → Formación: ${cat.nombre_categoria} (rango ${cat.offset_edad_min}-${cat.offset_edad_max})`);
            return cat;
        }
    }
    
    // Si no encaja en ninguna categoría de formación específica
    // Podría ser muy joven (menor de Sub10) o estar entre categorías
    console.log(`[Categoría] → No encontrada categoría para edad temporada ${edadTemporada}, buscando Absoluto`);
    const absoluto = await Categoria.findOne({ nombre_categoria: 'Absoluto' });
    return absoluto;
}

/**
 * Parsea una fecha en formato DD/MM/YYYY
 * 
 * @param {string} fechaStr - Fecha en formato DD/MM/YYYY
 * @returns {Date} - Objeto Date
 */
function parsearFecha(fechaStr) {
    const partes = fechaStr.split('/');
    if (partes.length !== 3) {
        throw new Error(`Formato de fecha inválido: ${fechaStr}. Use DD/MM/YYYY`);
    }
    const dia = parseInt(partes[0], 10);
    const mes = parseInt(partes[1], 10) - 1; // Meses en JS son 0-11
    const anyo = parseInt(partes[2], 10);
    
    return new Date(anyo, mes, dia);
}

/**
 * Inicializa las categorías en la base de datos si no existen.
 * Esto debería ejecutarse una vez al configurar el sistema.
 */
async function inicializarCategorias() {
    const categoriasExistentes = await Categoria.countDocuments();
    
    if (categoriasExistentes > 0) {
        console.log('Las categorías ya están inicializadas');
        return;
    }
    
    const categoriasFormacion = [
        { nombre_categoria: 'Sub10', tipo: 'formacion', offset_edad_min: 8, offset_edad_max: 9, orden: 1 },
        { nombre_categoria: 'Sub12', tipo: 'formacion', offset_edad_min: 10, offset_edad_max: 11, orden: 2 },
        { nombre_categoria: 'Sub14', tipo: 'formacion', offset_edad_min: 12, offset_edad_max: 13, orden: 3 },
        { nombre_categoria: 'Sub16', tipo: 'formacion', offset_edad_min: 14, offset_edad_max: 15, orden: 4 },
        { nombre_categoria: 'Sub18', tipo: 'formacion', offset_edad_min: 16, offset_edad_max: 17, orden: 5 },
        { nombre_categoria: 'Sub20', tipo: 'formacion', offset_edad_min: 18, offset_edad_max: 19, orden: 6 },
        { nombre_categoria: 'Sub23', tipo: 'formacion', offset_edad_min: 20, offset_edad_max: 22, orden: 7 },
        { nombre_categoria: 'Absoluto', tipo: 'formacion', offset_edad_min: 23, offset_edad_max: 34, orden: 8 },
    ];
    
    const categoriasMaster = [
        { nombre_categoria: 'M35', tipo: 'master', edad_min: 35, edad_max: 39, orden: 9 },
        { nombre_categoria: 'M40', tipo: 'master', edad_min: 40, edad_max: 44, orden: 10 },
        { nombre_categoria: 'M45', tipo: 'master', edad_min: 45, edad_max: 49, orden: 11 },
        { nombre_categoria: 'M50', tipo: 'master', edad_min: 50, edad_max: 54, orden: 12 },
        { nombre_categoria: 'M55', tipo: 'master', edad_min: 55, edad_max: 59, orden: 13 },
        { nombre_categoria: 'M60', tipo: 'master', edad_min: 60, edad_max: 64, orden: 14 },
        { nombre_categoria: 'M65', tipo: 'master', edad_min: 65, edad_max: 69, orden: 15 },
        { nombre_categoria: 'M70', tipo: 'master', edad_min: 70, edad_max: 74, orden: 16 },
        { nombre_categoria: 'M75', tipo: 'master', edad_min: 75, edad_max: 79, orden: 17 },
        { nombre_categoria: 'M80', tipo: 'master', edad_min: 80, edad_max: 84, orden: 18 },
        { nombre_categoria: 'M85', tipo: 'master', edad_min: 85, edad_max: 89, orden: 19 },
        { nombre_categoria: 'M90', tipo: 'master', edad_min: 90, edad_max: null, orden: 20 },
    ];
    
    await Categoria.insertMany([...categoriasFormacion, ...categoriasMaster]);
    console.log('Categorías inicializadas correctamente');
}

module.exports = {
    obtenerTemporada,
    calcularEdadExacta,
    calcularCategoria,
    parsearFecha,
    inicializarCategorias
};
