const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { protect } = require('../middleware/authMiddleware');

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
router.post('/register', async (req, res) => {
  const { name, email, password, phone } = req.body;

  if (!name || !email || !password || !phone) {
    return res.status(400).json({ message: 'Please enter all fields' });
  }

  try {
    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Auto-escalate the specific admin email if registered manually
    const isAdmin = email.toLowerCase() === 'thambulamplatedecorations@gmail.com';

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      phone,
      isAdmin,
    });

    if (user) {
      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        isAdmin: user.isAdmin,
        token: generateToken(user._id),
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Please enter all fields' });
  }

  const cleanEmail = email.toLowerCase();

  try {
    // Special admin fallback logic (auto-create admin in DB if it doesn't exist)
    if (cleanEmail === 'thambulamplatedecorations@gmail.com' && password === 'admin@123') {
      let adminUser = await User.findOne({ email: cleanEmail });
      if (!adminUser) {
        adminUser = await User.create({
          name: 'Thambulam Admin',
          email: cleanEmail,
          password: 'admin@123',
          phone: '9677015928',
          isAdmin: true,
        });
      } else if (!adminUser.isAdmin) {
        adminUser.isAdmin = true;
        await adminUser.save();
      }
      return res.json({
        _id: adminUser._id,
        name: adminUser.name,
        email: adminUser.email,
        phone: adminUser.phone,
        isAdmin: adminUser.isAdmin,
        token: generateToken(adminUser._id),
      });
    }

    // Normal login flow
    const user = await User.findOne({ email: cleanEmail });

    if (user && (await user.matchPassword(password))) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        isAdmin: user.isAdmin,
        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Get user profile
// @route   GET /api/auth/me
// @access  Private
router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (user) {
      res.json(user);
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
