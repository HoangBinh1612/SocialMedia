var express = require("express");
var router = express.Router();
let postModel = require('../schemas/posts');
let postController = require('../controllers/posts');
let { CheckLogin, OptionalLogin } = require('../utils/authHandler');
let { getIO } = require('../utils/chatHandler');

async function broadcastPostEvent(eventName, post) {
  let io = getIO();
  if (!io) return;

  let privacy = post.user?.privacyPosts || 'PUBLIC';
  let userId = post.user?._id?.toString() || post.user?.toString();
  
  if (post.community) {
    const communityMemberModel = require('../schemas/communityMembers');
    let members = await communityMemberModel.find({ community: post.community, status: 'APPROVED' });
    members.forEach(m => {
      if (m.user) io.to(m.user.toString()).emit(eventName, post);
    });
  } else if (privacy === 'FRIENDS') {
    const friendModel = require('../schemas/friends');
    let friends = await friendModel.find({
      $or: [{ requester: userId }, { recipient: userId }],
      status: 'ACCEPTED'
    });
    io.to(userId).emit(eventName, post);
    friends.forEach(f => {
      let friendId = f.requester.toString() === userId ? f.recipient.toString() : f.requester.toString();
      io.to(friendId).emit(eventName, post);
    });
  } else {
    io.emit(eventName, post);
  }
}


// POST /api/posts - Tao post moi
router.post('/', CheckLogin, async function (req, res, next) {
  try {
    let { content, imageUrl, videoUrl, feeling, location } = req.body;
    if (!content && !imageUrl && !videoUrl) {
      return res.status(400).send({ message: "Content, image, or video is required" });
    }
    let post = await postController.CreatePost(req.user._id, content, imageUrl, videoUrl, feeling, location);
    res.status(201).send(post);
    // Broadcast Realtime Event
    broadcastPostEvent('NEW_POST', post);
  } catch (err) {
    res.status(400).send({ message: err.message });
  }
});

// GET /api/posts/feed - Lay feed
router.get('/feed', OptionalLogin, async function (req, res, next) {
  try {
    let page = parseInt(req.query.page) || 1;
    let size = parseInt(req.query.size) || 20;
    let posts = await postController.GetFeed(req.user ? req.user._id : null, page, size);
    res.send(posts);
  } catch (err) {
    res.status(400).send({ message: err.message });
  }
});

// GET /api/posts/me - Posts cua minh
router.get('/me', CheckLogin, async function (req, res, next) {
  try {
    let posts = await postController.GetMyPosts(req.user._id);
    res.send(posts);
  } catch (err) {
    res.status(400).send({ message: err.message });
  }
});

// GET /api/posts/profile/:userId - Posts cua user khac
router.get('/profile/:userId', OptionalLogin, async function (req, res, next) {
  try {
    let viewerId = req.user ? req.user._id : null;
    let targetUserId = req.params.userId;

    // Check privacy
    if (viewerId) {
      let canView = await postController.CanViewPosts(viewerId, targetUserId);
      if (!canView) {
        return res.status(403).send({ message: "You cannot view this user's posts" });
      }
    }

    let posts = await postController.GetUserPosts(targetUserId, viewerId);
    res.send(posts);
  } catch (err) {
    res.status(400).send({ message: err.message });
  }
});

// GET /api/posts/:id - Chi tiet 1 post
router.get('/:id', async function (req, res, next) {
  try {
    let post = await postController.GetPostDetail(req.params.id);
    if (!post) {
      return res.status(404).send({ message: "Post not found" });
    }
    res.send(post);
  } catch (err) {
    res.status(404).send({ message: "Post not found" });
  }
});

// PUT /api/posts/:id - Sua post
router.put('/:id', CheckLogin, async function (req, res, next) {
  try {
    let post = await postModel.findOne({ _id: req.params.id, isDeleted: false });
    if (!post) {
      return res.status(404).send({ message: "Post not found" });
    }
    if (post.user.toString() !== req.user._id.toString()) {
      return res.status(403).send({ message: "Not your post" });
    }

    if (req.body.content !== undefined) post.content = req.body.content;
    if (req.body.imageUrl !== undefined) post.imageUrl = req.body.imageUrl;
    await post.save();

    let updated = await postController.GetPostDetail(post._id);
    res.send(updated);
    // Broadcast Realtime Event
    broadcastPostEvent('POST_UPDATED', updated);
  } catch (err) {
    res.status(400).send({ message: err.message });
  }
});

// DELETE /api/posts/:id - Xoa post (soft delete)
router.delete('/:id', CheckLogin, async function (req, res, next) {
  try {
    let post = await postModel.findOne({ _id: req.params.id, isDeleted: false });
    if (!post) {
      return res.status(404).send({ message: "Post not found" });
    }
    if (post.user.toString() !== req.user._id.toString()) {
      return res.status(403).send({ message: "Not your post" });
    }
    post.isDeleted = true;
    await post.save();
    res.send({ message: "Post deleted" });
    // Broadcast Realtime Event
    broadcastPostEvent('POST_DELETED', { postId: post._id });
  } catch (err) {
    res.status(400).send({ message: err.message });
  }
});

module.exports = router;
