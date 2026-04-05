let storyModel = require('../schemas/stories');
let friendModel = require('../schemas/friends');
let userModel = require('../schemas/users'); // we need userModel to find info

module.exports = {
  CreateStory: async function (userId, mediaType, mediaUrl, text, background) {
    let newStory = new storyModel({
      user: userId,
      mediaType: mediaType || 'IMAGE',
      mediaUrl: mediaUrl || '',
      text: text || '',
      background: background || '#E88DB5'
    });
    await newStory.save();
    return await storyModel.findById(newStory._id).populate('user', 'username fullName avatarUrl');
  },

  DeleteStory: async function(userId, storyId) {
    let story = await storyModel.findOne({ _id: storyId, user: userId });
    if (!story) throw new Error("Story not found or unauthorized");
    await storyModel.findByIdAndDelete(storyId);
    return true;
  },

  GetFeedStories: async function (viewerId) {
    // 1. Get list of friends (accepted friends)
    let friendsResult = await friendModel.find({
      $or: [{ user: viewerId }, { friendUser: viewerId }],
      status: 1 // 1 is ACCEPTED in schema
    });
    
    // Extract friend IDs
    let friendIds = friendsResult.map(f => {
      return (f.user.toString() === viewerId.toString()) ? f.friendUser : f.user;
    });
    
    // Always include myself so I can see my own active stories
    let allowedUserIds = [...friendIds, viewerId];

    // 2. Fetch all stories strictly from these users
    // (Old stories expire automatically via TTL, so we just query all remaining ones)
    let stories = await storyModel.find({
      user: { $in: allowedUserIds }
    }).populate('user', 'username fullName avatarUrl')
      .sort({ createdAt: 1 }); // Oldest first so viewing progresses chronologically

    // 3. Group stories by user for Facebook-like display
    // e.g. { userId1: { userDetails, stories: [...] }, userId2: ... }
    let grouped = {};
    for (let s of stories) {
      let uid = s.user._id.toString();
      if (!grouped[uid]) {
        grouped[uid] = {
          user: s.user,
          stories: []
        };
      }
      grouped[uid].stories.push(s);
    }

    // Convert object cache to array
    return Object.values(grouped);
  }
};
