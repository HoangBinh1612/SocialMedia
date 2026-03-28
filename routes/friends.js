var express = require("express");
var router = express.Router();
let friendController = require('../controllers/friends');
let { CheckLogin, OptionalLogin } = require('../utils/authHandler');

// GET /api/friends/requests/pending
router.get('/requests/pending', CheckLogin, async function (req, res, next) {
  try {
    let requests = await friendController.GetPendingRequests(req.user._id);
    res.send(requests);
  } catch (err) {
    res.status(400).send({ message: err.message });
  }
});

// GET /api/friends/list
router.get('/list', CheckLogin, async function (req, res, next) {
  try {
    let friends = await friendController.GetFriendsList(req.user._id);
    res.send(friends);
  } catch (err) {
    res.status(400).send({ message: err.message });
  }
});

// GET /api/friends/suggestions
router.get('/suggestions', CheckLogin, async function (req, res, next) {
  try {
    let limit = parseInt(req.query.limit) || 10;
    let suggestions = await friendController.GetSuggestions(req.user._id, limit);
    res.send(suggestions);
  } catch (err) {
    res.status(400).send({ message: err.message });
  }
});

// GET /api/friends/profile/:userId
router.get('/profile/:userId', CheckLogin, async function (req, res, next) {
  try {
    let canView = await friendController.CanViewFriendList(req.user._id, req.params.userId);
    if (!canView) {
      return res.status(403).send({ message: "Cannot view friend list" });
    }
    let friends = await friendController.GetFriendsList(req.params.userId);
    res.send(friends);
  } catch (err) {
    res.status(400).send({ message: err.message });
  }
});

// POST /api/friends/send/:targetUserId
router.post('/send/:targetUserId', CheckLogin, async function (req, res, next) {
  try {
    let request = await friendController.SendFriendRequest(req.user._id, req.params.targetUserId);
    res.status(201).send(request);
  } catch (err) {
    res.status(400).send({ message: err.message });
  }
});

// POST /api/friends/:fromUserId/accept
router.post('/:fromUserId/accept', CheckLogin, async function (req, res, next) {
  try {
    let result = await friendController.AcceptFriendRequest(req.user._id, req.params.fromUserId);
    if (!result) return res.status(404).send({ message: "No pending request found" });
    res.send(result);
  } catch (err) {
    res.status(400).send({ message: err.message });
  }
});

// POST /api/friends/:fromUserId/reject
router.post('/:fromUserId/reject', CheckLogin, async function (req, res, next) {
  try {
    let result = await friendController.RejectFriendRequest(req.user._id, req.params.fromUserId);
    if (!result) return res.status(404).send({ message: "No pending request found" });
    res.send({ message: "Request rejected" });
  } catch (err) {
    res.status(400).send({ message: err.message });
  }
});

// DELETE /api/friends/:friendUserId
router.delete('/:friendUserId', CheckLogin, async function (req, res, next) {
  try {
    let result = await friendController.RemoveFriend(req.user._id, req.params.friendUserId);
    if (!result) return res.status(404).send({ message: "Not friends" });
    res.send({ message: "Friend removed" });
  } catch (err) {
    res.status(400).send({ message: err.message });
  }
});

// POST /api/friends/:targetUserId/block
router.post('/:targetUserId/block', CheckLogin, async function (req, res, next) {
  try {
    let result = await friendController.BlockUser(req.user._id, req.params.targetUserId);
    res.send(result);
  } catch (err) {
    res.status(400).send({ message: err.message });
  }
});

// GET /api/friends/:targetUserId/status
router.get('/:targetUserId/status', CheckLogin, async function (req, res, next) {
  try {
    let status = await friendController.GetFriendshipStatus(req.user._id, req.params.targetUserId);
    res.send(status);
  } catch (err) {
    res.status(400).send({ message: err.message });
  }
});

module.exports = router;
