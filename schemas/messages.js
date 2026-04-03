let mongoose = require('mongoose');

let messageSchema = mongoose.Schema(
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
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'user',
      required: true
    },
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'user'
    },
    group: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'group'
    },
    // true = da doc, false = chua doc
    status: {
      type: Boolean,
      default: false
    },
    readAt: {
      type: Date
    },
    readBy: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'user'
    }],
    isDeleted: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('message', messageSchema);
