'use strict'

const express = require('express');
const router = express.Router();
const controller = require('../controllers/userController');
const upload = require('../middlewares/multer');

// router.post('/upload-post', upload.array('images'), controller.uploadPost);
router.post('/follow', controller.follow);
router.post('/get-user', controller.getUser);
router.get('/followers-list/:uuid', controller.followersList);
router.get('/following-list/:uuid', controller.followingList);
router.get('/suggestions/:uuid', controller.getSuggestions);
router.post('/upload-profile-picture', upload.array('picture'), controller.uploadProfilePicture);
router.put('/delete-profile-picture', controller.deleteProfilePicture);

router.put('/edit-user', controller.editUser);

module.exports = router;