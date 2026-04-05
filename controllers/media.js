let postModel = require("../schemas/posts");
let commentModel = require("../schemas/comments");

module.exports = {
  GetMyMedia: async function (userId) {
    // Lấy bài viết có ảnh hoặc video
    let posts = await postModel.find({ 
      user: userId, 
      isDeleted: false,
      $or: [
        { imageUrl: { $ne: "" }, imageUrl: { $exists: true } },
        { videoUrl: { $ne: "" }, videoUrl: { $exists: true } }
      ]
    }).lean();

    // Lấy comment có ảnh
    let comments = await commentModel.find({
      user: userId,
      isDeleted: false,
      imageUrl: { $ne: "" },
      imageUrl: { $exists: true }
    }).lean();

    let mediaData = [];

    // Map bài viết
    for (let p of posts) {
      if (p.imageUrl) {
        mediaData.push({
          _id: p._id.toString() + "_img",
          url: p.imageUrl,
          type: "image",
          source: "post",
          postId: p._id,
          createdAt: p.createdAt
        });
      }
      if (p.videoUrl) {
        mediaData.push({
          _id: p._id.toString() + "_vid",
          url: p.videoUrl,
          type: "video",
          source: "post",
          postId: p._id,
          createdAt: p.createdAt
        });
      }
    }

    // Map bình luận
    for (let c of comments) {
      if (c.imageUrl) {
        mediaData.push({
          _id: c._id.toString() + "_comment",
          url: c.imageUrl,
          type: "image",
          source: "comment",
          postId: c.post,
          createdAt: c.createdAt
        });
      }
    }

    // Sort giảm dần (mới nhất hiển thị trước)
    mediaData.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return mediaData;
  }
};
