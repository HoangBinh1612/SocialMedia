let reactionModel = require("../schemas/reactions");
let postModel = require("../schemas/posts");
let notificationController = require("./notifications");

module.exports = {
  ReactPost: async function (postId, userId, type) {
    // Upsert: neu da react thi update type, chua thi tao moi
    let reaction = await reactionModel.findOneAndUpdate(
      { post: postId, user: userId },
      { type: type || 'like' },
      { upsert: true, new: true }
    );

    // Create Notification
    let postInfo = await postModel.findById(postId);
    if (postInfo && postInfo.user.toString() !== userId.toString()) {
      const isLike = type && type.toLowerCase() === 'like';
      await notificationController.CreateNotification(
        isLike ? 'LIKE' : 'REACTION',
        postInfo.user, // to
        userId,        // actor
        postId,
        isLike ? 'đã thích bài viết của bạn' : 'đã bày tỏ cảm xúc về bài viết của bạn'
      );
    }
    
    return reaction;
  },

  UnreactPost: async function (postId, userId) {
    let result = await reactionModel.findOneAndDelete({ post: postId, user: userId });
    return result;
  },

  CountReactions: async function (postId) {
    let total = await reactionModel.countDocuments({ post: postId });
    // Dem theo tung loai
    let byType = await reactionModel.aggregate([
      { $match: { post: require('mongoose').Types.ObjectId.createFromHexString(postId) } },
      { $group: { _id: '$type', count: { $sum: 1 } } }
    ]);
    let typeMap = {};
    byType.forEach(function (item) {
      typeMap[item._id] = item.count;
    });
    return { total, byType: typeMap };
  },

  CountByType: async function (postId, type) {
    return await reactionModel.countDocuments({ post: postId, type: type });
  },

  GetMyReaction: async function (postId, userId) {
    return await reactionModel.findOne({ post: postId, user: userId });
  },

  GetReactionsByPost: async function (postId) {
    return await reactionModel.find({ post: postId })
      .populate({ path: 'user', select: 'username fullName avatarUrl' });
  }
}
