'use strict'

const express = require('express');
const router = express.Router();
const controller = require('../controllers/postController');
const upload = require('../middlewares/multer');

router.get('/', controller.dashboard);
router.post('/upload-post', upload.array('images'), controller.uploadPost);
router.post('/like', controller.like);
router.post('/get-post-followers', controller.getPostFollowers);
router.put('/edit-post', controller.editPost);
router.delete('/delete-post', controller.deletePost);

module.exports = router;