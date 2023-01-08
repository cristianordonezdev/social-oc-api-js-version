'use strict'

const express = require('express');
const router = express.Router();
const controller = require('../controllers/userController');
const upload = require('../middlewares/multer');
const verify_token = require('./../middlewares/validateToken');
const verify_own_user = require('./../middlewares/verifyLoggedUser');

router.get('/followers-list/:uuid', verify_token,controller.followersList);
router.get('/following-list/:uuid', verify_token,controller.followingList);
router.get('/suggestions/:uuid', verify_token, verify_own_user,controller.getSuggestions);

router.post('/follow', verify_token, verify_own_user,controller.follow);
router.post('/get-user', verify_own_user, verify_token,controller.getUser);
router.post('/upload-profile-picture', upload.array('picture'), verify_token, verify_own_user, controller.uploadProfilePicture);

router.put('/delete-profile-picture', verify_token, verify_own_user, controller.deleteProfilePicture);
router.put('/edit-user', verify_token, verify_own_user, controller.editUser);

module.exports = router;