let mongoose = require('mongoose');

let communityMemberSchema = mongoose.Schema(
  {
    community: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'community',
      required: true
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'user',
      required: true
    },
    role: {
      type: String,
      enum: ['ADMIN', 'MODERATOR', 'MEMBER'],
      default: 'MEMBER'
    },
    status: {
      type: String,
      enum: ['PENDING', 'APPROVED'],
      default: 'APPROVED'
    },
    joinedAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

// One user can only have one record per community
communityMemberSchema.index({ community: 1, user: 1 }, { unique: true });

module.exports = mongoose.model('communityMember', communityMemberSchema);
