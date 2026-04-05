let friendModel = require("../schemas/friends");
let userModel = require("../schemas/users");
let notificationController = require("./notifications");

module.exports = {
  SendFriendRequest: async function (userId, targetId) {
    if (userId.toString() === targetId.toString()) throw new Error("Cannot add yourself");

    // Check da co record chua
    let existing = await friendModel.findOne({
      $or: [
        { user: userId, friendUser: targetId },
        { user: targetId, friendUser: userId }
      ]
    });
    if (existing) {
      if (existing.status === 1) throw new Error("Already friends");
      if (existing.status === 0) throw new Error("Request already pending");
      if (existing.status === 2) throw new Error("User is blocked");
    }

    let request = new friendModel({
      user: userId,
      friendUser: targetId,
      status: 0 // PENDING
    });
    await request.save();

    await notificationController.CreateNotification(
      'FRIEND_REQUEST',
      targetId, // to
      userId,   // actor
      null,
      'đã gửi cho bạn một lời mời kết bạn'
    );

    return request;
  },

  AcceptFriendRequest: async function (userId, fromUserId) {
    let request = await friendModel.findOne({
      user: fromUserId,
      friendUser: userId,
      status: 0
    });
    if (!request) return null;
    request.status = 1; // ACCEPTED
    await request.save();

    await notificationController.CreateNotification(
      'FRIEND_ACCEPT',
      fromUserId, // to
      userId,     // actor
      null,
      'đã chấp nhận lời mời kết bạn của bạn'
    );

    return request;
  },

  RejectFriendRequest: async function (userId, fromUserId) {
    let result = await friendModel.findOneAndDelete({
      user: fromUserId,
      friendUser: userId,
      status: 0
    });
    return result;
  },

  RemoveFriend: async function (userId, friendUserId) {
    let result = await friendModel.findOneAndDelete({
      $or: [
        { user: userId, friendUser: friendUserId, status: 1 },
        { user: friendUserId, friendUser: userId, status: 1 }
      ]
    });
    return result;
  },

  BlockUser: async function (userId, targetId) {
    // Xoa ket ban hien tai neu co
    await friendModel.findOneAndDelete({
      $or: [
        { user: userId, friendUser: targetId },
        { user: targetId, friendUser: userId }
      ]
    });
    // Tao record block
    let block = new friendModel({
      user: userId,
      friendUser: targetId,
      status: 2 // BLOCKED
    });
    await block.save();
    return block;
  },

  GetPendingRequests: async function (userId) {
    return await friendModel.find({
      friendUser: userId,
      status: 0
    }).populate({ path: 'user', select: 'username fullName avatarUrl' })
      .sort({ createdAt: -1 });
  },

  GetFriendsList: async function (userId) {
    let friends = await friendModel.find({
      $or: [
        { user: userId, status: 1 },
        { friendUser: userId, status: 1 }
      ]
    }).populate({ path: 'user', select: 'username fullName avatarUrl' })
      .populate({ path: 'friendUser', select: 'username fullName avatarUrl' });

    // Tra ve danh sach user (khong phai chinh minh)
    return friends.map(function (f) {
      let friendData = f.user._id.toString() === userId.toString() ? f.friendUser : f.user;
      return {
        _id: f._id,
        friend: friendData,
        createdAt: f.createdAt
      };
    });
  },

  GetSuggestions: async function (userId, limit) {
    limit = limit || 10;
    // Lay tat ca user chua ket ban
    let friendRecords = await friendModel.find({
      $or: [{ user: userId }, { friendUser: userId }]
    });
    let excludeIds = [userId];
    friendRecords.forEach(function (f) {
      excludeIds.push(f.user.toString());
      excludeIds.push(f.friendUser.toString());
    });

    let suggestions = await userModel.find({
      _id: { $nin: excludeIds },
      isDeleted: false,
      status: true
    }).select('username fullName avatarUrl').limit(limit);
    return suggestions;
  },

  GetFriendshipStatus: async function (userId, targetId) {
    if (userId.toString() === targetId.toString()) return { status: 'SELF' };

    let record = await friendModel.findOne({
      $or: [
        { user: userId, friendUser: targetId },
        { user: targetId, friendUser: userId }
      ]
    });
    if (!record) return { status: 'NONE' };
    if (record.status === 1) return { status: 'FRIENDS' };
    if (record.status === 2) return { status: 'BLOCKED' };
    // PENDING: ai gui?
    if (record.user.toString() === userId.toString()) {
      return { status: 'PENDING_SENT' };
    } else {
      return { status: 'PENDING_RECEIVED' };
    }
  },

  CanViewFriendList: async function (viewerId, userId) {
    if (!viewerId) return false;
    if (viewerId.toString() === userId.toString()) return true;

    let targetUser = await userModel.findById(userId);
    if (!targetUser) return false;

    let privacy = targetUser.privacyFriendList;
    if (privacy === 'PUBLIC') return true;
    if (privacy === 'ONLY_ME') return false;
    if (privacy === 'FRIENDS') {
      let friendship = await friendModel.findOne({
        $or: [
          { user: viewerId, friendUser: userId, status: 1 },
          { user: userId, friendUser: viewerId, status: 1 }
        ]
      });
      return !!friendship;
    }
    return false;
  },

  AreFriends: async function (userId1, userId2) {
    let friendship = await friendModel.findOne({
      $or: [
        { user: userId1, friendUser: userId2, status: 1 },
        { user: userId2, friendUser: userId1, status: 1 }
      ]
    });
    return !!friendship;
  }
}
