const express = require("express")
const router = express.Router()
const fs = require("fs")
const path = require("path")
const { requireAuth } = require("../../middleware/auth")
const bcrypt = require('bcrypt');

const usersFile = path.join(__dirname, "../../data/users.json")
const reviewsFile = path.join(__dirname, "../../data/reviews.json")
const commentsFile = path.join(__dirname, "../../data/comments.json")

// Helper functions
function loadUsers() {
  try {
    const data = fs.readFileSync(usersFile, "utf8")
    return JSON.parse(data)
  } catch (error) {
    return []
  }
}

function loadReviews() {
  try {
    const data = fs.readFileSync(reviewsFile, "utf8")
    return JSON.parse(data)
  } catch (error) {
    return []
  }
}

function loadComments() {
  try {
    const data = fs.readFileSync(commentsFile, "utf8")
    return JSON.parse(data)
  } catch (error) {
    return []
  }
}

// Helper: Save users
function saveUsers(users) {
  fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));
}

// Middleware: Require admin
function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'Admin') {
    return res.status(403).json({ error: 'Forbidden' });
  }
  next();
}

// Add user (Admin only)
router.post('/', requireAuth, requireAdmin, (req, res) => {
  const { username, email, password, role } = req.body;
  if (!username || !email || !password || !role) {
    return res.status(400).json({ error: 'All fields required' });
  }
  const users = loadUsers();
  if (users.some(u => u.email === email)) {
    return res.status(400).json({ error: 'Email already exists' });
  }
  const newUser = {
    id: Math.floor(100000000 + Math.random() * 900000000).toString(),
    username,
    email,
    password: bcrypt.hashSync(password, 10),
    createdAt: new Date().toISOString(),
    role
  };
  users.push(newUser);
  saveUsers(users);
  res.json({ success: true, user: { ...newUser, password: undefined } });
});

// Edit user (Admin only)
router.put('/:id', requireAuth, requireAdmin, (req, res) => {
  const { username, email, password, role } = req.body;
  const users = loadUsers();
  const idx = users.findIndex(u => u.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'User not found' });
  if (!username || !email || !role) return res.status(400).json({ error: 'Missing fields' });
  users[idx].username = username;
  users[idx].email = email;
  users[idx].role = role;
  if (password && password.trim() !== '') {
    users[idx].password = bcrypt.hashSync(password, 10);
  }
  saveUsers(users);
  res.json({ success: true, user: { ...users[idx], password: undefined } });
});

// Delete user (Admin only)
router.delete('/:id', requireAuth, requireAdmin, (req, res) => {
  let users = loadUsers();
  const idx = users.findIndex(u => u.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'User not found' });
  const deleted = users.splice(idx, 1)[0];
  saveUsers(users);
  res.json({ success: true, user: { ...deleted, password: undefined } });
});

// Get current user profile
router.get("/me", requireAuth, (req, res) => {
  // Remove sensitive information
  const { password, ...userInfo } = req.user
  res.json(userInfo)
})

// Get user's reviews
router.get("/me/reviews", requireAuth, (req, res) => {
  const reviews = loadReviews()
  const userReviews = reviews.filter((r) => r.userId === req.user.id)
  res.json(userReviews)
})

// Get user's comments
router.get("/me/comments", requireAuth, (req, res) => {
  const comments = loadComments()
  const userComments = comments.filter((c) => c.userId === req.user.id)
  res.json(userComments)
})

// Get public user profile
router.get("/:id", (req, res) => {
  const users = loadUsers()
  const user = users.find((u) => u.id === req.params.id)

  if (!user) {
    return res.status(404).json({ error: "User not found" })
  }

  // Remove sensitive information
  const { password, email, ...userInfo } = user
  res.json(userInfo)
})

// Get users public reviews
router.get("/:id/reviews", (req, res) => {
  const reviews = loadReviews()
  const userReviews = reviews.filter((r) => r.userId === req.params.id)
  res.json(userReviews)
})

module.exports = router
