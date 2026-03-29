var express = require("express");
var router = express.Router();
let reactionController = require('../controllers/reactions');
let { CheckLogin } = require('../utils/authHandler');

// POST /api/posts/:postId/react?type=like
router.post('/:postId/react', CheckLogin, async function (req, res, next) {
  try {
    let type = req.query.type || req.body.type || 'like';
    let reaction = await reactionController.ReactPost(req.params.postId, req.user._id, type);
    res.send(reaction);
  } catch (err) {
    res.status(400).send({ message: err.message });
  }
});

// DELETE /api/posts/:postId/react
router.delete('/:postId/react', CheckLogin, async function (req, res, next) {
  try {
    await reactionController.UnreactPost(req.params.postId, req.user._id);
    res.send({ message: "Unreacted" });
  } catch (err) {
    res.status(400).send({ message: err.message });
  }
});

// GET /api/posts/:postId/reactions/count
router.get('/:postId/reactions/count', async function (req, res, next) {
  try {
    let result = await reactionController.CountReactions(req.params.postId);
    res.send(result);
  } catch (err) {
    res.status(400).send({ message: err.message });
  }
});

// GET /api/posts/:postId/reactions/count/:type
router.get('/:postId/reactions/count/:type', async function (req, res, next) {
  try {
    let count = await reactionController.CountByType(req.params.postId, req.params.type);
    res.send({ type: req.params.type, count: count });
  } catch (err) {
    res.status(400).send({ message: err.message });
  }
});

// GET /api/posts/:postId/reactions/me
router.get('/:postId/reactions/me', CheckLogin, async function (req, res, next) {
  try {
    let reaction = await reactionController.GetMyReaction(req.params.postId, req.user._id);
    res.send(reaction || { type: null });
  } catch (err) {
    res.status(400).send({ message: err.message });
  }
});

// GET /api/posts/:postId/reactions
router.get('/:postId/reactions', async function (req, res, next) {
  try {
    let reactions = await reactionController.GetReactionsByPost(req.params.postId);
    res.send(reactions);
  } catch (err) {
    res.status(400).send({ message: err.message });
  }
});

module.exports = router;
