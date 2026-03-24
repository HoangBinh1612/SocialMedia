let userModel = require("../schemas/users");
let bcrypt = require('bcrypt');

module.exports = {
  CreateAnUser: async function (username, password, email, role, session) {
    let newUser = new userModel({
      username: username,
      password: password,
      email: email,
      role: role
    });
    if (session) {
      await newUser.save({ session });
    } else {
      await newUser.save();
    }
    return newUser;
  },

  FindUserByUsername: async function (username) {
    return await userModel.findOne({
      isDeleted: false,
      username: username
    }).populate('role');
  },

  FindUserByEmail: async function (email) {
    return await userModel.findOne({
      isDeleted: false,
      email: email.toLowerCase()
    }).populate('role');
  },

  FindUserByLogin: async function (login) {
    // Tim bang username hoac email
    return await userModel.findOne({
      isDeleted: false,
      $or: [
        { username: login },
        { email: login.toLowerCase() }
      ]
    }).populate('role');
  },

  CompareLogin: async function (user, password) {
    if (bcrypt.compareSync(password, user.password)) {
      return user;
    }
    return false;
  },

  GetUserById: async function (id) {
    try {
      let user = await userModel.findOne({
        _id: id,
        isDeleted: false
      }).populate('role');
      return user;
    } catch (error) {
      return false;
    }
  },

  // Tra ve user info (khong co password)
  ToUserResponse: function (user) {
    if (!user) return null;
    let obj = user.toObject ? user.toObject() : { ...user };
    delete obj.password;
    delete obj.__v;
    return obj;
  }
}
