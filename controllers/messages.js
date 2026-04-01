let messageModel = require("../schemas/messages");

module.exports = {
  GetConversation: async function (userId, otherId, page, size) {
    page = page || 1;
    size = size || 50;
    let skip = (page - 1) * size;

    return await messageModel.find({
      isDeleted: false,
      group: null,
      $or: [
        { sender: userId, receiver: otherId },
        { sender: otherId, receiver: userId }
      ]
    }).populate({ path: 'sender', select: 'username fullName avatarUrl' })
      .populate({ path: 'receiver', select: 'username fullName avatarUrl' })
      .sort({ createdAt: 1 })
      .skip(skip)
      .limit(size);
  },

  GetGroupConversation: async function (groupId, page, size) {
    page = page || 1;
    size = size || 50;
    let skip = (page - 1) * size;

    return await messageModel.find({
      isDeleted: false,
      group: groupId
    }).populate({ path: 'sender', select: 'username fullName avatarUrl' })
      .sort({ createdAt: 1 })
      .skip(skip)
      .limit(size);
  },

  SendGroupMessage: async function (fromId, groupId, content, imageUrl, videoUrl) {
    let msg = new messageModel({
      content: content || "",
      imageUrl: imageUrl || "",
      videoUrl: videoUrl || "",
      sender: fromId,
      group: groupId,
      status: false
    });
    await msg.save();
    return await messageModel.findById(msg._id)
      .populate({ path: 'sender', select: 'username fullName avatarUrl' });
  },

  SendMessage: async function (fromId, toId, content, imageUrl, videoUrl) {
    let msg = new messageModel({
      content: content || "",
      imageUrl: imageUrl || "",
      videoUrl: videoUrl || "",
      sender: fromId,
      receiver: toId,
      status: false
    });
    await msg.save();
    return await messageModel.findById(msg._id)
      .populate({ path: 'sender', select: 'username fullName avatarUrl' })
      .populate({ path: 'receiver', select: 'username fullName avatarUrl' });
  },

  MarkRead: async function (userId, messageId) {
    let msg = await messageModel.findById(messageId);
    if (!msg) return null;
    
    if (msg.group) {
      if (!msg.readBy.includes(userId)) {
        msg.readBy.push(userId);
        await msg.save();
      }
      return msg;
    } else {
      if (msg.receiver?.toString() !== userId.toString()) return 'FORBIDDEN';
      msg.status = true;
      msg.readAt = new Date();
      await msg.save();
      return msg;
    }
  },

  MarkAllReadFromUser: async function (userId, otherUserId) {
    await messageModel.updateMany(
      { sender: otherUserId, receiver: userId, status: false, group: null },
      { status: true, readAt: new Date() }
    );
    return true;
  },

  MarkAllReadGroup: async function (userId, groupId) {
    await messageModel.updateMany(
      { group: groupId, readBy: { $ne: userId } },
      { $push: { readBy: userId } }
    );
    return true;
  },

  CountUnread: async function (userId) {
    const mongoose = require('mongoose');
    let oId = new mongoose.Types.ObjectId(userId);

    let unreadIndividuals = await messageModel.aggregate([
      { $match: { receiver: oId, status: false, group: null, isDeleted: false } },
      { $group: { _id: "$sender" } }
    ]);

    let groupModel = require('../schemas/groups');
    let myGroups = await groupModel.find({ members: oId, isDeleted: false });
    let myGroupIds = myGroups.map(g => g._id);

    let unreadGroups = await messageModel.aggregate([
      { $match: { 
          group: { $in: myGroupIds }, 
          sender: { $ne: oId }, 
          readBy: { $ne: oId }, 
          isDeleted: false 
      }},
      { $group: { _id: "$group" } }
    ]);

    return unreadIndividuals.length + unreadGroups.length;
  },

  GetUnreadList: async function (userId) {
    const mongoose = require('mongoose');
    let oId = new mongoose.Types.ObjectId(userId);

    let unreads = await messageModel.aggregate([
      { $match: { receiver: oId, status: false, group: null, isDeleted: false } },
      { $group: { _id: "$sender" } }
    ]);

    let groupModel = require('../schemas/groups');
    let myGroups = await groupModel.find({ members: oId, isDeleted: false });
    let myGroupIds = myGroups.map(g => g._id);

    let unreadGroups = await messageModel.aggregate([
      { $match: { 
          group: { $in: myGroupIds }, 
          sender: { $ne: oId }, 
          readBy: { $ne: oId }, 
          isDeleted: false 
      }},
      { $group: { _id: "$group" } }
    ]);

    return {
      friendIds: unreads.map(u => u._id.toString()),
      groupIds: unreadGroups.map(g => g._id.toString())
    };
  },

  GetRecentConversations: async function (userId) {
    const mongoose = require('mongoose');
    let oId = new mongoose.Types.ObjectId(userId);
    let messages = await messageModel.find({
      isDeleted: false,
      group: null,
      $or: [{ sender: oId }, { receiver: oId }]
    }).sort({ createdAt: -1 })
      .populate({ path: 'sender', select: 'username fullName avatarUrl' })
      .populate({ path: 'receiver', select: 'username fullName avatarUrl' });

    // Lay tin nhan cuoi cung cua moi cuoc hoi thoai
    let conversationMap = new Map();
    for (let msg of messages) {
      let otherUser = msg.sender._id.toString() === userId.toString()
        ? msg.receiver._id.toString()
        : msg.sender._id.toString();
      if (!conversationMap.has(otherUser)) {
        conversationMap.set(otherUser, msg);
      }
    }

    let result = [];
    conversationMap.forEach(function (msg, otherUserId) {
      let otherUser = msg.sender._id.toString() === userId.toString() ? msg.receiver : msg.sender;
      result.push({
        user: otherUser,
        lastMessage: msg
      });
    });
    return result;
  },

  ToMessageResponse: function (msg) {
    if (!msg) return null;
    return msg.toObject ? msg.toObject() : msg;
  }
}
