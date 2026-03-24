const mongoose = require("mongoose");
let bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, "Username is required"],
      unique: true
    },
    password: {
      type: String,
      required: [true, "Password is required"]
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true
    },
    fullName: {
      type: String,
      default: ""
    },
    avatarUrl: {
      type: String,
      default: ""
    },
    coverUrl: {
      type: String,
      default: ""
    },
    bio: {
      type: String,
      default: ""
    },
    birthday: {
      type: Date
    },
    location: {
      type: String,
      default: ""
    },
    relationship: {
      type: String,
      default: ""
    },
    edu: {
      type: String,
      default: ""
    },
    phone: {
      type: String,
      default: ""
    },
    status: {
      type: Boolean,
      default: true
    },
    role: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "role",
      required: true
    },
    // Privacy settings
    privacyPosts: {
      type: String,
      enum: ["PUBLIC", "FRIENDS", "ONLY_ME"],
      default: "PUBLIC"
    },
    privacyFriendRequests: {
      type: String,
      enum: ["EVERYONE", "FRIENDS_OF_FRIENDS", "NOBODY"],
      default: "EVERYONE"
    },
    privacyFriendList: {
      type: String,
      enum: ["PUBLIC", "FRIENDS", "ONLY_ME"],
      default: "PUBLIC"
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

// Hash password before save (giong pattern thay)
userSchema.pre('save', function () {
  if (this.isModified('password')) {
    let salt = bcrypt.genSaltSync(10);
    this.password = bcrypt.hashSync(this.password, salt);
  }
});

module.exports = mongoose.model("user", userSchema);
