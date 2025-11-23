const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Register
router.post('/register', async (req, res) => {
  const { username, password, bio, avatar } = req.body;
  try {
    const hash = await bcrypt.hash(password, 10);
    // avatar optional, so it's fine if not filled—default will be used
    const newUser = new User({ username, password: hash, bio, avatar });
    await newUser.save();
    res.json({ message: 'User registered' });
  } catch (err) {
    res.status(400).json({ error: 'User registration failed' });
  }
});

// Login
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username });
  if (!user) return res.status(404).json({ error: 'User not found' });

  const match = await bcrypt.compare(password, user.password);
  if (!match) return res.status(401).json({ error: 'Invalid credentials' });

  const token = jwt.sign({ userId: user._id }, 'SECRET_KEY');
  res.json({ token, user });
});

// Get all users (for follow, list, etc.)
router.get('/', async (req, res) => {
  const users = await User.find().select('-password');
  res.json(users);
});

// Edit profile (bio + avatar update)
// NEW: Profile editing route for user
router.put('/:id', async (req, res) => {
  const { bio, avatar } = req.body;
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { bio, avatar },
      { new: true }
    ).select('-password');
    res.json({ user });
  } catch (err) {
    res.status(400).json({ error: 'Unable to update profile' });
  }
});

// Follow
router.post('/:id/follow', async (req, res) => {
  try {
    const { userId } = req.body; // follower
    const toFollow = await User.findById(req.params.id); // user to be followed
    const follower = await User.findById(userId); // user who is following

    if (!toFollow || !follower) 
      return res.status(404).json({ message: 'User not found' });
    if (toFollow._id.equals(follower._id))
      return res.status(400).json({ message: 'Cannot follow yourself' });

    // Only follow if not already following
    if (!toFollow.followers.includes(userId)) {
      toFollow.followers.push(userId);
      await toFollow.save();
    }
    if (!follower.following.includes(toFollow._id)) {
      follower.following.push(toFollow._id);
      await follower.save();
    }

    res.json({ message: 'Followed' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Unfollow
router.post('/:id/unfollow', async (req, res) => {
  try {
    const { userId } = req.body;
    const toUnfollow = await User.findById(req.params.id);
    const follower = await User.findById(userId);

    if (!toUnfollow || !follower)
      return res.status(404).json({ message: 'User not found' });
    if (toUnfollow._id.equals(follower._id))
      return res.status(400).json({ message: 'Cannot unfollow yourself' });

    toUnfollow.followers = toUnfollow.followers.filter(folId => folId.toString() !== userId);
    await toUnfollow.save();

    follower.following = follower.following.filter(fId => fId.toString() !== toUnfollow._id.toString());
    await follower.save();

    res.json({ message: 'Unfollowed' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
