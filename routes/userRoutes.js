'use strict'

const express = require('express');
const router = express.Router();
const controller = require('../controllers/userController');
const upload = require('../middlewares/multer');
const verify_token = require('./../middlewares/validateToken');

router.get('/followers-list/:uuid', verify_token,controller.followersList);
router.get('/following-list/:uuid', verify_token,controller.followingList);
router.get('/suggestions', verify_token,controller.getSuggestions);
router.get('/get-user/:uuid', verify_token,controller.getUser);

router.post('/follow', verify_token,controller.follow);
router.post('/upload-profile-picture', upload.array('picture'), verify_token, controller.uploadProfilePicture);

router.put('/delete-profile-picture', verify_token, controller.deleteProfilePicture);
router.put('/edit-user', verify_token, controller.editUser);

module.exports = router;