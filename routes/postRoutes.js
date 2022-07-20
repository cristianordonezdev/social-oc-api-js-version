'use strict'

const express = require('express');
const router = express.Router();
const controller = require('../controllers/postController');
const upload = require('../middlewares/multer');

router.get('/', controller.dashboard);
router.post('/upload-post', upload.array('images'), controller.uploadPost);
router.post('/like', controller.like);
router.post('/comment-post', controller.commentPost);

router.get('/get-posts-followers/:user_uuid', controller.getPostFollowers);
router.get('/get-posts-tagged/:uuid', controller.getPostTagged); 
router.get('/get-post/:uuid', controller.getPost);
router.put('/edit-post', controller.editPost);
router.delete('/delete-post/:uuid', controller.deletePost);

module.exports = router;