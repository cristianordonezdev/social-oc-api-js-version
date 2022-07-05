'use strict'

const express = require('express');
const router = express.Router();
const controller = require('../controllers/mainController');
const upload = require('../middlewares/multer');

router.get('/', controller.dashboard);
router.post('/upload-post', upload.array('images'), controller.uploadPost);

module.exports = router;