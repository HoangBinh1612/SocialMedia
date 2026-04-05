let groupModel = require("../schemas/groups");
let messageModel = require("../schemas/messages");

module.exports = {
  CreateGroup: async function (userId, name, memberIds) {
    // Add creator to member list if not included
    let allMembers = new Set(memberIds);
    allMembers.add(userId.toString());
    
    let group = new groupModel({
      name: name,
      creator: userId,
      members: Array.from(allMembers),
      isDeleted: false
    });
    
    await group.save();
    return await groupModel.findById(group._id)
      .populate('creator', 'username fullName avatarUrl')
      .populate('members', 'username fullName avatarUrl');
  },

  AddMembers: async function (groupId, memberIds) {
    let group = await groupModel.findById(groupId);
    if (!group || group.isDeleted) throw new Error("Group not found");
    
    // Add new members avoiding duplicates
    let updatedMembers = new Set(group.members.map(m => m.toString()));
    memberIds.forEach(id => updatedMembers.add(id.toString()));
    
    group.members = Array.from(updatedMembers);
    await group.save();
    return await groupModel.findById(groupId)
      .populate('creator', 'username fullName avatarUrl')
      .populate('members', 'username fullName avatarUrl');
  },

  LeaveGroup: async function (groupId, userId) {
    let group = await groupModel.findById(groupId);
    if (!group || group.isDeleted) throw new Error("Group not found");
    
    // Creator cannot leave, they must delete or transfer (we just prevent it for now or let them delete)
    if (group.creator.toString() === userId.toString()) {
      throw new Error("Creator cannot leave the group. Delete it instead.");
    }

    group.members = group.members.filter(m => m.toString() !== userId.toString());
    await group.save();
    return true;
  },

  DeleteGroup: async function (groupId, userId) {
    let group = await groupModel.findById(groupId);
    if (!group || group.isDeleted) throw new Error("Group not found");
    
    if (group.creator.toString() !== userId.toString()) {
      throw new Error("Only the creator can delete the group");
    }
    
    // Soft delete the group
    group.isDeleted = true;
    await group.save();
    
    // Soft delete all messages in this group
    await messageModel.updateMany({ group: groupId }, { isDeleted: true });
    return true;
  },

  GetMyGroups: async function (userId) {
    return await groupModel.find({
      members: userId,
      isDeleted: false
    })
    .populate('creator', 'username fullName avatarUrl')
    .populate('members', 'username fullName avatarUrl')
    .sort({ createdAt: -1 });
  },

  GetGroup: async function (groupId) {
    return await groupModel.findOne({ _id: groupId, isDeleted: false })
      .populate('creator', 'username fullName avatarUrl')
      .populate('members', 'username fullName avatarUrl');
  }
};
