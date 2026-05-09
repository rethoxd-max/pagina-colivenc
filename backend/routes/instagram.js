const express = require('express');
const router = express.Router();
const axios = require('axios');
const path = require('path');
const fs = require('fs');
const PostInstagram = require('../models/PostInstagram');
const auth = require('../middleware/auth');

// ── Helper: extraer shortcode de URL de Instagram ─────────────────────────────
function extractShortcode(url) {
    const m = url.match(/instagram\.com\/(?:p|reel|tv)\/([A-Za-z0-9_-]+)/);
    return m ? m[1] : null;
}

// ── Helper: headers que simulan un navegador real ─────────────────────────────
const BROWSER_HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
    'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
    'Accept-Encoding': 'gzip, deflate, br',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'none',
    'Cache-Control': 'no-cache',
    'Pragma': 'no-cache',
};

// ── Helper: limpiar og:description (quitar el prefijo de likes/comentarios) ─
function limpiarDescripcion(raw) {
    if (!raw) return '';
    // Formato: "X likes, Y comments - usuario el/on Month D, YYYY: caption..."
    const m = raw.match(/(?:el|on)\s+[A-Z][a-z]+\s+\d{1,2},\s+\d{4}:\s*(.*)/i);
    if (m) return m[1].trim();
    // Fallback: quitar todo hasta el primer ": " si está antes del carácter 100
    const idx = raw.indexOf(': ');
    if (idx !== -1 && idx < 100) return raw.slice(idx + 2).trim();
    return raw;
}

function decodeHTMLEntities(str) {
    return str
        .replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
        .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(parseInt(dec, 10)));
}

function extractOG(html) {
    const getOG = (prop) => {
        const re1 = new RegExp(`<meta[^>]+property=["']${prop}["'][^>]+content=["']([^"']+)["']`, 'i');
        const re2 = new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+property=["']${prop}["']`, 'i');
        const m = html.match(re1) || html.match(re2);
        return m ? decodeHTMLEntities(m[1]) : '';
    };
    return {
        imagenUrl: getOG('og:image'),
        descripcion: limpiarDescripcion(getOG('og:description') || getOG('og:title')),
    };
}

// ── Helper: descargar imagen y guardarla localmente ───────────────────────────
async function descargarImagen(remoteUrl) {
    if (!remoteUrl) return '';
    try {
        const res = await axios.get(remoteUrl, {
            responseType: 'arraybuffer',
            timeout: 10000,
            headers: { 'Referer': 'https://www.instagram.com/', ...BROWSER_HEADERS },
        });
        const ext = (remoteUrl.match(/\.(jpg|jpeg|png|webp)/i) || ['', 'jpg'])[1];
        const filename = `ig_${Date.now()}.${ext}`;
        const dir = path.join(__dirname, '../uploads/instagram');
        fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(path.join(dir, filename), res.data);
        // devolver ruta relativa; el frontend añade la base via environment.apiUrl
        return `/uploads/instagram/${filename}`;
    } catch {
        return remoteUrl; // si falla la descarga, devolver la URL remota como fallback
    }
}

// ── Helper: scraping de metadatos ────────────────────────────────────────────
async function scrapeInstagram(url) {
    const shortcode = extractShortcode(url);
    const urlsToTry = [
        shortcode ? `https://www.instagram.com/p/${shortcode}/embed/captioned/` : null,
        url,
    ].filter(Boolean);

    for (const targetUrl of urlsToTry) {
        try {
            const res = await axios.get(targetUrl, { headers: BROWSER_HEADERS, timeout: 10000, maxRedirects: 5 });
            const { imagenUrl, descripcion } = extractOG(res.data);
            if (imagenUrl) {
                const localImg = await descargarImagen(imagenUrl);
                return { imagenUrl: localImg, descripcion };
            }
        } catch { /* intentar siguiente URL */ }
    }
    return { imagenUrl: '', descripcion: '' };
}

// ══════════════════════════════════════════════════════════════════════════════

// GET /fetch-metadata?url=... — previsualizar metadatos (solo admin)
router.get('/fetch-metadata', auth, async (req, res) => {
    if (!req.user.userTypes.includes('Admin')) return res.status(403).json({ mensaje: 'Acceso denegado' });
    const { url } = req.query;
    if (!url || !url.includes('instagram.com')) return res.status(400).json({ mensaje: 'URL de Instagram no válida' });
    try {
        const data = await scrapeInstagram(url);
        res.json(data);
    } catch (err) {
        res.status(502).json({ mensaje: 'No se pudieron obtener los datos automáticamente.', detalle: err.message });
    }
});

// POST /:id/refresh — refrescar metadatos de un post existente (solo admin)
router.post('/:id/refresh', auth, async (req, res) => {
    if (!req.user.userTypes.includes('Admin')) return res.status(403).json({ mensaje: 'Acceso denegado' });
    try {
        const post = await PostInstagram.findById(req.params.id);
        if (!post) return res.status(404).json({ mensaje: 'Post no encontrado' });
        const { imagenUrl, descripcion } = await scrapeInstagram(post.url);
        const updated = await PostInstagram.findByIdAndUpdate(
            req.params.id,
            { imagenUrl, descripcion },
            { new: true }
        );
        res.json(updated);
    } catch (err) {
        res.status(502).json({ mensaje: 'No se pudieron obtener los datos.', detalle: err.message });
    }
});

// GET / — obtener todos los posts (público)
router.get('/', async (req, res) => {
    try {
        const posts = await PostInstagram.find().sort({ orden: 1, createdAt: -1 });
        res.json(posts);
    } catch (err) {
        res.status(500).json({ mensaje: 'Error al obtener posts de Instagram' });
    }
});

// POST / — añadir URL de post (solo admin, con auto-scraping)
router.post('/', auth, async (req, res) => {
    if (!req.user.userTypes.includes('Admin')) return res.status(403).json({ mensaje: 'Acceso denegado' });
    try {
        const { url, orden, imagenUrl: imgManual, descripcion: descManual, likes, comentarios } = req.body;
        if (!url || !url.includes('instagram.com')) return res.status(400).json({ mensaje: 'URL de Instagram no válida' });

        let imagenUrl = imgManual || '';
        let descripcion = descManual || '';
        if (!imagenUrl) {
            const scraped = await scrapeInstagram(url);
            imagenUrl = scraped.imagenUrl;
            if (!descripcion) descripcion = scraped.descripcion;
        }

        const post = new PostInstagram({ url: url.trim(), orden: orden || 0, imagenUrl, descripcion, likes: likes || 0, comentarios: comentarios || 0 });
        await post.save();
        res.status(201).json(post);
    } catch (err) {
        if (err.code === 11000) return res.status(400).json({ mensaje: 'Esta URL ya está añadida' });
        res.status(500).json({ mensaje: 'Error al guardar el post' });
    }
});

// PUT /:id — actualizar campos manualmente (solo admin)
router.put('/:id', auth, async (req, res) => {
    if (!req.user.userTypes.includes('Admin')) return res.status(403).json({ mensaje: 'Acceso denegado' });
    try {
        const { imagenUrl, descripcion, likes, comentarios, orden } = req.body;
        const post = await PostInstagram.findByIdAndUpdate(req.params.id, { imagenUrl, descripcion, likes, comentarios, orden }, { new: true });
        if (!post) return res.status(404).json({ mensaje: 'Post no encontrado' });
        res.json(post);
    } catch (err) {
        res.status(500).json({ mensaje: 'Error al actualizar el post' });
    }
});

// DELETE /:id — eliminar post (solo admin)
router.delete('/:id', auth, async (req, res) => {
    if (!req.user.userTypes.includes('Admin')) return res.status(403).json({ mensaje: 'Acceso denegado' });
    try {
        const post = await PostInstagram.findByIdAndDelete(req.params.id);
        if (!post) return res.status(404).json({ mensaje: 'Post no encontrado' });
        res.json({ mensaje: 'Post eliminado' });
    } catch (err) {
        res.status(500).json({ mensaje: 'Error al eliminar el post' });
    }
});

module.exports = router;


// GET /fetch-metadata?url=... — obtener metadatos de Instagram (solo admin)
router.get('/fetch-metadata', auth, async (req, res) => {
    if (!req.user.userTypes.includes('Admin')) {
        return res.status(403).json({ mensaje: 'Acceso denegado' });
    }
    const { url } = req.query;
    if (!url || !url.includes('instagram.com')) {
        return res.status(400).json({ mensaje: 'URL de Instagram no válida' });
    }
    try {
        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept-Language': 'es-ES,es;q=0.9',
                'Accept': 'text/html,application/xhtml+xml',
            },
            timeout: 8000,
        });
        const html = response.data;

        const getOG = (property) => {
            const match = html.match(new RegExp(`<meta[^>]+property=["']${property}["'][^>]+content=["']([^"']+)["']`, 'i'))
                || html.match(new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+property=["']${property}["']`, 'i'));
            return match ? match[1] : '';
        };

        const imagenUrl = getOG('og:image');
        const descripcion = getOG('og:description') || getOG('og:title');

        res.json({ imagenUrl, descripcion });
    } catch (err) {
        res.status(502).json({ mensaje: 'No se pudieron obtener los datos. Instagram puede bloquear la petición.', detalle: err.message });
    }
});

