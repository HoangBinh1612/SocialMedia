let mongoose = require('mongoose');

let groupSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true
    },
    avatarUrl: {
      type: String,
      default: ""
    },
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'user',
      required: true
    },
    members: [{
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

module.exports = mongoose.model('group', groupSchema);
