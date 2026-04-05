const { google } = require('googleapis');

// Autenticación con cuenta de servicio (método moderno GoogleAuth)
function getSheetsClient() {
    const privateKey = (process.env['GOOGLE_PRIVATE_KEY'] || '').replace(/\\n/g, '\n');
    const auth = new google.auth.GoogleAuth({
        credentials: {
            client_email: process.env['GOOGLE_SERVICE_ACCOUNT_EMAIL'],
            private_key: privateKey,
        },
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
    return google.sheets({ version: 'v4', auth });
}

/**
 * Obtiene o crea una pestaña (hoja) dentro de un spreadsheet.
 * Devuelve el sheetId numérico.
 */
async function getOrCreateSheet(spreadsheetId, sheetTitle) {
    const sheets = getSheetsClient();
    const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId });
    const existing = spreadsheet.data.sheets.find(
        s => s.properties.title === sheetTitle
    );

    if (existing) {
        return existing.properties.sheetId;
    }

    // Crear la pestaña
    const response = await sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: {
            requests: [{
                addSheet: {
                    properties: { title: sheetTitle }
                }
            }]
        }
    });

    return response.data.replies[0].addSheet.properties.sheetId;
}

/**
 * Verifica si una pestaña tiene encabezados, y si no, los añade.
 */
async function ensureHeaders(spreadsheetId, sheetTitle, headers) {
    const sheets = getSheetsClient();
    const range = `'${sheetTitle}'!A1:${String.fromCharCode(64 + headers.length)}1`;

    const result = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range
    });

    if (!result.data.values || result.data.values.length === 0) {
        await sheets.spreadsheets.values.update({
            spreadsheetId,
            range,
            valueInputOption: 'RAW',
            requestBody: {
                values: [headers]
            }
        });
    }
}

/**
 * Recrea las reglas de formato condicional en la pestaña de compras:
 * - Encargado = "Sí"  → fila en verde
 * - Encargado = "No"  → fila en amarillo
 * Borra siempre las reglas existentes para garantizar que la fórmula es correcta.
 */
async function ensureConditionalFormatting(spreadsheetId, sheetId) {
    const sheets = getSheetsClient();

    // Eliminar reglas de formato condicional existentes en esta hoja
    const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId });
    const sheetData = spreadsheet.data.sheets.find(s => s.properties.sheetId === sheetId);

    if (sheetData && sheetData.conditionalFormats && sheetData.conditionalFormats.length > 0) {
        const deleteRequests = [];
        for (let i = sheetData.conditionalFormats.length - 1; i >= 0; i--) {
            deleteRequests.push({
                deleteConditionalFormatRule: { sheetId, index: i }
            });
        }
        await sheets.spreadsheets.batchUpdate({
            spreadsheetId,
            requestBody: { requests: deleteRequests }
        });
    }

    const range = {
        sheetId,
        startRowIndex: 1,      // fila 2 en adelante (0-based)
        endRowIndex: 10000,
        startColumnIndex: 0,
        endColumnIndex: 11     // columnas A-K
    };

    await sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: {
            requests: [
                // Dropdown Sí / No en columna K
                {
                    setDataValidation: {
                        range: {
                            sheetId,
                            startRowIndex: 1,
                            endRowIndex: 10000,
                            startColumnIndex: 10,
                            endColumnIndex: 11
                        },
                        rule: {
                            condition: {
                                type: 'ONE_OF_LIST',
                                values: [
                                    { userEnteredValue: 'Si' },
                                    { userEnteredValue: 'No' }
                                ]
                            },
                            showCustomUi: true,
                            strict: true
                        }
                    }
                },
                // Verde cuando Encargado = "Si"
                {
                    addConditionalFormatRule: {
                        rule: {
                            ranges: [range],
                            booleanRule: {
                                condition: {
                                    type: 'CUSTOM_FORMULA',
                                    values: [{ userEnteredValue: '=$K2="Si"' }]
                                },
                                format: {
                                    backgroundColor: { red: 0.718, green: 0.882, blue: 0.804 }
                                }
                            }
                        },
                        index: 0
                    }
                },
                // Amarillo cuando Encargado = "No"
                {
                    addConditionalFormatRule: {
                        rule: {
                            ranges: [range],
                            booleanRule: {
                                condition: {
                                    type: 'CUSTOM_FORMULA',
                                    values: [{ userEnteredValue: '=$K2="No"' }]
                                },
                                format: {
                                    backgroundColor: { red: 1.0, green: 0.949, blue: 0.8 }
                                }
                            }
                        },
                        index: 1
                    }
                }
            ]
        }
    });
}

