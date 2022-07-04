'use strict'

// IMPORTING
const app = express();
const express = require('express');
const body_parser = require('body-parser');
const mysql = require('mysql');
const express_myconnection = require('express-myconnection');
const db = {
    host: process.env.HOST_DB,
    user: process.env.USER_DB,
    password: process.env.PASSWORD_DB,
    database: process.env.DATABASE_DB,
};
require('dotenv').config();

// TO CONVERT DATA INTO JSON
app.use(express.json());

// MIDDLEWERES
app.use(body_parser.urlencoded({extended: false}));
app.use(body_parser.json());

// CONECTION TO MY DATABASE
app.use(express_myconnection(mysql, db, 'single'));

// CORS

// ROUTES

// EXPORTING
module.exports = app;