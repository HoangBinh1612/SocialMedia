let mongoose = require('mongoose');

let commentSchema = mongoose.Schema(
  {
    content: {
      type: String,
      default: ""
    },
    imageUrl: {
      type: String,
      default: ""
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'user',
      required: true
    },
    post: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'post',
      required: true
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

module.exports = mongoose.model('comment', commentSchema);
