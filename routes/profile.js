var express = require("express");
var router = express.Router();
let userModel = require('../schemas/users');
let userController = require('../controllers/users');
let { CheckLogin, OptionalLogin } = require('../utils/authHandler');
let { ChangePasswordValidator, validationResult } = require('../utils/validatorHandler');
let bcrypt = require('bcrypt');

// GET /api/profile/me
router.get('/me', CheckLogin, function (req, res, next) {
  res.send(userController.ToUserResponse(req.user));
});

// GET /api/profile/:userId
router.get('/:userId', OptionalLogin, async function (req, res, next) {
  try {
    let user = await userController.GetUserById(req.params.userId);
    if (!user) {
      return res.status(404).send({ message: "User not found" });
    }
    res.send(userController.ToUserResponse(user));
  } catch (error) {
    res.status(404).send({ message: "User not found" });
  }
});

// PUT /api/profile/me
router.put('/me', CheckLogin, async function (req, res, next) {
  try {
    let user = req.user;
    let allowedFields = ['fullName', 'email', 'bio', 'birthday', 'location', 'relationship', 'edu', 'phone', 'avatarUrl', 'coverUrl'];
    let updateData = {};

    for (let field of allowedFields) {
      if (req.body[field] !== undefined) {
        let val = req.body[field];
        if (field === 'fullName') {
          if (!val || val.length < 2 || val.length > 50) return res.status(400).send({ message: "Tên hiển thị phải từ 2-50 ký tự" });
        }
        if (field === 'email') {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!val || !emailRegex.test(val)) return res.status(400).send({ message: "Email không hợp lệ" });
        }
        if (field === 'phone') {
          const phoneRegex = /^0\d{9}$/;
          if (val && !phoneRegex.test(val)) return res.status(400).send({ message: "Số điện thoại không hợp lệ (Bắt đầu bằng 0 và có 10 số)" });
        }
        updateData[field] = val;
      }
    }

    let updated = await userModel.findByIdAndUpdate(user._id, updateData, { new: true }).populate('role');
    res.send(userController.ToUserResponse(updated));
  } catch (err) {
    res.status(400).send({ message: err.message });
  }
});

// PUT /api/profile/me/password
router.put('/me/password', CheckLogin, ChangePasswordValidator, validationResult, async function (req, res, next) {
  try {
    let { currentPassword, newPassword } = req.body;
    let user = req.user;

    if (!bcrypt.compareSync(currentPassword, user.password)) {
      return res.status(400).send({ message: "Mật khẩu hiện tại không chính xác" });
    }
    
    if (newPassword.length < 6) {
      return res.status(400).send({ message: "Mật khẩu mới phải có ít nhất 6 ký tự" });
    }

    user.password = newPassword;
    await user.save();
    res.send({ message: "Password changed successfully" });
  } catch (err) {
    res.status(400).send({ message: err.message });
  }
});

module.exports = router;
