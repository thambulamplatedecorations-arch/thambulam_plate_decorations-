const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { protect, admin } = require('../middleware/authMiddleware');

const filePath = path.join(__dirname, '../call_requests.json');

const getRequests = () => {
  if (!fs.existsSync(filePath)) {
    return [];
  }
  try {
    const data = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error("Error reading call_requests.json", error);
    return [];
  }
};

const saveRequests = (requests) => {
  try {
    fs.writeFileSync(filePath, JSON.stringify(requests, null, 2), 'utf-8');
  } catch (error) {
    console.error("Error writing call_requests.json", error);
  }
};

// @desc    Submit a new call request (Public)
// @route   POST /api/call-requests
router.post('/', (req, res) => {
  const { name, phone, message } = req.body;
  if (!name || !phone) {
    return res.status(400).json({ message: 'Name and Phone number are required' });
  }

  const requests = getRequests();

  // Find if there is an existing incomplete request for this phone
  const existingIndex = requests.findIndex(r => r.phone === phone && r.status !== 'Completed');

  const newRequest = {
    id: Date.now().toString(),
    name,
    phone,
    message: message || '',
    status: 'Pending',
    createdAt: new Date().toISOString()
  };

  if (existingIndex > -1) {
    // Update existing request
    requests[existingIndex] = {
      ...requests[existingIndex],
      name,
      message: message || '',
      createdAt: new Date().toISOString()
    };
    saveRequests(requests);
    return res.status(200).json({ message: 'Call support request updated successfully', data: requests[existingIndex] });
  } else {
    // Add new request
    requests.push(newRequest);
    saveRequests(requests);
    return res.status(201).json({ message: 'Call support request submitted successfully', data: newRequest });
  }
});

// @desc    Get all call requests (Admin only)
// @route   GET /api/call-requests
router.get('/', protect, admin, (req, res) => {
  const requests = getRequests();
  res.json(requests);
});

// @desc    Update call request status (Admin only)
// @route   PUT /api/call-requests/:id
router.put('/:id', protect, admin, (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!status || !['Pending', 'Approved', 'Completed'].includes(status)) {
    return res.status(400).json({ message: 'Invalid status. Must be Pending, Approved, or Completed.' });
  }

  const requests = getRequests();
  const index = requests.findIndex(r => r.id === id);

  if (index === -1) {
    return res.status(404).json({ message: 'Call request not found' });
  }

  requests[index].status = status;
  saveRequests(requests);

  res.json({ message: `Request status updated to ${status}`, data: requests[index] });
});

// @desc    Get status of latest call request for a phone (Public)
// @route   GET /api/call-requests/status
router.get('/status', (req, res) => {
  const { phone } = req.query;
  if (!phone) {
    return res.status(400).json({ message: 'Phone query parameter is required' });
  }

  const requests = getRequests();

  // Get active requests for this phone number, sorting by newest first
  const userRequests = requests
    .filter(r => r.phone === phone)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  if (userRequests.length === 0) {
    return res.json({ status: 'None' });
  }

  // Return the latest request status
  res.json({
    id: userRequests[0].id,
    status: userRequests[0].status,
    name: userRequests[0].name,
    createdAt: userRequests[0].createdAt
  });
});

module.exports = router;
