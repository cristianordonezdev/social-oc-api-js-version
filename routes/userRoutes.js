'use strict'

const express = require('express');
const router = express.Router();
const controller = require('../controllers/userController');
// const upload = require('../middlewares/multer');

// router.post('/upload-post', upload.array('images'), controller.uploadPost);
router.post('/follow', controller.follow);
router.post('/get-user', controller.getUser);


module.exports = router;