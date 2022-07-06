'use strict'

// IMPORTING
const express = require('express');
const app = express();
const body_parser = require('body-parser');
const mysql = require('mysql');
const express_myconnection = require('express-myconnection');
require('dotenv').config();

const db = {
    host: process.env.HOST_DB,
    user: process.env.USER_DB,
    password: process.env.PASSWORD_DB,
    database: process.env.DATABASE_DB,
};

// TO CONVERT DATA INTO JSON
app.use(express.json());

// MIDDLEWERES
app.use(body_parser.urlencoded({extended: false}));
app.use(body_parser.json());

// CONECTION TO MY DATABASE
app.use(express_myconnection(mysql, db, 'single'));

// CORS
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Authorization, X-API-KEY, Origin, X-Requested-With, Content-Type, Accept, Access-Control-Allow-Request-Method');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
    res.header('Allow', 'GET, POST, OPTIONS, PUT, DELETE');
    next();
});
const cors = require('cors');
var corsOptions = {
    origin: '*', // Reemplazar con dominio
    optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
}
app.use(cors(corsOptions));

// ROUTES
const middleware_token = require('./middlewares/validateToken');
const auth_routes = require('./routes/authRoutes');
const main_routes = require('./routes/mainRoutes');

app.use('/api/auth', auth_routes);
app.use('/api/dashboard', middleware_token, main_routes);

// EXPORTING
module.exports = app;