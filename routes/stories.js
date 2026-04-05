var express = require("express");
var router = express.Router();
let storyController = require('../controllers/stories');
let { CheckLogin } = require('../utils/authHandler');

// GET /api/stories - get feed
router.get('/', CheckLogin, async function (req, res, next) {
  try {
    let stories = await storyController.GetFeedStories(req.user._id);
    res.status(200).send(stories);
  } catch (err) {
    res.status(400).send({ message: err.message });
  }
});

// POST /api/stories - create story
router.post('/', CheckLogin, async function (req, res, next) {
  try {
    let { mediaType, mediaUrl, text, background } = req.body;
    let story = await storyController.CreateStory(req.user._id, mediaType, mediaUrl, text, background);
    res.status(201).send(story);
  } catch (err) {
    res.status(400).send({ message: err.message });
  }
});

// DELETE /api/stories/:id
router.delete('/:id', CheckLogin, async function (req, res, next) {
  try {
    await storyController.DeleteStory(req.user._id, req.params.id);
    res.status(200).send({ success: true });
  } catch (err) {
    res.status(400).send({ message: err.message });
  }
});

module.exports = router;