/**
 * Añade una fila al final de una pestaña.
 */
async function appendRow(spreadsheetId, sheetTitle, row) {
    const sheets = getSheetsClient();
    await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: `'${sheetTitle}'!A:A`,
        valueInputOption: 'USER_ENTERED',
        insertDataOption: 'INSERT_ROWS',
        requestBody: {
            values: [row]
        }
    });
}

// =============================================
// INSCRIPCIONES - Una pestaña por competición
// =============================================
const INSCRIPCIONES_HEADERS = [
    'Fecha Inscripción',
    'Nombre Atleta',
    'Fecha Nacimiento',
    'Nº Licencia',
    'Competición',
    'Pruebas Seleccionadas',
    'Entrenador (Usuario)',
    'ID Inscripción'
];

/**
 * Reordena las pestañas del spreadsheet de inscripciones por fecha (DD-MM-AAAA al inicio del título).
 * Las pestañas sin fecha van al final en su orden original.
 */
async function sortSheetsByCompetitionDate(spreadsheetId) {
    const sheets = getSheetsClient();
    const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId });
    const allSheets = spreadsheet.data.sheets;

    const dateRegex = /^(\d{2})-(\d{2})-(\d{4})/;

    const sorted = [...allSheets].sort((a, b) => {
        const titleA = a.properties.title;
        const titleB = b.properties.title;
        const mA = titleA.match(dateRegex);
        const mB = titleB.match(dateRegex);

        if (mA && mB) {
            const dA = new Date(`${mA[3]}-${mA[2]}-${mA[1]}`);
            const dB = new Date(`${mB[3]}-${mB[2]}-${mB[1]}`);
            return dA - dB;
        }
        if (mA) return -1;
        if (mB) return 1;
        return 0;
    });

    const requests = sorted.map((sheet, index) => ({
        updateSheetProperties: {
            properties: {
                sheetId: sheet.properties.sheetId,
                index
            },
            fields: 'index'
        }
    }));

    await sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: { requests }
    });
}

async function registrarInscripcionEnSheets(inscripcionData) {
    const spreadsheetId = process.env['GOOGLE_SHEETS_INSCRIPCIONES_ID'];
    if (!spreadsheetId) {
        console.warn('GOOGLE_SHEETS_INSCRIPCIONES_ID no configurado, omitiendo Google Sheets');
        return;
    }

    try {
        const { inscripcionId, nombreAtleta, competicionNombre, fechaCompeticion, pruebas, usuarioNombre, fechaNacimiento, numeroLicencia, fechaInscripcion } = inscripcionData;
        const fechaComp = fechaCompeticion ? new Date(fechaCompeticion) : null;
        const fechaCompStr = fechaComp
            ? `${String(fechaComp.getDate()).padStart(2, '0')}-${String(fechaComp.getMonth() + 1).padStart(2, '0')}-${fechaComp.getFullYear()}`
            : null;
        const sheetTitle = fechaCompStr ? `${fechaCompStr} ${competicionNombre}` : competicionNombre;

        await getOrCreateSheet(spreadsheetId, sheetTitle);
        await ensureHeaders(spreadsheetId, sheetTitle, INSCRIPCIONES_HEADERS);
        await sortSheetsByCompetitionDate(spreadsheetId);

        const fecha = new Date(fechaInscripcion).toLocaleDateString('es-ES', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
        const fechaNacStr = fechaNacimiento
            ? new Date(fechaNacimiento).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })
            : 'N/A';
        const pruebasTexto = Array.isArray(pruebas) ? pruebas.join(', ') : pruebas;

        await appendRow(spreadsheetId, sheetTitle, [
            fecha,
            nombreAtleta,
            fechaNacStr,
            numeroLicencia || 'N/A',
            competicionNombre,
            pruebasTexto,
            usuarioNombre || 'N/A',
            inscripcionId || ''
        ]);

        console.log(`Inscripción registrada en Google Sheets: ${nombreAtleta} - ${competicionNombre}`);
    } catch (error) {
        console.error('Error al registrar inscripción en Google Sheets:', error.message);
    }
}

