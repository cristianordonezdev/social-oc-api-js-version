'use strict'

const express = require('express');
const router = express.Router();
const controller = require('../controllers/userController');
// const upload = require('../middlewares/multer');

// router.post('/upload-post', upload.array('images'), controller.uploadPost);
router.post('/follow', controller.follow);
router.get('/get-user/:uuid', controller.getUser);
router.get('/followers-list/:uuid', controller.followersList);
router.get('/following-list/:uuid', controller.followingList);

module.exports = router;