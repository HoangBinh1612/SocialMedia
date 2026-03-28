let mongoose = require('mongoose');

let friendSchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'user',
      required: true
    },
    friendUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'user',
      required: true
    },
    // 0 = PENDING, 1 = ACCEPTED, 2 = BLOCKED
    status: {
      type: Number,
      enum: [0, 1, 2],
      default: 0
    }
  },
  {
    timestamps: true
  }
);

// Moi cap user chi co 1 friend record
friendSchema.index({ user: 1, friendUser: 1 }, { unique: true });

module.exports = mongoose.model('friend', friendSchema);
