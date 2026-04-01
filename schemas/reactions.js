let mongoose = require('mongoose');

let reactionSchema = mongoose.Schema(
  {
    post: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'post',
      required: true
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'user',
      required: true
    },
    type: {
      type: String,
      enum: ['like', 'love', 'haha', 'wow', 'sad', 'angry'],
      default: 'like'
    }
  },
  {
    timestamps: true
  }
);

// Moi user chi duoc react 1 lan cho moi post
reactionSchema.index({ post: 1, user: 1 }, { unique: true });

module.exports = mongoose.model('reaction', reactionSchema);
