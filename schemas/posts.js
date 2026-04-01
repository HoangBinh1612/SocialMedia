let mongoose = require('mongoose');

let postSchema = mongoose.Schema(
  {
    content: {
      type: String,
      default: ""
    },
    imageUrl: {
      type: String,
      default: ""
    },
    videoUrl: {
      type: String,
      default: ""
    },
    feeling: {
      type: String,
      default: ""
    },
    location: {
      type: String,
      default: ""
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'user',
      required: true
    },
    community: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'community',
      default: null
    },
    isDeleted: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('post', postSchema);
