var express = require("express");
var router = express.Router();
let postModel = require('../schemas/posts');
let commentModel = require('../schemas/comments');
let reactionModel = require('../schemas/reactions');
let userModel = require('../schemas/users');
let communityModel = require('../schemas/communities');
let { CheckLogin } = require('../utils/authHandler');

// GET /api/search/posts?q=keyword
router.get('/posts', CheckLogin, async function (req, res, next) {
  try {
    let q = req.query.q || '';
    if (!q.trim()) return res.send([]);

    let posts = await postModel.find({
      isDeleted: false,
      content: new RegExp(q, 'i')
    }).populate({ path: 'user', select: 'username fullName avatarUrl' })
      .populate({ path: 'community', select: 'name coverUrl' })
      .sort({ createdAt: -1 })
      .limit(10);
      
    let result = [];
    for (let post of posts) {
      let commentCount = await commentModel.countDocuments({ post: post._id, isDeleted: false });
      let reactionCount = await reactionModel.countDocuments({ post: post._id });
      let obj = post.toObject();
      obj.commentCount = commentCount;
      obj.reactionCount = reactionCount;
      result.push(obj);
    }

    res.send(result);
  } catch (err) {
    res.status(400).send({ message: err.message });
  }
});

// GET /api/search/users?q=keyword
router.get('/users', CheckLogin, async function (req, res, next) {
  try {
    let q = req.query.q || '';
    if (!q.trim()) return res.send([]);

    let users = await userModel.find({
      isDeleted: false,
      status: true,
      $or: [
        { username: new RegExp(q, 'i') },
        { fullName: new RegExp(q, 'i') },
        { email: new RegExp(q, 'i') }
      ]
    }).select('username fullName avatarUrl bio')
      .limit(20);

    res.send(users);
  } catch (err) {
    res.status(400).send({ message: err.message });
  }
});

// GET /api/search/communities?q=keyword
router.get('/communities', CheckLogin, async function (req, res, next) {
  try {
    let q = req.query.q || '';
    if (!q.trim()) return res.send([]);

    let communities = await communityModel.find({
      isDeleted: false,
      privacy: 'PUBLIC',
      name: new RegExp(q, 'i')
    }).select('name description coverUrl memberCount')
      .limit(20);

    res.send(communities);
  } catch (err) {
    res.status(400).send({ message: err.message });
  }
});

module.exports = router;
