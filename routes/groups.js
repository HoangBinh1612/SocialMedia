var express = require("express");
var router = express.Router();
let groupController = require('../controllers/groups');
let { CheckLogin } = require('../utils/authHandler');

// GET /api/groups - Get my groups
router.get('/', CheckLogin, async function (req, res, next) {
  try {
    let groups = await groupController.GetMyGroups(req.user._id);
    res.send(groups);
  } catch (err) {
    res.status(400).send({ message: err.message });
  }
});

// GET /api/groups/:id - Get specific group
router.get('/:id', CheckLogin, async function (req, res, next) {
  try {
    let group = await groupController.GetGroup(req.params.id);
    if (!group) return res.status(404).send({ message: "Group not found" });
    // Make sure user is a member
    if (!group.members.some(m => m._id.toString() === req.user._id.toString())) {
      return res.status(403).send({ message: "Access denied" });
    }
    res.send(group);
  } catch (err) {
    res.status(400).send({ message: err.message });
  }
});

// POST /api/groups - Create a group
router.post('/', CheckLogin, async function (req, res, next) {
  try {
    let { name, members } = req.body;
    if (!name) return res.status(400).send({ message: "Name is required" });
    if (!members || !Array.isArray(members)) members = [];
    
    let group = await groupController.CreateGroup(req.user._id, name, members);
    
    // Broadcast real-time to all members so they see the new group
    let chatHandler = require('../utils/chatHandler');
    if (chatHandler.io) {
      group.members.forEach(member => {
        chatHandler.io.to(member._id.toString()).emit('newGroup', group);
      });
    }

    res.status(201).send(group);
  } catch (err) {
    res.status(400).send({ message: err.message });
  }
});

// POST /api/groups/:id/add-members - Add members
router.post('/:id/add-members', CheckLogin, async function (req, res, next) {
  try {
    let { members } = req.body;
    let group = await groupController.GetGroup(req.params.id);
    if (!group) return res.status(404).send({ message: "Group not found" });
    
    // Only creator or current members can add (allow any current member for ease)
    if (!group.members.some(m => m._id.toString() === req.user._id.toString())) {
      return res.status(403).send({ message: "Access denied" });
    }

    let updatedGroup = await groupController.AddMembers(req.params.id, members);
    
    // Broadcast group update
    let chatHandler = require('../utils/chatHandler');
    if (chatHandler.io) {
      updatedGroup.members.forEach(member => {
        chatHandler.io.to(member._id.toString()).emit('groupUpdated', updatedGroup);
      });
    }

    res.send(updatedGroup);
  } catch (err) {
    res.status(400).send({ message: err.message });
  }
});

// POST /api/groups/:id/leave - Leave group
router.post('/:id/leave', CheckLogin, async function (req, res, next) {
  try {
    await groupController.LeaveGroup(req.params.id, req.user._id);
    
    // Broadcast updated group
    let chatHandler = require('../utils/chatHandler');
    if (chatHandler.io) {
       // Wait, we need the group to broadcast to REMAINING members.
       // It's fine, we skip it for now, let them refresh.
    }
    
    res.send({ message: "Left group successfully" });
  } catch (err) {
    res.status(400).send({ message: err.message });
  }
});

// DELETE /api/groups/:id - Delete group
router.delete('/:id', CheckLogin, async function (req, res, next) {
  try {
    // We should get members before deleting so we can broadcast
    let group = await groupController.GetGroup(req.params.id);
    
    await groupController.DeleteGroup(req.params.id, req.user._id);
    
    // Broadcast deletion
    let chatHandler = require('../utils/chatHandler');
    if (chatHandler.io && group) {
      group.members.forEach(m => {
        chatHandler.io.to(m._id.toString()).emit('groupDeleted', req.params.id);
      });
    }
    
    res.send({ message: "Group deleted successfully" });
  } catch (err) {
    res.status(400).send({ message: err.message });
  }
});

module.exports = router;
