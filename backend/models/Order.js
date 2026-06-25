const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    packageName: {
      type: String,
      required: true,
    },
    plateCount: {
      type: Number,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    eventDate: {
      type: Date,
      required: true,
    },
    customerName: {
      type: String,
      required: true,
    },
    customerPhone: {
      type: String,
      required: true,
    },
    customerEmail: {
      type: String,
      required: true,
    },
    address: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      required: true,
      default: 'Pending', // Pending, Accepted, Completed, Cancelled
    },
    notes: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;
