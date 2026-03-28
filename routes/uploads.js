var express = require("express");
var router = express.Router();
let { uploadImage, uploadMedia } = require('../utils/uploadHandler');
let path = require('path');

// POST /api/upload/image
router.post('/image', uploadImage.single('file'), function (req, res, next) {
  if (!req.file) {
    return res.status(400).send({ message: "File is required" });
  }
  res.send({
    filename: req.file.filename,
    path: '/uploads/' + req.file.filename,
    size: req.file.size,
    url: '/uploads/' + req.file.filename
  });
});

// POST /api/upload/post
router.post('/post', uploadImage.single('file'), function (req, res, next) {
  if (!req.file) {
    return res.status(400).send({ message: "File is required" });
  }
  res.send({
    filename: req.file.filename,
    path: '/uploads/' + req.file.filename,
    size: req.file.size,
    url: '/uploads/' + req.file.filename
  });
});

// POST /api/upload/avatar
router.post('/avatar', uploadImage.single('file'), function (req, res, next) {
  if (!req.file) {
    return res.status(400).send({ message: "File is required" });
  }
  res.send({
    filename: req.file.filename,
    path: '/uploads/' + req.file.filename,
    size: req.file.size,
    url: '/uploads/' + req.file.filename
  });
});

// POST /api/upload/cover
router.post('/cover', uploadImage.single('file'), function (req, res, next) {
  if (!req.file) {
    return res.status(400).send({ message: "File is required" });
  }
  res.send({
    filename: req.file.filename,
    path: '/uploads/' + req.file.filename,
    size: req.file.size,
    url: '/uploads/' + req.file.filename
  });
});

// POST /api/upload/media
router.post('/media', uploadMedia.single('file'), function (req, res, next) {
  if (!req.file) {
    return res.status(400).send({ message: "File is required" });
  }
  res.send({
    filename: req.file.filename,
    path: '/uploads/' + req.file.filename,
    size: req.file.size,
    url: '/uploads/' + req.file.filename,
    mimetype: req.file.mimetype
  });
});

// POST /api/upload/multiple
router.post('/multiple', uploadImage.array('files', 5), function (req, res, next) {
  if (!req.files || req.files.length === 0) {
    return res.status(400).send({ message: "Files are required" });
  }
  res.send(req.files.map(function (f) {
    return {
      filename: f.filename,
      path: '/uploads/' + f.filename,
      size: f.size,
      url: '/uploads/' + f.filename
    };
  }));
});

// GET /api/upload/:filename
router.get('/:filename', function (req, res, next) {
  let filename = path.join(__dirname, '../uploads', req.params.filename);
  res.sendFile(filename);
});

module.exports = router;
