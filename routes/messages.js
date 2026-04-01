var express = require("express");
var router = express.Router();
let messageController = require('../controllers/messages');
let { CheckLogin } = require('../utils/authHandler');
let { uploadMedia } = require('../utils/uploadHandler');

// GET /api/messages/recent
router.get('/recent', CheckLogin, async function (req, res, next) {
  try {
    let conversations = await messageController.GetRecentConversations(req.user._id.toString());
    res.send(conversations);
  } catch (err) {
    res.status(400).send({ message: err.message });
  }
});

// GET /api/messages/unread-count
router.get('/unread-count', CheckLogin, async function (req, res, next) {
  try {
    let count = await messageController.CountUnread(req.user._id);
    res.send({ count: count });
  } catch (err) {
    res.status(400).send({ message: err.message });
  }
});

// GET /api/messages/unread-list
router.get('/unread-list', CheckLogin, async function (req, res, next) {
  try {
    let unreadList = await messageController.GetUnreadList(req.user._id);
    res.send(unreadList);
  } catch (err) {
    res.status(400).send({ message: err.message });
  }
});

// GET /api/messages/with/:otherId
router.get('/with/:otherId', CheckLogin, async function (req, res, next) {
  try {
    let page = parseInt(req.query.page) || 1;
    let size = parseInt(req.query.size) || 50;
    let messages = await messageController.GetConversation(req.user._id, req.params.otherId, page, size);
    res.send(messages);
  } catch (err) {
    res.status(400).send({ message: err.message });
  }
});

// POST /api/messages/to/:otherId
router.post('/to/:otherId', CheckLogin, async function (req, res, next) {
  try {
    let { content, imageUrl, videoUrl } = req.body;
    let msg = await messageController.SendMessage(req.user._id, req.params.otherId, content, imageUrl, videoUrl);
    res.status(201).send(msg);
  } catch (err) {
    res.status(400).send({ message: err.message });
  }
});

// GET /api/messages/group/:groupId
router.get('/group/:groupId', CheckLogin, async function (req, res, next) {
  try {
    let page = parseInt(req.query.page) || 1;
    let size = parseInt(req.query.size) || 50;
    let messages = await messageController.GetGroupConversation(req.params.groupId, page, size);
    res.send(messages);
  } catch (err) {
    res.status(400).send({ message: err.message });
  }
});

// POST /api/messages/group/:groupId
router.post('/group/:groupId', CheckLogin, async function (req, res, next) {
  try {
    let { content, imageUrl, videoUrl } = req.body;
    let msg = await messageController.SendGroupMessage(req.user._id, req.params.groupId, content, imageUrl, videoUrl);
    res.status(201).send(msg);
  } catch (err) {
    res.status(400).send({ message: err.message });
  }
});

// POST /api/messages/send-media
router.post('/send-media', CheckLogin, uploadMedia.single('file'), async function (req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).send({ message: "File is required" });
    }
    let toUserId = req.body.toUserId;
    let toGroupId = req.body.toGroupId;
    let mediaUrl = '/uploads/' + req.file.filename;
    let isVideo = req.file.mimetype.startsWith('video');

    let msg;
    if (toGroupId) {
      msg = await messageController.SendGroupMessage(
        req.user._id, toGroupId,
        "", // content
        isVideo ? "" : mediaUrl, 
        isVideo ? mediaUrl : ""  
      );
    } else {
      msg = await messageController.SendMessage(
        req.user._id, toUserId,
        "", // content
        isVideo ? "" : mediaUrl, 
        isVideo ? mediaUrl : ""  
      );
    }

    let chatHandler = require('../utils/chatHandler');
    if (chatHandler.io) {
      let event = { type: 'NEW_MESSAGE', data: msg };
      if (toGroupId) {
        // Broadcast to all group members
        let groupModel = require('../schemas/groups');
        let group = await groupModel.findById(toGroupId);
        if (group && !group.isDeleted) {
          group.members.forEach(member => {
            chatHandler.io.to(member.toString()).emit('newMessage', event);
          });
        }
      } else {
        chatHandler.io.to(toUserId).emit('newMessage', event);
        chatHandler.io.to(req.user._id.toString()).emit('newMessage', event);
      }
    }

    res.status(201).send(msg);
  } catch (err) {
    res.status(400).send({ message: err.message });
  }
});

// PUT /api/messages/:id/read
router.put('/:id/read', CheckLogin, async function (req, res, next) {
  try {
    let result = await messageController.MarkRead(req.user._id, req.params.id);
    if (!result) return res.status(404).send({ message: "Message not found" });
    if (result === 'FORBIDDEN') return res.status(403).send({ message: "Not your message" });
    res.send(result);
  } catch (err) {
    res.status(400).send({ message: err.message });
  }
});

// PUT /api/messages/mark-read-from/:otherUserId
router.put('/mark-read-from/:otherUserId', CheckLogin, async function (req, res, next) {
  try {
    await messageController.MarkAllReadFromUser(req.user._id, req.params.otherUserId);
    res.send({ message: "All messages marked as read" });
  } catch (err) {
    res.status(400).send({ message: err.message });
  }
});

// PUT /api/messages/mark-read-group/:groupId
router.put('/mark-read-group/:groupId', CheckLogin, async function (req, res, next) {
  try {
    await messageController.MarkAllReadGroup(req.user._id, req.params.groupId);
    res.send({ message: "All group messages marked as read" });
  } catch (err) {
    res.status(400).send({ message: err.message });
  }
});

module.exports = router;
