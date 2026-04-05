let commentModel = require("../schemas/comments");
let postModel = require("../schemas/posts");
let notificationController = require("./notifications");

module.exports = {
  CreateComment: async function (userId, postId, content, imageUrl) {
    let newComment = new commentModel({
      content: content,
      imageUrl: imageUrl || "",
      user: userId,
      post: postId
    });
    await newComment.save();
    
    // Create Notification
    let postInfo = await postModel.findById(postId);
    if (postInfo && postInfo.user.toString() !== userId.toString()) {
      await notificationController.CreateNotification(
        'COMMENT',
        postInfo.user, // to
        userId,        // actor
        postId,
        `đã bình luận: "${content.substring(0, 50)}${content.length > 50 ? '...' : ''}"`
      );
    }

    return await commentModel.findById(newComment._id).populate({
      path: 'user',
      select: 'username fullName avatarUrl'
    });
  },

  GetByPost: async function (postId) {
    return await commentModel.find({ post: postId, isDeleted: false })
      .populate({ path: 'user', select: 'username fullName avatarUrl' })
      .sort({ createdAt: 1 });
  },

  UpdateComment: async function (userId, commentId, content) {
    let comment = await commentModel.findOne({ _id: commentId, isDeleted: false });
    if (!comment) return null;
    if (comment.user.toString() !== userId.toString()) return 'FORBIDDEN';
    comment.content = content;
    await comment.save();
    return await commentModel.findById(commentId).populate({
      path: 'user',
      select: 'username fullName avatarUrl'
    });
  },

  DeleteComment: async function (userId, commentId) {
    let comment = await commentModel.findOne({ _id: commentId, isDeleted: false });
    if (!comment) return null;
    if (comment.user.toString() !== userId.toString()) return 'FORBIDDEN';
    comment.isDeleted = true;
    await comment.save();
    return true;
  }
}
