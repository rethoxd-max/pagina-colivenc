const sectoresRouter = require('./ranking/sectores');
const categoriasRouter = require('./ranking/categorias');

app.use('/api/sectores', sectoresRouter);
app.use('/api/categorias', categoriasRouter); 