// =============================================
// COMPRAS - Una pestaña por año
// =============================================
const COMPRAS_HEADERS = [
    'Fecha Compra',
    'Usuario',
    'Email',
    'Teléfono',
    'Producto(s)',
    'Talla(s)',
    'Cantidad(es)',
    'Total (€)',
    'Estado',
    'Stripe Session ID',
    'Encargado'
];

async function registrarCompraEnSheets(compraData) {
    const spreadsheetId = process.env['GOOGLE_SHEETS_COMPRAS_ID'];
    if (!spreadsheetId) {
        console.warn('GOOGLE_SHEETS_COMPRAS_ID no configurado, omitiendo Google Sheets');
        return;
    }

    try {
        const { usuario, productos, total, estado, stripeSessionId, fecha } = compraData;
        const fechaCompra = new Date(fecha || Date.now());
        const mes = String(fechaCompra.getMonth() + 1).padStart(2, '0');
        const sheetTitle = `${mes}-${fechaCompra.getFullYear()}`;

        const sheetId = await getOrCreateSheet(spreadsheetId, sheetTitle);
        await ensureHeaders(spreadsheetId, sheetTitle, COMPRAS_HEADERS);
        await ensureConditionalFormatting(spreadsheetId, sheetId);

        const fechaFormateada = fechaCompra.toLocaleDateString('es-ES', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });

        const productosTexto = productos.map(p => p.nombre).join(', ');
        const tallasTexto = productos.map(p => (p.talla || '').replace(/[\[\]"]/g, '').trim()).join(', ');
        const cantidadesTexto = productos.map(p => p.cantidad).join(', ');

        // Escribir A-J (sin Encargado) para que el INSERT_ROWS no rompa la validación de K
        await appendRow(spreadsheetId, sheetTitle, [
            fechaFormateada,
            usuario.nombre || 'N/A',
            usuario.email || 'N/A',
            usuario.telefono || 'N/A',
            productosTexto,
            tallasTexto,
            cantidadesTexto,
            total.toFixed(2),
            estado,
            stripeSessionId
        ]);

        // Encontrar la última fila escrita y actualizar K con "No" usando USER_ENTERED
        // Así respeta la validación de dropdown ya configurada en esa celda
        const sheets = getSheetsClient();
        const colA = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: `'${sheetTitle}'!A:A`
        });
        const lastRow = colA.data.values ? colA.data.values.length : 2;
        await sheets.spreadsheets.values.update({
            spreadsheetId,
            range: `'${sheetTitle}'!K${lastRow}`,
            valueInputOption: 'USER_ENTERED',
            requestBody: { values: [['No']] }
        });

        console.log(`Compra registrada en Google Sheets: ${usuario.nombre} - ${total}€`);
    } catch (error) {
        console.error('Error al registrar compra en Google Sheets:', error.message);
    }
}

/**
 * Devuelve el índice de fila (0-based) donde la columna H coincide con inscripcionId.
 * Devuelve -1 si no se encuentra.
 */
async function buscarFilaInscripcion(spreadsheetId, sheetTitle, inscripcionId) {
    const sheets = getSheetsClient();
    const result = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: `'${sheetTitle}'!H:H`
    });
    const rows = result.data.values || [];
    for (let i = 0; i < rows.length; i++) {
        if (rows[i][0] === String(inscripcionId)) {
            return i; // índice 0-based
        }
    }
    return -1;
}

/**
 * Elimina la fila de la inscripción dada en Google Sheets.
 */
