let userModel = require('../schemas/users');
let jwt = require('jsonwebtoken');

const SECRET_KEY = 'SocialMedia_SecretKey_2024';

module.exports = {
  SECRET_KEY: SECRET_KEY,

  CheckLogin: async function (req, res, next) {
    let key = req.headers.authorization;
    if (!key) {
      if (req.cookies && req.cookies.LOGIN_SOCIAL) {
        key = req.cookies.LOGIN_SOCIAL;
      } else {
        res.status(401).send({ message: "Unauthorized" });
        return;
      }
    }

    // Support "Bearer <token>" format
    if (key.startsWith('Bearer ')) {
      key = key.substring(7);
    }

    try {
      let result = jwt.verify(key, SECRET_KEY);
      if (result.exp * 1000 < Date.now()) {
        res.status(401).send({ message: "Token expired" });
        return;
      }
      let user = await userModel.findOne({
        _id: result.id,
        isDeleted: false
      }).populate('role');
      if (!user) {
        res.status(401).send({ message: "User not found" });
        return;
      }
      if (!user.status) {
        res.status(403).send({ message: "User is banned" });
        return;
      }
      req.user = user;
      next();
    } catch (error) {
      res.status(401).send({ message: "Invalid token" });
      return;
    }
  },

  CheckRole: function (...requiredRoles) {
    return function (req, res, next) {
      let user = req.user;
      let currentRole = user.role.name;
      if (requiredRoles.includes(currentRole)) {
        next();
      } else {
        res.status(403).send({ message: "Forbidden" });
      }
    }
  },

  // Optional auth - khong bat buoc login, nhung neu co token thi parse
  OptionalLogin: async function (req, res, next) {
    let key = req.headers.authorization;
    if (!key) {
      req.user = null;
      return next();
    }
    if (key.startsWith('Bearer ')) {
      key = key.substring(7);
    }
    try {
      let result = jwt.verify(key, SECRET_KEY);
      let user = await userModel.findOne({
        _id: result.id,
        isDeleted: false
      }).populate('role');
      req.user = user || null;
    } catch (error) {
      req.user = null;
    }
    next();
  }
}
