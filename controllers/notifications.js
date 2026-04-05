let notificationModel = require("../schemas/notifications");

module.exports = {
  CreateNotification: async function (type, userId, actorId, postId, message) {
    // Khong tao notification cho chinh minh
    if (userId.toString() === actorId.toString()) return null;

    let notif = new notificationModel({
      type: type,
      user: userId,
      actor: actorId,
      post: postId || null,
      message: message || ""
    });
    await notif.save();
    return await notificationModel.findById(notif._id)
      .populate({ path: 'actor', select: 'username fullName avatarUrl' })
      .populate({ path: 'post', select: 'content imageUrl' });
  },

  GetNotifications: async function (userId, page, size) {
    page = page || 1;
    size = size || 20;
    let skip = (page - 1) * size;

    return await notificationModel.find({ user: userId, isDeleted: false })
      .populate({ path: 'actor', select: 'username fullName avatarUrl' })
      .populate({ path: 'post', select: 'content imageUrl' })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(size);
  },

  MarkAsRead: async function (notificationId) {
    return await notificationModel.findByIdAndUpdate(notificationId, { isRead: true }, { new: true });
  },

  CountUnread: async function (userId) {
    return await notificationModel.countDocuments({ user: userId, isRead: false, isDeleted: false });
  },

  MarkAllAsRead: async function (userId) {
    await notificationModel.updateMany(
      { user: userId, isRead: false },
      { isRead: true }
    );
    return true;
  }
}
