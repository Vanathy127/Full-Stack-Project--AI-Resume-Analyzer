const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const router = express.Router();
const makeToken = id => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });

router.post('/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!email || !password || password.length < 6) {
      return res.status(400).json({ message: 'Enter an email and a password of at least 6 characters.' });
    }
    if (await User.findOne({ email: email.toLowerCase() })) {
      return res.status(409).json({ message: 'That email is already registered.' });
    }
    const user = await User.create({ name, email, password: await bcrypt.hash(password, 10) });
    res.status(201).json({ token: makeToken(user._id), name: user.name });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Something went wrong. Try again.' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: String(email || '').toLowerCase() });
    if (!user || !(await bcrypt.compare(String(password || ''), user.password))) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }
    res.json({ token: makeToken(user._id), name: user.name });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Something went wrong. Try again.' });
  }
});

// placeholder so the "Continue with Google" button doesn't crash
router.get('/google', (req, res) => res.status(501).send('Google sign-in is not set up yet.'));

module.exports = router;