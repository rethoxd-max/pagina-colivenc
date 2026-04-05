// @ts-nocheck
const nodemailer = require('nodemailer');
const PDFDocument = require('pdfkit');

// ─────────────────────────────────────────────
// Datos del club (personalizables via .env)
// ─────────────────────────────────────────────
const CLUB = {
    nombre:    process.env['CLUB_NOMBRE']    || 'Club Colivenc - CNIL',
    direccion: process.env['CLUB_DIRECCION'] || 'Cocentaina, Alicante',
    email:     process.env['CLUB_EMAIL']     || process.env['EMAIL_USER'] || '',
    web:       process.env['CLUB_WEB']       || 'https://colivenc.es',
    cif:       process.env['CLUB_CIF']       || ''
};

// ─────────────────────────────────────────────
// Transporter de nodemailer
// ─────────────────────────────────────────────
function getTransporter() {
    return nodemailer.createTransport({
        host:   process.env['EMAIL_HOST']   || 'smtp.gmail.com',
        port:   Number(process.env['EMAIL_PORT']) || 465,
        secure: (process.env['EMAIL_PORT'] || '465') === '465',
        auth: {
            user: process.env['EMAIL_USER'],
            pass: process.env['EMAIL_PASS']
        }
    });
}

// ─────────────────────────────────────────────
// Generación del PDF de factura en memoria
// ─────────────────────────────────────────────
function generarFacturaPDF(datos) {
    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({ margin: 50, size: 'A4' });
        const chunks = [];
        doc.on('data', chunk => chunks.push(chunk));
        doc.on('end',  () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        const {
            numeroOrden,
            fecha,
            comprador,   // { nombre, email, telefono }
            productos,   // [{ nombre, talla, cantidad, precio }]
            total
        } = datos;

        const fechaStr = new Date(fecha).toLocaleDateString('es-ES', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });

        // ── Cabecera del club ──────────────────────────────────
        doc.fontSize(22).font('Helvetica-Bold').text(CLUB.nombre, { align: 'left' });
        doc.fontSize(10).font('Helvetica').fillColor('#555')
            .text(CLUB.direccion)
            .text(CLUB.email)
            .text(CLUB.web);
        if (CLUB.cif) doc.text(`CIF: ${CLUB.cif}`);

        doc.moveDown(0.5);
        doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#cccccc').stroke();
        doc.moveDown(0.5);

        // ── Título factura ─────────────────────────────────────
        doc.fontSize(18).font('Helvetica-Bold').fillColor('#1a1a1a')
            .text('RECIBO DE COMPRA', { align: 'center' });
        doc.moveDown(0.5);

        // ── Datos del pedido ───────────────────────────────────
        doc.fontSize(10).font('Helvetica').fillColor('#333');
        doc.text(`Nº Pedido:  ${numeroOrden}`, { continued: true });
        doc.text(`    Fecha:  ${fechaStr}`, { align: 'right' });
        doc.moveDown(1);

        // ── Datos del comprador ────────────────────────────────
        doc.fontSize(12).font('Helvetica-Bold').fillColor('#1a1a1a').text('Datos del comprador');
        doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#dddddd').stroke();
        doc.moveDown(0.3);
        doc.fontSize(10).font('Helvetica').fillColor('#333')
            .text(`Nombre:    ${comprador.nombre}`)
            .text(`Email:     ${comprador.email}`)
            .text(`Teléfono:  ${comprador.telefono || 'N/A'}`);
        doc.moveDown(1);

        // ── Tabla de productos ─────────────────────────────────
        doc.fontSize(12).font('Helvetica-Bold').fillColor('#1a1a1a').text('Artículos');
        doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#dddddd').stroke();
        doc.moveDown(0.3);

        // Cabeceras
        const col = { producto: 50, talla: 280, cant: 360, precio: 430, subtotal: 490 };
        doc.fontSize(10).font('Helvetica-Bold').fillColor('#444');
        doc.text('Producto',  col.producto, doc.y, { width: 220 });
        doc.text('Talla',     col.talla,    doc.y - doc.currentLineHeight(), { width: 70 });
        doc.text('Cant.',     col.cant,     doc.y - doc.currentLineHeight(), { width: 60 });
        doc.text('P. Unit.',  col.precio,   doc.y - doc.currentLineHeight(), { width: 55 });
        doc.text('Subtotal',  col.subtotal, doc.y - doc.currentLineHeight(), { width: 55 });
        doc.moveDown(0.2);
        doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#cccccc').stroke();
        doc.moveDown(0.3);

        // Filas de productos
        doc.font('Helvetica').fillColor('#333');
        for (const p of productos) {
            const subtotal = (p.precio * p.cantidad).toFixed(2);
            const y = doc.y;
            doc.text(p.nombre,              col.producto, y, { width: 220 });
            doc.text(p.talla || 'N/A',      col.talla,    y, { width: 70 });
            doc.text(String(p.cantidad),    col.cant,     y, { width: 60 });
            doc.text(`${Number(p.precio).toFixed(2)} €`, col.precio, y, { width: 55 });
            doc.text(`${subtotal} €`,       col.subtotal, y, { width: 55 });
            doc.moveDown(0.8);
        }

        doc.moveDown(0.3);
        doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#cccccc').stroke();
        doc.moveDown(0.5);

        // ── Total ──────────────────────────────────────────────
        doc.fontSize(13).font('Helvetica-Bold').fillColor('#1a1a1a')
            .text(`TOTAL:  ${Number(total).toFixed(2)} €`, { align: 'right' });

        doc.moveDown(2);

        // ── Pie ────────────────────────────────────────────────
        doc.fontSize(9).font('Helvetica').fillColor('#888')
            .text('Gracias por tu compra. Para cualquier consulta contacta con nosotros.', { align: 'center' })
            .text(CLUB.email, { align: 'center' });

        doc.end();
    });
}

