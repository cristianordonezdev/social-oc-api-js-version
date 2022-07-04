'use strict'

const app = require('./app');
const port = process.env.PORT;

app.listen(port, () => {
    console.log(`Servidor corriendo en mi http://localhost:${port}`);
});