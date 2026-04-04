let mongoose = require('mongoose');

let communitySchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Community name is required"]
    },
    description: {
      type: String,
      default: ""
    },
    coverUrl: {
      type: String,
      default: ""
    },
    privacy: {
      type: String,
      enum: ['PUBLIC', 'PRIVATE'],
      default: 'PUBLIC'
    },
    memberCount: {
      type: Number,
      default: 1
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'user',
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

module.exports = mongoose.model('community', communitySchema);
