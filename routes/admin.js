const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { requireAuth } = require('../middleware/auth');

const usersFile = path.join(__dirname, '../data/users.json');
const reviewsFile = path.join(__dirname, '../data/reviews.json');
const commentsFile = path.join(__dirname, '../data/comments.json');

function loadUsers() {
  return JSON.parse(fs.readFileSync(usersFile, 'utf8'));
}
function loadReviews() {
  return JSON.parse(fs.readFileSync(reviewsFile, 'utf8'));
}
function loadComments() {
  return JSON.parse(fs.readFileSync(commentsFile, 'utf8'));
}

// Middleware to check admin
function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'Admin') {
    return res.status(403).render('error', { message: 'Forbidden', user: req.user || null });
  }
  next();
}

// Admin dashboard
router.get('/', requireAuth, requireAdmin, (req, res) => {
  const users = loadUsers();
  const reviews = loadReviews();
  const comments = loadComments();
  res.render('admin', {
    user: req.user,
    users,
    reviews,
    comments,
    query: {},
    locale: req.getLocale(),
  });
});

// Admin search
router.get('/search', requireAuth, requireAdmin, (req, res) => {
  const users = loadUsers();
  const reviews = loadReviews();
  const comments = loadComments();
  let filteredUsers = users;
  let filteredReviews = reviews;
  let filteredComments = comments;
  const { user, post, content } = req.query;
  if (user) {
    filteredUsers = users.filter(u => u.username.toLowerCase().includes(user.toLowerCase()) || u.email.toLowerCase().includes(user.toLowerCase()));
    filteredReviews = reviews.filter(r => r.username.toLowerCase().includes(user.toLowerCase()));
    filteredComments = comments.filter(c => c.username.toLowerCase().includes(user.toLowerCase()));
  }
  if (post) {
    filteredReviews = filteredReviews.filter(r => r.title.toLowerCase().includes(post.toLowerCase()) || r.content.toLowerCase().includes(post.toLowerCase()));
    filteredComments = filteredComments.filter(c => c.content.toLowerCase().includes(post.toLowerCase()));
  }
  if (content) {
    filteredReviews = filteredReviews.filter(r => r.content.toLowerCase().includes(content.toLowerCase()));
    filteredComments = filteredComments.filter(c => c.content.toLowerCase().includes(content.toLowerCase()));
  }
  res.render('admin', {
    user: req.user,
    users: filteredUsers,
    reviews: filteredReviews,
    comments: filteredComments,
    query: req.query,
    locale: req.getLocale(),
  });
});

module.exports = router; 