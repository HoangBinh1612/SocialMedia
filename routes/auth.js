var express = require("express");
var router = express.Router();
let userController = require('../controllers/users');
let roleModel = require('../schemas/roles');
let { RegisterValidator, LoginValidator, validationResult } = require('../utils/validatorHandler');
let { CheckLogin } = require('../utils/authHandler');
let { SECRET_KEY } = require('../utils/authHandler');
let jwt = require('jsonwebtoken');

// POST /api/auth/register
router.post('/register', RegisterValidator, validationResult, async function (req, res, next) {
  try {
    let { username, email, password } = req.body;

    // Check username ton tai
    let existUser = await userController.FindUserByUsername(username);
    if (existUser) {
      return res.status(400).send({ message: "Username already exists" });
    }

    // Check email ton tai
    let existEmail = await userController.FindUserByEmail(email);
    if (existEmail) {
      return res.status(400).send({ message: "Email already exists" });
    }

    // Tim role USER
    let userRole = await roleModel.findOne({ name: "USER", isDeleted: false });
    if (!userRole) {
      // Tao role USER neu chua co
      userRole = new roleModel({ name: "USER", description: "Normal user" });
      await userRole.save();
    }

    let newUser = await userController.CreateAnUser(username, password, email, userRole._id);
    let populatedUser = await userController.GetUserById(newUser._id);

    res.status(201).send({
      message: "Register successful",
      user: userController.ToUserResponse(populatedUser)
    });
  } catch (err) {
    res.status(400).send({ message: err.message });
  }
});

// POST /api/auth/login
router.post('/login', LoginValidator, validationResult, async function (req, res, next) {
  try {
    let { login, password } = req.body;

    let user = await userController.FindUserByLogin(login);
    if (!user) {
      return res.status(401).send({ message: "Invalid credentials" });
    }
    if (!user.status) {
      return res.status(403).send({ message: "User is banned" });
    }

    let result = await userController.CompareLogin(user, password);
    if (!result) {
      return res.status(401).send({ message: "Invalid credentials" });
    }

    let roleName = user.role ? user.role.name : "USER";

    let token = jwt.sign({
      id: user._id,
      userName: user.username,
      role: roleName
    }, SECRET_KEY, {
      expiresIn: '2h'
    });

    res.send({
      token: token,
      user: userController.ToUserResponse(user)
    });
  } catch (err) {
    res.status(400).send({ message: err.message });
  }
});

// GET /api/auth/me
router.get('/me', CheckLogin, function (req, res, next) {
  res.send(userController.ToUserResponse(req.user));
});

module.exports = router;
