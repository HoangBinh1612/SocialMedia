var express = require("express");
var router = express.Router();
let userModel = require('../schemas/users');
let { CheckLogin } = require('../utils/authHandler');

// GET /api/settings/privacy
router.get('/privacy', CheckLogin, function (req, res, next) {
  let user = req.user;
  res.send({
    privacyPosts: user.privacyPosts,
    privacyFriendRequests: user.privacyFriendRequests,
    privacyFriendList: user.privacyFriendList
  });
});

// PUT /api/settings/privacy
router.put('/privacy', CheckLogin, async function (req, res, next) {
  try {
    let user = req.user;
    let { privacyPosts, privacyFriendRequests, privacyFriendList } = req.body;
    let updateData = {};

    if (privacyPosts && ['PUBLIC', 'FRIENDS', 'ONLY_ME'].includes(privacyPosts)) {
      updateData.privacyPosts = privacyPosts;
    }
    if (privacyFriendRequests && ['EVERYONE', 'FRIENDS_OF_FRIENDS', 'NOBODY'].includes(privacyFriendRequests)) {
      updateData.privacyFriendRequests = privacyFriendRequests;
    }
    if (privacyFriendList && ['PUBLIC', 'FRIENDS', 'ONLY_ME'].includes(privacyFriendList)) {
      updateData.privacyFriendList = privacyFriendList;
    }

    let updated = await userModel.findByIdAndUpdate(user._id, updateData, { new: true });
    res.send({
      privacyPosts: updated.privacyPosts,
      privacyFriendRequests: updated.privacyFriendRequests,
      privacyFriendList: updated.privacyFriendList
    });
  } catch (err) {
    res.status(400).send({ message: err.message });
  }
});

module.exports = router;
