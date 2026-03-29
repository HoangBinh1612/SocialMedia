var express = require("express");
var router = express.Router();
let commentController = require('../controllers/comments');
let { CheckLogin } = require('../utils/authHandler');
let { CreateCommentValidator, validationResult } = require('../utils/validatorHandler');
let { getIO } = require('../utils/chatHandler');

// POST /api/posts/:postId/comments
router.post('/:postId/comments', CheckLogin, CreateCommentValidator, validationResult, async function (req, res, next) {
  try {
    let comment = await commentController.CreateComment(req.user._id, req.params.postId, req.body.content, req.body.imageUrl);
    res.status(201).send(comment);
    let io = getIO();
    if(io) io.emit('NEW_COMMENT', { postId: req.params.postId, comment });
  } catch (err) {
    res.status(400).send({ message: err.message });
  }
});

// GET /api/posts/:postId/comments
router.get('/:postId/comments', async function (req, res, next) {
  try {
    let comments = await commentController.GetByPost(req.params.postId);
    res.send(comments);
  } catch (err) {
    res.status(400).send({ message: err.message });
  }
});

// PUT /api/posts/:postId/comments/:commentId
router.put('/:postId/comments/:commentId', CheckLogin, async function (req, res, next) {
  try {
    let result = await commentController.UpdateComment(req.user._id, req.params.commentId, req.body.content);
    if (!result) return res.status(404).send({ message: "Comment not found" });
    if (result === 'FORBIDDEN') return res.status(403).send({ message: "Not your comment" });
    res.send(result);
    let io = getIO();
    if(io) io.emit('COMMENT_UPDATED', { postId: req.params.postId, comment: result });
  } catch (err) {
    res.status(400).send({ message: err.message });
  }
});

// DELETE /api/posts/:postId/comments/:commentId
router.delete('/:postId/comments/:commentId', CheckLogin, async function (req, res, next) {
  try {
    let result = await commentController.DeleteComment(req.user._id, req.params.commentId);
    if (!result) return res.status(404).send({ message: "Comment not found" });
    if (result === 'FORBIDDEN') return res.status(403).send({ message: "Not your comment" });
    res.send({ message: "Comment deleted" });
    let io = getIO();
    if(io) io.emit('COMMENT_DELETED', { postId: req.params.postId, commentId: req.params.commentId });
  } catch (err) {
    res.status(400).send({ message: err.message });
  }
});

module.exports = router;
