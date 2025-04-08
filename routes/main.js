const express = require('express');
const router = express.Router();
const requireAuth = require('../middleware/auth');

// Protected with the auth middleware
router.get('/', requireAuth, (req, res) => {
  res.render('home', {
    user: req.user
  });
});

module.exports = router;
