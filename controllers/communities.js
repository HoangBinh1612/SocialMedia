const Community = require('../schemas/communities');
const CommunityMember = require('../schemas/communityMembers');
const Post = require('../schemas/posts');
const mongoose = require('mongoose');

module.exports = {
  CreateCommunity: async function (userId, name, description, coverUrl, privacy) {
    let community = new Community({
      name,
      description,
      coverUrl,
      privacy: privacy || 'PUBLIC',
      createdBy: userId,
      memberCount: 1
    });
    await community.save();

    let adminMember = new CommunityMember({
      community: community._id,
      user: userId,
      role: 'ADMIN',
      status: 'APPROVED'
    });
    await adminMember.save();

    return community;
  },

  GetMyCommunities: async function (userId) {
    let members = await CommunityMember.find({ user: userId, status: 'APPROVED' })
      .populate('community');
      
    let validComms = members.filter(m => m.community && !m.community.isDeleted);
    
    let owned = validComms.filter(m => m.role === 'ADMIN').map(m => m.community);
    let joined = validComms.filter(m => m.role === 'MEMBER').map(m => m.community);

    return { owned, joined };
  },

  GetSuggestedCommunities: async function (userId) {
    // Find communities the user is NOT a part of
    let myMemberships = await CommunityMember.find({ user: userId });
    let myCommunityIds = myMemberships.map(m => m.community);

    let suggestions = await Community.find({
      _id: { $nin: myCommunityIds },
      isDeleted: false
    }).sort({ memberCount: -1 }).limit(5);

    return suggestions;
  },

  GetCommunity: async function (communityId, userId) {
    let community = await Community.findOne({ _id: communityId, isDeleted: false });
    if (!community) return null;

    let member = await CommunityMember.findOne({ community: communityId, user: userId });
    
    // Return the community object with user logic injected
    let result = community.toObject();
    result.myRole = member ? member.role : null;
    result.myStatus = member ? member.status : 'NOT_JOINED';
    
    return result;
  },

  JoinCommunity: async function (communityId, userId) {
    let community = await Community.findById(communityId);
    if (!community) throw new Error("Community not found");

    let existing = await CommunityMember.findOne({ community: communityId, user: userId });
    if (existing) throw new Error("Already requested or joined");

    let status = community.privacy === 'PUBLIC' ? 'APPROVED' : 'PENDING';
    
    let member = new CommunityMember({
      community: communityId,
      user: userId,
      role: 'MEMBER',
      status: status
    });
    await member.save();

    if (status === 'APPROVED') {
      community.memberCount += 1;
      await community.save();
    }

    return member;
  },

  GetPendingRequests: async function(communityId, userId) {
    let adminCheck = await CommunityMember.findOne({ community: communityId, user: userId, role: 'ADMIN' });
    if (!adminCheck) throw new Error("Unauthorized");

    return await CommunityMember.find({ community: communityId, status: 'PENDING' })
      .populate('user', 'username fullName avatarUrl');
  },

  ApproveRequest: async function(communityId, adminId, targetUserId) {
    let adminCheck = await CommunityMember.findOne({ community: communityId, user: adminId, role: 'ADMIN' });
    if (!adminCheck) throw new Error("Unauthorized");

    let member = await CommunityMember.findOne({ community: communityId, user: targetUserId, status: 'PENDING' });
    if (!member) throw new Error("Request not found");

    member.status = 'APPROVED';
    await member.save();

    await Community.findByIdAndUpdate(communityId, { $inc: { memberCount: 1 } });
    return member;
  },

  GetCommunityPosts: async function (communityId, userId) {
    let community = await Community.findById(communityId);
    if (!community) return [];

    if (community.privacy === 'PRIVATE') {
      let isMember = await CommunityMember.findOne({ community: communityId, user: userId, status: 'APPROVED' });
      if (!isMember) throw new Error("Private community");
    }

    let posts = await Post.find({ community: communityId, isDeleted: false })
      .sort({ createdAt: -1 })
      .populate('user', 'username fullName avatarUrl');
    
    return posts;
  },

  CreateCommunityPost: async function (communityId, userId, content, imageUrl, videoUrl, feeling, location) {
    let isMember = await CommunityMember.findOne({ community: communityId, user: userId, status: 'APPROVED' });
    if (!isMember) throw new Error("Not a member");

    let post = new Post({
      content, imageUrl, videoUrl,
      feeling, location,
      user: userId,
      community: communityId
    });
    await post.save();
    return await post.populate('user', 'username fullName avatarUrl');
  },

  LeaveCommunity: async function (communityId, userId) {
    let member = await CommunityMember.findOne({ community: communityId, user: userId });
    if (!member) throw new Error("Not a member");

    if (member.role === 'ADMIN') {
      throw new Error("Admin cannot leave, must delete community instead");
    }

    if (member.status === 'APPROVED') {
      await Community.findByIdAndUpdate(communityId, { $inc: { memberCount: -1 } });
    }
    await CommunityMember.findByIdAndDelete(member._id);
    return true;
  },

  DeleteCommunity: async function (communityId, userId) {
    let member = await CommunityMember.findOne({ community: communityId, user: userId, role: 'ADMIN' });
    if (!member) throw new Error("Unauthorized: Only admin can delete");

    // Soft delete the community
    await Community.findByIdAndUpdate(communityId, { isDeleted: true });
    
    // Soft delete all posts within the community to prevent them from showing up
    await Post.updateMany({ community: communityId }, { isDeleted: true });

    return true;
  },

  UpdateCover: async function (communityId, userId, coverUrl) {
    let member = await CommunityMember.findOne({ community: communityId, user: userId, role: 'ADMIN' });
    if (!member) throw new Error("Unauthorized");

    let community = await Community.findByIdAndUpdate(communityId, { coverUrl }, { new: true });
    return community;
  },

  UpdatePrivacy: async function (communityId, userId, privacy) {
    let member = await CommunityMember.findOne({ community: communityId, user: userId, role: 'ADMIN' });
    if (!member) throw new Error("Unauthorized: Only admin can change privacy");

    let community = await Community.findByIdAndUpdate(communityId, { privacy }, { new: true });
    return community;
  }
};
