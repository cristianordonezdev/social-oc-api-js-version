'use strict'

// IMPORTING
const express = require('express');
const body_parser = require('body-parser');
require('dotenv').config();

const app = express();
app.use(express.json());

// MIDDLEWERES
app.use(body_parser.urlencoded({extended: false}));
app.use(body_parser.json());

// CORS

// ROUTES

// EXPORTING
module.exports = app;