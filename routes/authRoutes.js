'use strict'

const express = require('express');
const router = express.Router();
const controller = require('../controllers/authController.js');

router.post('/login', controller.login);
router.post('/register', controller.register);

module.exports = router;