// GET / — obtener todos los posts (público)
router.get('/', async (req, res) => {
    try {
        const posts = await PostInstagram.find().sort({ orden: 1, createdAt: -1 });
        res.json(posts);
    } catch (err) {
        res.status(500).json({ mensaje: 'Error al obtener posts de Instagram' });
    }
});

// POST / — añadir URL de post (solo admin)
router.post('/', auth, async (req, res) => {
    if (!req.user.userTypes.includes('Admin')) {
        return res.status(403).json({ mensaje: 'Acceso denegado' });
    }
    try {
        const { url, orden, imagenUrl, descripcion, likes, comentarios } = req.body;
        if (!url || !url.includes('instagram.com')) {
            return res.status(400).json({ mensaje: 'URL de Instagram no válida' });
        }
        const post = new PostInstagram({
            url: url.trim(),
            orden: orden || 0,
            imagenUrl: imagenUrl || '',
            descripcion: descripcion || '',
            likes: likes || 0,
            comentarios: comentarios || 0,
        });
        await post.save();
        res.status(201).json(post);
    } catch (err) {
        if (err.code === 11000) {
            return res.status(400).json({ mensaje: 'Esta URL ya está añadida' });
        }
        res.status(500).json({ mensaje: 'Error al guardar el post' });
    }
});

// DELETE /:id — eliminar post (solo admin)
router.delete('/:id', auth, async (req, res) => {
    if (!req.user.userTypes.includes('Admin')) {
        return res.status(403).json({ mensaje: 'Acceso denegado' });
    }
    try {
        const post = await PostInstagram.findByIdAndDelete(req.params.id);
        if (!post) return res.status(404).json({ mensaje: 'Post no encontrado' });
        res.json({ mensaje: 'Post eliminado' });
    } catch (err) {
        res.status(500).json({ mensaje: 'Error al eliminar el post' });
    }
});

module.exports = router;
