let { body, validationResult } = require('express-validator');

module.exports = {
  RegisterValidator: [
    body('username').notEmpty().withMessage("Username is required")
      .bail().isAlphanumeric().withMessage("Username must be alphanumeric"),
    body('email').notEmpty().withMessage("Email is required")
      .bail().isEmail().withMessage("Invalid email format"),
    body('password').notEmpty().withMessage("Password is required")
      .bail().isLength({ min: 6 }).withMessage("Password must be at least 6 characters")
  ],

  LoginValidator: [
    body('login').notEmpty().withMessage("Username or email is required"),
    body('password').notEmpty().withMessage("Password is required")
  ],

  ChangePasswordValidator: [
    body('currentPassword').notEmpty().withMessage("Current password is required"),
    body('newPassword').notEmpty().withMessage("New password is required")
      .bail().isLength({ min: 6 }).withMessage("New password must be at least 6 characters")
  ],

  UpdateProfileValidator: [
    body('email').optional().isEmail().withMessage("Invalid email format"),
    body('phone').optional().isMobilePhone().withMessage("Invalid phone number")
  ],

  CreatePostValidator: [
    // Content hoac imageUrl phai co it nhat 1
  ],

  CreateCommentValidator: [
    // Bỏ qua validate bắt buộc vì có thể comment không chữ (chỉ ảnh)
  ],

  CreateGroupValidator: [
    body('groupName').notEmpty().withMessage("Group name is required")
  ],

  validationResult: function (req, res, next) {
    let result = validationResult(req);
    if (result.errors.length > 0) {
      res.status(400).send(result.errors.map(function (e) {
        return {
          [e.path]: e.msg
        }
      }));
    } else {
      next();
    }
  }
}
