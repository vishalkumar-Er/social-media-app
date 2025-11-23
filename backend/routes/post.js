const express = require('express');
const router = express.Router();
const Post = require('../models/Post');
const User = require('../models/User');
const Comment = require('../models/Comment');

// Create post
router.post('/', async (req, res) => {
  const { userId, content } = req.body;
  const post = new Post({ user: userId, content, likes: [], comments: [] });
  await post.save();
  res.json(post);
});

// Get all posts (newsfeed)
router.get('/', async (req, res) => {
  const posts = await Post.find()
    .populate('user', 'username')
    .populate('comments')
    .sort({ createdAt: -1 });
  res.json(posts);
});

// Like post
router.post('/:id/like', async (req, res) => {
  const { userId } = req.body;
  const post = await Post.findById(req.params.id);
  if (!post.likes.includes(userId)) {
    post.likes.push(userId);
    await post.save();
    res.json({ message: 'Liked' });
  } else {
    res.status(400).json({ message: 'Already liked' });
  }
});

// Unlike post
router.post('/:id/unlike', async (req, res) => {
  const { userId } = req.body;
  const post = await Post.findById(req.params.id);
  post.likes = post.likes.filter(likeId => likeId.toString() !== userId);
  await post.save();
  res.json({ message: 'Unliked' });
});

// Add comment
router.post('/:id/comment', async (req, res) => {
  const { userId, text } = req.body;
  const comment = new Comment({ user: userId, post: req.params.id, text });
  await comment.save();
  const post = await Post.findById(req.params.id);
  post.comments.push(comment._id);
  await post.save();
  res.json(comment);
});

// Delete post
router.delete('/:id', async (req, res) => {
  await Post.findByIdAndDelete(req.params.id);
  res.json({ message: 'Post deleted' });
});
// Delete comment
router.delete('/comment/:id', async (req, res) => {
  await Comment.findByIdAndDelete(req.params.id);
  res.json({ message: 'Comment deleted' });
});


module.exports = router;
