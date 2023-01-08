'use strict'

const express = require('express');
const router = express.Router();
const controller = require('../controllers/postController');
const upload = require('../middlewares/multer');
const verify_token = require('./../middlewares/validateToken')

router.get('/',verify_token, controller.dashboard);
router.get('/get-posts-tagged/:uuid', verify_token,controller.getPostTagged); 
router.get('/get-post/:uuid', verify_token,controller.getPost);
router.get('/get-posts-followers', verify_token,controller.getPostFollowers);

router.post('/like-post', verify_token, controller.likePost);
router.post('/like-comment', verify_token, controller.likeComment);
router.post('/comment-post', verify_token,controller.commentPost);
router.post('/upload-post', upload.array('images'), verify_token, controller.uploadPost);

router.put('/edit-post', verify_token,controller.editPost);

router.delete('/delete-post/:post_uuid/:user_uuid', verify_token,controller.deletePost);
router.delete('/delete-comment-post/:uuid', verify_token, controller.deleteCommentPost);
module.exports = router;