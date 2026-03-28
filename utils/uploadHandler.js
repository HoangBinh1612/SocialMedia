let multer = require("multer");
let path = require('path');

// Storage config (giong pattern thay)
let storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    let ext = path.extname(file.originalname);
    let fileName = Date.now() + '-' + Math.round(Math.random() * 1000000000) + ext;
    cb(null, fileName);
  }
});

// Filter: chi nhan image
let filterImage = function (req, file, cb) {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed"));
  }
}

// Filter: nhan image + video
let filterMedia = function (req, file, cb) {
  if (file.mimetype.startsWith('image') || file.mimetype.startsWith('video')) {
    cb(null, true);
  } else {
    cb(new Error("Only image and video files are allowed"));
  }
}

module.exports = {
  uploadImage: multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    fileFilter: filterImage
  }),
  uploadMedia: multer({
    storage: storage,
    limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
    fileFilter: filterMedia
  })
}
