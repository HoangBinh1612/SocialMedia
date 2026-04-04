var express = require("express");
var router = express.Router();
let communitiesCtrl = require('../controllers/communities');
let { CheckLogin } = require('../utils/authHandler');

// GET /api/communities (returns my communities & suggestions)
router.get('/', CheckLogin, async function (req, res, next) {
  try {
    let myComms = await communitiesCtrl.GetMyCommunities(req.user._id);
    let suggests = await communitiesCtrl.GetSuggestedCommunities(req.user._id);
    res.send({ owned: myComms.owned, joined: myComms.joined, suggested: suggests });
  } catch (err) {
    res.status(400).send({ message: err.message });
  }
});

// POST /api/communities
router.post('/', CheckLogin, async function (req, res, next) {
  try {
    let { name, description, coverUrl, privacy } = req.body;
    if (!name) return res.status(400).send({ message: "Name is required" });
    
    let comm = await communitiesCtrl.CreateCommunity(req.user._id, name, description, coverUrl, privacy);
    res.status(201).send(comm);
  } catch (err) {
    res.status(400).send({ message: err.message });
  }
});

// GET /api/communities/:id
router.get('/:id', CheckLogin, async function (req, res, next) {
  try {
    let comm = await communitiesCtrl.GetCommunity(req.params.id, req.user._id);
    if (!comm) return res.status(404).send({ message: "Community not found" });
    res.send(comm);
  } catch (err) {
    res.status(400).send({ message: err.message });
  }
});

// POST /api/communities/:id/join
router.post('/:id/join', CheckLogin, async function (req, res, next) {
  try {
    let result = await communitiesCtrl.JoinCommunity(req.params.id, req.user._id);
    res.send(result);
  } catch (err) {
    res.status(400).send({ message: err.message });
  }
});

// GET /api/communities/:id/requests
router.get('/:id/requests', CheckLogin, async function (req, res, next) {
  try {
    let reqs = await communitiesCtrl.GetPendingRequests(req.params.id, req.user._id);
    res.send(reqs);
  } catch (err) {
    res.status(403).send({ message: err.message });
  }
});

// PUT /api/communities/:id/approve/:userId
router.put('/:id/approve/:userId', CheckLogin, async function (req, res, next) {
  try {
    let result = await communitiesCtrl.ApproveRequest(req.params.id, req.user._id, req.params.userId);
    res.send(result);
  } catch (err) {
    res.status(403).send({ message: err.message });
  }
});

// GET /api/communities/:id/posts
router.get('/:id/posts', CheckLogin, async function (req, res, next) {
  try {
    let posts = await communitiesCtrl.GetCommunityPosts(req.params.id, req.user._id);
    res.send(posts);
  } catch (err) {
    res.status(403).send({ message: err.message });
  }
});

// POST /api/communities/:id/posts
router.post('/:id/posts', CheckLogin, async function (req, res, next) {
  try {
    let { content, imageUrl, videoUrl, feeling, location } = req.body;
    let post = await communitiesCtrl.CreateCommunityPost(req.params.id, req.user._id, content, imageUrl, videoUrl, feeling, location);
    res.status(201).send(post);
  } catch (err) {
    res.status(400).send({ message: err.message });
  }
});
// POST /api/communities/:id/leave
router.post('/:id/leave', CheckLogin, async function (req, res, next) {
  try {
    await communitiesCtrl.LeaveCommunity(req.params.id, req.user._id);
    res.send({ success: true });
  } catch (err) {
    res.status(400).send({ message: err.message });
  }
});

// DELETE /api/communities/:id
router.delete('/:id', CheckLogin, async function (req, res, next) {
  try {
    await communitiesCtrl.DeleteCommunity(req.params.id, req.user._id);
    res.send({ success: true });
  } catch (err) {
    res.status(403).send({ message: err.message });
  }
});

// PUT /api/communities/:id/cover
router.put('/:id/cover', CheckLogin, async function (req, res, next) {
  try {
    let comm = await communitiesCtrl.UpdateCover(req.params.id, req.user._id, req.body.coverUrl);
    res.send(comm);
  } catch (err) {
    res.status(403).send({ message: err.message });
  }
});

// PUT /api/communities/:id/privacy
router.put('/:id/privacy', CheckLogin, async function (req, res, next) {
  try {
    let comm = await communitiesCtrl.UpdatePrivacy(req.params.id, req.user._id, req.body.privacy);
    res.send(comm);
  } catch (err) {
    res.status(403).send({ message: err.message });
  }
});

module.exports = router;
