let mongoose = require('mongoose');

let notificationSchema = mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['LIKE', 'COMMENT', 'FRIEND_REQUEST', 'FRIEND_ACCEPT', 'POST', 'MESSAGE', 'GROUP_INVITE', 'REACTION'],
      required: true
    },
    isRead: {
      type: Boolean,
      default: false
    },
    message: {
      type: String,
      default: ""
    },
    // Nguoi nhan thong bao
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'user',
      required: true
    },
    // Nguoi thuc hien hanh dong
    actor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'user'
    },
    // Bai viet lien quan (neu co)
    post: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'post'
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

module.exports = mongoose.model('notification', notificationSchema);
