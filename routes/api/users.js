const express = require("express")
const router = express.Router()
const fs = require("fs")
const path = require("path")
const requireAuth = require("../../middleware/auth")

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
