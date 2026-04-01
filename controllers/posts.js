let postModel = require("../schemas/posts");
let commentModel = require("../schemas/comments");
let reactionModel = require("../schemas/reactions");
let friendModel = require("../schemas/friends");

module.exports = {
  CreatePost: async function (userId, content, imageUrl, videoUrl, feeling, location) {
    let newPost = new postModel({
      content: content || "",
      imageUrl: imageUrl || "",
      videoUrl: videoUrl || "",
      feeling: feeling || "",
      location: location || "",
      user: userId
    });
    await newPost.save();
    return await postModel.findById(newPost._id).populate({
      path: 'user',
      select: 'username fullName avatarUrl'
    });
  },

  GetFeed: async function (viewerId, page, size) {
    // Get my approved communities
    const communityMemberModel = require("../schemas/communityMembers");
    let myCommunityIds = [];
    if (viewerId) {
      const myMemberships = await communityMemberModel.find({ user: viewerId, status: 'APPROVED' }).populate('community');
      myCommunityIds = myMemberships
        .filter(m => m.community && m.community.isDeleted === false)
        .map(m => m.community._id);
    }

    // Get ALL personal posts (community: null) OR posts in my communities
    const allPosts = await postModel.find({
      isDeleted: false,
      $or: [
        { community: null },
        { community: { $exists: false } },
        { community: { $in: myCommunityIds } }
      ]
    })
      .populate({ path: 'user', select: 'username fullName avatarUrl privacyPosts' })
      .populate({ path: 'community', select: 'name coverUrl' })
      .sort({ createdAt: -1 });

    // Filter using CanViewPosts for personal posts
    let visiblePosts = [];
    for (let post of allPosts) {
      if (!post.user) continue; // Safety check
      
      // If it's a community post, it's already filtered by our query (user is member)
      if (post.community) {
        visiblePosts.push(post);
        continue;
      }

      let canView = false;
      if (!viewerId || post.user._id.toString() === viewerId?.toString()) {
        canView = true;
      } else {
        const privacy = post.user.privacyPosts || 'PUBLIC';
        if (privacy === 'PUBLIC') canView = true;
        else if (privacy === 'ONLY_ME') canView = false;
        else if (privacy === 'FRIENDS') {
          let friendship = await friendModel.findOne({
            $or: [
              { user: viewerId, friendUser: post.user._id, status: 1 },
              { user: post.user._id, friendUser: viewerId, status: 1 }
            ]
          });
          if (friendship) canView = true;
        }
      }
      if (canView) visiblePosts.push(post);
    }

    // Now apply pagination
    let skip = (page - 1) * size;
    let paginatedPosts = visiblePosts.slice(skip, skip + size);

    // Attach comment count va reaction count
    let result = [];
    for (let post of paginatedPosts) {
      let commentCount = await commentModel.countDocuments({ post: post._id, isDeleted: false });
      let reactionCount = await reactionModel.countDocuments({ post: post._id });
      let obj = post.toObject();
      obj.commentCount = commentCount;
      obj.reactionCount = reactionCount;
      result.push(obj);
    }
    return result;
  },

  GetMyPosts: async function (userId) {
    let posts = await postModel.find({ user: userId, isDeleted: false })
      .populate({ path: 'user', select: 'username fullName avatarUrl' })
      .sort({ createdAt: -1 });

    let result = [];
    for (let post of posts) {
      let commentCount = await commentModel.countDocuments({ post: post._id, isDeleted: false });
      let reactionCount = await reactionModel.countDocuments({ post: post._id });
      let obj = post.toObject();
      obj.commentCount = commentCount;
      obj.reactionCount = reactionCount;
      result.push(obj);
    }
    return result;
  },

  GetPostDetail: async function (postId) {
    let post = await postModel.findOne({ _id: postId, isDeleted: false })
      .populate({ path: 'user', select: 'username fullName avatarUrl' });
    if (!post) return null;

    let commentCount = await commentModel.countDocuments({ post: post._id, isDeleted: false });
    let reactionCount = await reactionModel.countDocuments({ post: post._id });
    let obj = post.toObject();
    obj.commentCount = commentCount;
    obj.reactionCount = reactionCount;
    return obj;
  },

  GetUserPosts: async function (userId, viewerId) {
    let posts = await postModel.find({ user: userId, isDeleted: false })
      .populate({ path: 'user', select: 'username fullName avatarUrl privacyPosts' })
      .sort({ createdAt: -1 });

    let result = [];
    for (let post of posts) {
      let commentCount = await commentModel.countDocuments({ post: post._id, isDeleted: false });
      let reactionCount = await reactionModel.countDocuments({ post: post._id });
      let obj = post.toObject();
      obj.commentCount = commentCount;
      obj.reactionCount = reactionCount;
      result.push(obj);
    }
    return result;
  },

  // Check quyen xem posts cua user khac
  CanViewPosts: async function (viewerId, targetUserId) {
    if (!viewerId) return false;
    if (viewerId.toString() === targetUserId.toString()) return true;

    let targetUser = await require('../schemas/users').findById(targetUserId);
    if (!targetUser) return false;

    let privacy = targetUser.privacyPosts;
    if (privacy === 'PUBLIC') return true;
    if (privacy === 'ONLY_ME') return false;

    // FRIENDS: check co phai ban be khong
    if (privacy === 'FRIENDS') {
      let friendship = await friendModel.findOne({
        $or: [
          { user: viewerId, friendUser: targetUserId, status: 1 },
          { user: targetUserId, friendUser: viewerId, status: 1 }
        ]
      });
      return !!friendship;
    }
    return false;
  }
}
