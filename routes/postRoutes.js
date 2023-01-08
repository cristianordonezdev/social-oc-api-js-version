'use strict'

const express = require('express');
const router = express.Router();
const controller = require('../controllers/postController');
const upload = require('../middlewares/multer');
const verify_own_user = require('../middlewares/verifyLoggedUser')
const verify_token = require('./../middlewares/validateToken')

router.get('/', controller.dashboard);
router.get('/get-posts-tagged/:uuid', verify_token,controller.getPostTagged); 
router.get('/get-post/:uuid/:own_user_uuid', verify_token,controller.getPost);

router.post('/like-post', verify_token, verify_own_user, controller.likePost);
router.post('/get-posts-followers', verify_token, verify_own_user,controller.getPostFollowers);
router.post('/like-comment', verify_token, verify_own_user, controller.likeComment);
router.post('/comment-post', verify_token, verify_own_user,controller.commentPost);
router.post('/upload-post', upload.array('images'), verify_token, verify_own_user, controller.uploadPost);

router.put('/edit-post', verify_token, verify_own_user,controller.editPost);

router.delete('/delete-post/:uuid', verify_token, verify_own_user,controller.deletePost);
router.delete('/delete-comment-post/:uuid', verify_token, verify_own_user, controller.deleteCommentPost);
module.exports = router;