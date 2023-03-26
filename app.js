'use strict'

// IMPORTING
const express = require('express');
const app = express();
const cors = require('cors');
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
// app.use((req, res, next) => {
//     res.header('Access-Control-Allow-Origin', '*');
//     res.header('Access-Control-Allow-Headers', 'Authorization, X-API-KEY, Origin, X-Requested-With, Content-Type, Accept, Access-Control-Allow-Request-Method');
//     res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
//     res.header('Allow', 'GET, POST, OPTIONS, PUT, DELETE');
//     next();
// });

const allowed_origins = ['http://localhost:8080', 'http://socialoc.com:8080'];
app.use(cors({origin: allowed_origins}));

// app.use(cors({origin:true,credentials: true}));
// const cors = require('cors');
// var corsOptions = {
//     origin: '*', // Reemplazar con dominio
//     optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
// }
// app.use(cors(corsOptions));

// ROUTES
const auth_routes = require('./routes/authRoutes');
const post_routes = require('./routes/postRoutes');
const user_routes = require('./routes/userRoutes');

app.use('/api/auth', auth_routes);
app.use('/api/dashboard/posts', post_routes);
app.use('/api/dashboard/user', user_routes);

// EXPORTING
module.exports = app;