var express = require("express");
var router = express.Router();
let userModel = require('../schemas/users');
let postModel = require('../schemas/posts');
let commentModel = require('../schemas/comments');
let { CheckLogin, CheckRole } = require('../utils/authHandler');

// --- All admin routes require: CheckLogin + CheckRole("ADMIN") ---

// GET /api/admin/users?q=keyword
router.get('/users', CheckLogin, CheckRole("ADMIN"), async function (req, res, next) {
  try {
    let q = req.query.q || '';
    let filter = { isDeleted: false };
    if (q.trim()) {
      filter.$or = [
        { username: new RegExp(q, 'i') },
        { fullName: new RegExp(q, 'i') },
        { email: new RegExp(q, 'i') }
      ];
    }
    let users = await userModel.find(filter)
      .populate({ path: 'role', select: 'name' })
      .select('-password')
      .sort({ createdAt: -1 });
    res.send(users);
  } catch (err) {
    res.status(400).send({ message: err.message });
  }
});

// PUT /api/admin/users/:id/ban
router.put('/users/:id/ban', CheckLogin, CheckRole("ADMIN"), async function (req, res, next) {
  try {
    let user = await userModel.findByIdAndUpdate(req.params.id, { status: false }, { new: true });
    if (!user) return res.status(404).send({ message: "User not found" });
    res.send({ message: "User banned", user: user });
  } catch (err) {
    res.status(400).send({ message: err.message });
  }
});

// PUT /api/admin/users/:id/unban
router.put('/users/:id/unban', CheckLogin, CheckRole("ADMIN"), async function (req, res, next) {
  try {
    let user = await userModel.findByIdAndUpdate(req.params.id, { status: true }, { new: true });
    if (!user) return res.status(404).send({ message: "User not found" });
    res.send({ message: "User unbanned", user: user });
  } catch (err) {
    res.status(400).send({ message: err.message });
  }
});

// GET /api/admin/posts
router.get('/posts', CheckLogin, CheckRole("ADMIN"), async function (req, res, next) {
  try {
    let posts = await postModel.find({ isDeleted: false })
      .populate({ path: 'user', select: 'username fullName avatarUrl' })
      .sort({ createdAt: -1 });
    res.send(posts);
  } catch (err) {
    res.status(400).send({ message: err.message });
  }
});

// DELETE /api/admin/posts/:id
router.delete('/posts/:id', CheckLogin, CheckRole("ADMIN"), async function (req, res, next) {
  try {
    let post = await postModel.findByIdAndUpdate(req.params.id, { isDeleted: true }, { new: true });
    if (!post) return res.status(404).send({ message: "Post not found" });
    res.send({ message: "Post deleted" });
  } catch (err) {
    res.status(400).send({ message: err.message });
  }
});

// GET /api/admin/comments
router.get('/comments', CheckLogin, CheckRole("ADMIN"), async function (req, res, next) {
  try {
    let comments = await commentModel.find({ isDeleted: false })
      .populate({ path: 'user', select: 'username fullName avatarUrl' })
      .populate({ path: 'post', select: 'content' })
      .sort({ createdAt: -1 });
    res.send(comments);
  } catch (err) {
    res.status(400).send({ message: err.message });
  }
});

// DELETE /api/admin/comments/:id
router.delete('/comments/:id', CheckLogin, CheckRole("ADMIN"), async function (req, res, next) {
  try {
    let comment = await commentModel.findByIdAndUpdate(req.params.id, { isDeleted: true }, { new: true });
    if (!comment) return res.status(404).send({ message: "Comment not found" });
    res.send({ message: "Comment deleted" });
  } catch (err) {
    res.status(400).send({ message: err.message });
  }
});

// GET /api/admin/stats
router.get('/stats', CheckLogin, CheckRole("ADMIN"), async function (req, res, next) {
  try {
    let totalUsers = await userModel.countDocuments({ isDeleted: false });
    let activeUsers = await userModel.countDocuments({ isDeleted: false, status: true });
    let bannedUsers = await userModel.countDocuments({ isDeleted: false, status: false });
    let totalPosts = await postModel.countDocuments({ isDeleted: false });
    let totalComments = await commentModel.countDocuments({ isDeleted: false });
    const Community = require('../schemas/communities');
    let totalCommunities = await Community.countDocuments({ isDeleted: false });

    res.send({
      totalUsers,
      activeUsers,
      bannedUsers,
      totalPosts,
      totalComments,
      totalCommunities
    });
  } catch (err) {
    res.status(400).send({ message: err.message });
  }
});

// GET /api/admin/communities
router.get('/communities', CheckLogin, CheckRole("ADMIN"), async function (req, res, next) {
  try {
    const Community = require('../schemas/communities');
    let communities = await Community.find({ isDeleted: false })
      .populate({ path: 'createdBy', select: 'username fullName avatarUrl' })
      .sort({ createdAt: -1 });
    res.send(communities);
  } catch (err) {
    res.status(400).send({ message: err.message });
  }
});

// DELETE /api/admin/communities/:id
router.delete('/communities/:id', CheckLogin, CheckRole("ADMIN"), async function (req, res, next) {
  try {
    const Community = require('../schemas/communities');
    let comm = await Community.findByIdAndUpdate(req.params.id, { isDeleted: true }, { new: true });
    if (!comm) return res.status(404).send({ message: "Community not found" });
    res.send({ message: "Community deleted" });
  } catch (err) {
    res.status(400).send({ message: err.message });
  }
});

module.exports = router;
