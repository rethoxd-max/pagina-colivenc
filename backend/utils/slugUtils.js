/**
 * Utilidades para generar y manejar slugs
 */

/**
 * Genera un slug a partir de un texto
 * @param {string} texto - El texto a convertir en slug
 * @returns {string} - El slug generado
 */
function generarSlug(texto) {
    if (!texto) return '';
    
    return texto
        .toString()
        .toLowerCase()
        .trim()
        // Reemplazar caracteres acentuados
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        // Reemplazar ñ por n
        .replace(/ñ/g, 'n')
        // Reemplazar espacios por guiones
        .replace(/\s+/g, '-')
        // Eliminar caracteres especiales excepto guiones
        .replace(/[^a-z0-9-]/g, '')
        // Eliminar guiones múltiples
        .replace(/-+/g, '-')
        // Eliminar guiones al inicio y al final
        .replace(/^-+|-+$/g, '');
}

/**
 * Genera un slug único verificando en la base de datos
 * @param {string} texto - El texto base para el slug
 * @param {Object} Model - El modelo de Mongoose para verificar duplicados
 * @param {string} [excludeId] - ID a excluir de la búsqueda (para actualizaciones)
 * @returns {Promise<string>} - El slug único generado
 */
async function generarSlugUnico(texto, Model, excludeId = null) {
    const slugBase = generarSlug(texto);
    let slug = slugBase;
    let contador = 1;
    
    while (true) {
        const query = { slug };
        if (excludeId) {
            query._id = { $ne: excludeId };
        }
        
        const existente = await Model.findOne(query);
        if (!existente) {
            break;
        }
        
        // Si existe, añadir un sufijo numérico
        slug = `${slugBase}-${contador}`;
        contador++;
    }
    
    return slug;
}

module.exports = {
    generarSlug,
    generarSlugUnico
};