// ─────────────────────────────────────────────
// Función principal: genera PDF y envía email
// ─────────────────────────────────────────────
async function enviarConfirmacionCompra({ comprador, productos, total, numeroOrden, fecha }) {
    if (!process.env['EMAIL_USER'] || !process.env['EMAIL_PASS']) {
        console.warn('EMAIL_USER / EMAIL_PASS no configurados, omitiendo envío de correo');
        return;
    }

    const pdfBuffer = await generarFacturaPDF({ numeroOrden, fecha, comprador, productos, total });

    const transporter = getTransporter();

    const productosList = productos
        .map(p => `• ${p.nombre}${p.talla && p.talla !== 'N/A' ? ` (talla ${p.talla})` : ''} × ${p.cantidad} — ${Number(p.precio * p.cantidad).toFixed(2)} €`)
        .join('\n');

    const html = `
<!DOCTYPE html>
<html lang="es">
<body style="margin:0;padding:0;font-family:Arial,sans-serif;background:#f4f4f4;">
  <table width="100%" bgcolor="#f4f4f4" cellpadding="0" cellspacing="0">
    <tr><td align="center" style="padding:30px 0;">
      <table width="600" bgcolor="#ffffff" cellpadding="0" cellspacing="0"
             style="border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.1);">

        <!-- Cabecera -->
        <tr>
          <td bgcolor="#1a237e" style="padding:28px 40px;text-align:center;">
            <h1 style="margin:0;font-size:24px;color:#ffffff;">${CLUB.nombre}</h1>
            <p style="margin:6px 0 0;color:#bbdefb;font-size:13px;">Confirmación de compra</p>
          </td>
        </tr>

        <!-- Cuerpo -->
        <tr><td style="padding:32px 40px;">
          <p style="font-size:16px;color:#333;">Hola, <strong>${comprador.nombre}</strong>,</p>
          <p style="color:#555;line-height:1.6;">
            Tu compra ha sido procesada con éxito. Adjuntamos el recibo en PDF.
          </p>

          <!-- Resumen -->
          <table width="100%" cellpadding="8" cellspacing="0"
                 style="border-collapse:collapse;margin:20px 0;font-size:14px;">
            <thead>
              <tr bgcolor="#f5f5f5">
                <th align="left"  style="border-bottom:2px solid #ddd;color:#333;">Producto</th>
                <th align="center" style="border-bottom:2px solid #ddd;color:#333;">Talla</th>
                <th align="center" style="border-bottom:2px solid #ddd;color:#333;">Cant.</th>
                <th align="right"  style="border-bottom:2px solid #ddd;color:#333;">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              ${productos.map(p => `
              <tr>
                <td style="border-bottom:1px solid #eee;color:#444;">${p.nombre}</td>
                <td align="center" style="border-bottom:1px solid #eee;color:#444;">${p.talla || 'N/A'}</td>
                <td align="center" style="border-bottom:1px solid #eee;color:#444;">${p.cantidad}</td>
                <td align="right"  style="border-bottom:1px solid #eee;color:#444;">${Number(p.precio * p.cantidad).toFixed(2)} €</td>
              </tr>`).join('')}
              <tr bgcolor="#f9f9f9">
                <td colspan="3" align="right" style="padding-top:10px;font-weight:bold;color:#1a237e;">TOTAL</td>
                <td align="right" style="padding-top:10px;font-weight:bold;font-size:16px;color:#1a237e;">${Number(total).toFixed(2)} €</td>
              </tr>
            </tbody>
          </table>

          <p style="color:#888;font-size:12px;">Nº Pedido: <strong>${numeroOrden}</strong></p>
          <p style="color:#555;line-height:1.6;">
            Para cualquier consulta, contáctanos en
            <a href="mailto:${CLUB.email}" style="color:#1a237e;">${CLUB.email}</a>
          </p>
        </td></tr>

        <!-- Pie -->
        <tr>
          <td bgcolor="#f5f5f5" style="padding:20px 40px;text-align:center;">
            <p style="margin:0;font-size:12px;color:#999;">
              ${CLUB.nombre} · ${CLUB.direccion}
              ${CLUB.cif ? '· CIF: ' + CLUB.cif : ''}
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

    await transporter.sendMail({
        from:    `"${CLUB.nombre}" <${process.env['EMAIL_USER']}>`,
        to:      comprador.email,
        subject: `✅ Confirmación de compra — ${CLUB.nombre}`,
        html,
        text:    `Hola ${comprador.nombre},\n\nTu compra ha sido confirmada.\n\nProductos:\n${productosList}\n\nTOTAL: ${Number(total).toFixed(2)} €\nNº Pedido: ${numeroOrden}\n\n${CLUB.nombre}\n${CLUB.email}`,
        attachments: [{
            filename:    `recibo-${numeroOrden}.pdf`,
            content:     pdfBuffer,
            contentType: 'application/pdf'
        }]
    });

    console.log(`Email de confirmación enviado a ${comprador.email}`);
}

module.exports = { enviarConfirmacionCompra };
