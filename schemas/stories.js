let mongoose = require('mongoose');

let storySchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'user',
      required: true
    },
    mediaType: {
      type: String,
      enum: ['TEXT', 'IMAGE', 'VIDEO'],
      default: 'IMAGE'
    },
    mediaUrl: {
      type: String,
      default: ""
    },
    text: {
      type: String,
      default: ""
    },
    background: {
      type: String,
      default: "#E88DB5" // Default gummy pink
    },
    createdAt: {
      type: Date,
      default: Date.now,
      expires: 86400 // The document will be automatically deleted after 24 hours (86400 seconds)
    }
  }
);

// Note: Mongoose sets up TTL indexes correctly only if they didn't exist before with a different setting.
// The `expires` attribute creates the TTL index in MongoDB.

module.exports = mongoose.model('story', storySchema);
