var express = require('express');
var router = express.Router();
let mediaController = require('../controllers/media');
let { CheckLogin } = require('../utils/authHandler');

router.get('/', CheckLogin, async function (req, res, next) {
  try {
    let result = await mediaController.GetMyMedia(req.user._id);
    res.send(result);
  } catch (err) {
    res.status(400).send({ message: err.message });
  }
});

module.exports = router;
