const express = require('express');
const app = express();
const instagramRoutes = require('./routes/instagram');

// Rutas
app.use('/api/instagram', instagramRoutes);

// ... existing code ... 