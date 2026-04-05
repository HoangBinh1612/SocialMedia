var express = require("express");
var router = express.Router();
let notificationController = require('../controllers/notifications');
let { CheckLogin } = require('../utils/authHandler');

// GET /api/notifications
router.get('/', CheckLogin, async function (req, res, next) {
  try {
    let page = parseInt(req.query.page) || 1;
    let size = parseInt(req.query.size) || 20;
    let notifications = await notificationController.GetNotifications(req.user._id, page, size);
    res.send(notifications);
  } catch (err) {
    res.status(400).send({ message: err.message });
  }
});

// GET /api/notifications/count
router.get('/count', CheckLogin, async function (req, res, next) {
  try {
    let count = await notificationController.CountUnread(req.user._id);
    res.send({ count: count });
  } catch (err) {
    res.status(400).send({ message: err.message });
  }
});

// PUT /api/notifications/:id/read
router.put('/:id/read', CheckLogin, async function (req, res, next) {
  try {
    let result = await notificationController.MarkAsRead(req.params.id);
    if (!result) return res.status(404).send({ message: "Notification not found" });
    res.send(result);
  } catch (err) {
    res.status(400).send({ message: err.message });
  }
});

// PUT /api/notifications/read-all
router.put('/read-all', CheckLogin, async function (req, res, next) {
  try {
    await notificationController.MarkAllAsRead(req.user._id);
    res.send({ message: "All notifications marked as read" });
  } catch (err) {
    res.status(400).send({ message: err.message });
  }
});

module.exports = router;
