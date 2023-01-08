'use strict'

const multer = require('multer');

const storage = multer.diskStorage({
  destination: (request, file, cb) => {
    cb(null, './uploads');
  },
  filename: (request, file, cb) => {
    cb(null, new Date().toISOString + '-' + file.originalname)
  }
});

const fileFilter = (request, file, cb) => {
  if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png' || file.mimetype === 'image/jpg' || file.mimetype === 'video/mp4') {
    cb(null, true);
  } else {
    cb({ message: "Unsopported file format" }, false)
  }
}

const upload = multer({
  storage: storage,
  fileFilter: fileFilter
});

module.exports = upload;