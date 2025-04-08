const express = require("express")
const router = express.Router()
const fs = require("fs")
const path = require("path")
const requireAuth = require("../../middleware/auth")

const commentsFile = path.join(__dirname, "../../data/comments.json")
const reviewsFile = path.join(__dirname, "../../data/reviews.json")

// Helper function to generate 9-digit ID
function generateId() {
  return Math.floor(100000000 + Math.random() * 900000000).toString()
}

// Helper functions
function loadComments() {
  try {
    const data = fs.readFileSync(commentsFile, "utf8")
    return JSON.parse(data)
  } catch (error) {
    return []
  }
}

function saveComments(comments) {
  fs.writeFileSync(commentsFile, JSON.stringify(comments, null, 2))
}

function loadReviews() {
  try {
    const data = fs.readFileSync(reviewsFile, "utf8")
    return JSON.parse(data)
  } catch (error) {
    return []
  }
}

// Get all comments for a review
router.get("/review/:reviewId", (req, res) => {
  const comments = loadComments()
  const reviewComments = comments.filter((c) => c.reviewId === req.params.reviewId)
  res.json(reviewComments)
})

// Create a new comment
router.post("/", requireAuth, (req, res) => {
  const { content, reviewId } = req.body
  const comments = loadComments()
  const reviews = loadReviews()

  // Check if the review exists
  const reviewExists = reviews.some((r) => r.id === reviewId)
  if (!reviewExists) {
    return res.status(404).json({ error: "Review not found" })
  }

  const newComment = {
    id: generateId(),
    content,
    reviewId,
    userId: req.user.id,
    username: req.user.username,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  comments.push(newComment)
  saveComments(comments)

  res.status(201).json(newComment)
})

// Update a comment
router.put("/:id", requireAuth, (req, res) => {
  const { content } = req.body
  const comments = loadComments()
  const commentIndex = comments.findIndex((c) => c.id === req.params.id)

  if (commentIndex === -1) {
    return res.status(404).json({ error: "Comment not found" })
  }

  // Check if the user is the owner of the comment
  if (comments[commentIndex].userId !== req.user.id) {
    return res.status(403).json({ error: "Not authorized to update this comment" })
  }

  comments[commentIndex] = {
    ...comments[commentIndex],
    content,
    updatedAt: new Date().toISOString(),
  }

  saveComments(comments)

  res.json(comments[commentIndex])
})

// Delete a comment
router.delete("/:id", requireAuth, (req, res) => {
  const comments = loadComments()
  const commentIndex = comments.findIndex((c) => c.id === req.params.id)

  if (commentIndex === -1) {
    return res.status(404).json({ error: "Comment not found" })
  }

  // Check if the user is the owner of the comment
  if (comments[commentIndex].userId !== req.user.id) {
    return res.status(403).json({ error: "Not authorized to delete this comment" })
  }

  // Remove the comment
  const deletedComment = comments.splice(commentIndex, 1)[0]
  saveComments(comments)

  res.json({ message: "Comment deleted successfully", comment: deletedComment })
})

module.exports = router
