const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const { protect, admin } = require('../middleware/authMiddleware');

// @desc    Get user orders or all orders if admin
// @route   GET /api/orders
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    if (req.user.isAdmin) {
      const orders = await Order.find({}).populate('user', 'name email phone').sort({ createdAt: -1 });
      return res.json(orders);
    } else {
      const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
      return res.json(orders);
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Create a new order
// @route   POST /api/orders
// @access  Private
router.post('/', protect, async (req, res) => {
  const {
    packageName,
    plateCount,
    price,
    eventDate,
    customerName,
    customerPhone,
    customerEmail,
    address,
    notes,
  } = req.body;

  if (
    !packageName ||
    !plateCount ||
    !price ||
    !eventDate ||
    !customerName ||
    !customerPhone ||
    !customerEmail ||
    !address
  ) {
    return res.status(400).json({ message: 'Please provide all required fields' });
  }

  try {
    const order = new Order({
      user: req.user._id,
      packageName,
      plateCount,
      price,
      eventDate,
      customerName,
      customerPhone,
      customerEmail,
      address,
      notes,
    });

    const createdOrder = await order.save();
    res.status(201).json(createdOrder);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Update order status
// @route   PUT /api/orders/:id
// @access  Private/Admin
router.put('/:id', protect, admin, async (req, res) => {
  const { status } = req.body;

  if (!status) {
    return res.status(400).json({ message: 'Please specify status' });
  }

  const validStatuses = ['Pending', 'Accepted', 'Completed', 'Cancelled'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ message: 'Invalid order status value' });
  }

  try {
    const order = await Order.findById(req.id || req.params.id);

    if (order) {
      order.status = status;
      const updatedOrder = await order.save();
      res.json(updatedOrder);
    } else {
      res.status(404).json({ message: 'Order not found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
