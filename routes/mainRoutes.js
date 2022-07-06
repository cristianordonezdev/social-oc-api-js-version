'use strict'

const express = require('express');
const router = express.Router();
const controller = require('../controllers/mainController');
const upload = require('../middlewares/multer');

router.get('/', controller.dashboard);

router.post('/upload-post', upload.array('images'), controller.uploadPost);
router.post('/follow', controller.follow);
router.post('/get-post', controller.getPost);

module.exports = router;