async function eliminarInscripcionEnSheets({ inscripcionId, competicionNombre, fechaCompeticion }) {
    const spreadsheetId = process.env['GOOGLE_SHEETS_INSCRIPCIONES_ID'];
    if (!spreadsheetId) return;
    try {
        const fechaComp = fechaCompeticion ? new Date(fechaCompeticion) : null;
        const fechaCompStr = fechaComp
            ? `${String(fechaComp.getDate()).padStart(2, '0')}-${String(fechaComp.getMonth() + 1).padStart(2, '0')}-${fechaComp.getFullYear()}`
            : null;
        const sheetTitle = fechaCompStr ? `${fechaCompStr} ${competicionNombre}` : competicionNombre;

        const sheetId = await getOrCreateSheet(spreadsheetId, sheetTitle);
        const rowIndex = await buscarFilaInscripcion(spreadsheetId, sheetTitle, inscripcionId);
        if (rowIndex < 0) {
            console.warn(`No se encontró la fila en Sheets para inscripción ${inscripcionId}`);
            return;
        }

        const sheets = getSheetsClient();
        await sheets.spreadsheets.batchUpdate({
            spreadsheetId,
            requestBody: {
                requests: [{
                    deleteDimension: {
                        range: {
                            sheetId,
                            dimension: 'ROWS',
                            startIndex: rowIndex,
                            endIndex: rowIndex + 1
                        }
                    }
                }]
            }
        });
        console.log(`Inscripción ${inscripcionId} eliminada de Google Sheets`);
    } catch (error) {
        console.error('Error al eliminar inscripción de Google Sheets:', error.message);
    }
}

/**
 * Actualiza la fila de la inscripción dada en Google Sheets.
 */
async function editarInscripcionEnSheets({ inscripcionId, nombreAtleta, competicionNombre, fechaCompeticion, pruebas, usuarioNombre, fechaNacimiento, numeroLicencia, fechaInscripcion }) {
    const spreadsheetId = process.env['GOOGLE_SHEETS_INSCRIPCIONES_ID'];
    if (!spreadsheetId) return;
    try {
        const fechaComp = fechaCompeticion ? new Date(fechaCompeticion) : null;
        const fechaCompStr = fechaComp
            ? `${String(fechaComp.getDate()).padStart(2, '0')}-${String(fechaComp.getMonth() + 1).padStart(2, '0')}-${fechaComp.getFullYear()}`
            : null;
        const sheetTitle = fechaCompStr ? `${fechaCompStr} ${competicionNombre}` : competicionNombre;

        const rowIndex = await buscarFilaInscripcion(spreadsheetId, sheetTitle, inscripcionId);
        if (rowIndex < 0) {
            console.warn(`No se encontró la fila en Sheets para inscripción ${inscripcionId}`);
            return;
        }
        const rowNumber = rowIndex + 1; // 1-based para el range

        const fecha = new Date(fechaInscripcion).toLocaleDateString('es-ES', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
        const fechaNacStr = fechaNacimiento
            ? new Date(fechaNacimiento).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })
            : 'N/A';
        const pruebasTexto = Array.isArray(pruebas) ? pruebas.join(', ') : pruebas;

        const sheets = getSheetsClient();
        await sheets.spreadsheets.values.update({
            spreadsheetId,
            range: `'${sheetTitle}'!A${rowNumber}:H${rowNumber}`,
            valueInputOption: 'USER_ENTERED',
            requestBody: {
                values: [[
                    fecha,
                    nombreAtleta,
                    fechaNacStr,
                    numeroLicencia || 'N/A',
                    competicionNombre,
                    pruebasTexto,
                    usuarioNombre || 'N/A',
                    inscripcionId
                ]]
            }
        });
        console.log(`Inscripción ${inscripcionId} actualizada en Google Sheets`);
    } catch (error) {
        console.error('Error al editar inscripción en Google Sheets:', error.message);
    }
}

module.exports = {
    registrarInscripcionEnSheets,
    eliminarInscripcionEnSheets,
    editarInscripcionEnSheets,
    registrarCompraEnSheets
};
