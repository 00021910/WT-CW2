const express = require("express")
const router = express.Router()
const fs = require("fs")
const path = require("path")
const requireAuth = require("../../middleware/auth")

const reviewsFile = path.join(__dirname, "../../data/reviews.json")
const commentsFile = path.join(__dirname, "../../data/comments.json")

// Helper function to generate 9-digit ID
function generateId() {
  return Math.floor(100000000 + Math.random() * 900000000).toString()
}

// Helper functions
function loadReviews() {
  try {
    const data = fs.readFileSync(reviewsFile, "utf8")
    return JSON.parse(data)
  } catch (error) {
    return []
  }
}

function saveReviews(reviews) {
  fs.writeFileSync(reviewsFile, JSON.stringify(reviews, null, 2))
}

function loadComments() {
  try {
    const data = fs.readFileSync(commentsFile, "utf8")
    return JSON.parse(data)
  } catch (error) {
    return []
  }
}

// Get all reviews
router.get("/", (req, res) => {
  const reviews = loadReviews()

  // Handle search query
  if (req.query.search) {
    const searchTerm = req.query.search.toLowerCase()
    const filteredReviews = reviews.filter(
      (review) =>
        review.title.toLowerCase().includes(searchTerm) ||
        review.content.toLowerCase().includes(searchTerm) ||
        review.productName.toLowerCase().includes(searchTerm),
    )
    return res.json(filteredReviews)
  }

  // Handle rating filter
  if (req.query.rating) {
    const rating = Number.parseInt(req.query.rating)
    const filteredReviews = reviews.filter((review) => review.rating === rating)
    return res.json(filteredReviews)
  }

  // Handle category filter
  if (req.query.category) {
    const category = req.query.category
    const filteredReviews = reviews.filter((review) => review.category === category)
    return res.json(filteredReviews)
  }

  // Handle sentiment filter
  if (req.query.sentiment) {
    const sentiment = req.query.sentiment
    let filteredReviews

    if (sentiment === "positive") {
      filteredReviews = reviews.filter((review) => review.rating >= 4)
    } else if (sentiment === "negative") {
      filteredReviews = reviews.filter((review) => review.rating <= 2)
    } else {
      filteredReviews = reviews.filter((review) => review.rating === 3)
    }

    return res.json(filteredReviews)
  }

  res.json(reviews)
})

// Get a specific review
router.get("/:id", (req, res) => {
  const reviews = loadReviews()
  const review = reviews.find((r) => r.id === req.params.id)

  if (!review) {
    return res.status(404).json({ error: "Review not found" })
  }

  res.json(review)
})

// Create a new review
router.post("/", requireAuth, (req, res) => {
  const { title, content, productName, category, rating } = req.body
  const reviews = loadReviews()

  const newReview = {
    id: generateId(),
    title,
    content,
    productName,
    category,
    rating: Number.parseInt(rating),
    userId: req.user.id,
    username: req.user.username,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  reviews.push(newReview)
  saveReviews(reviews)

  res.status(201).json(newReview)
})

// Update a review
router.put("/:id", requireAuth, (req, res) => {
  const { title, content, productName, category, rating } = req.body
  const reviews = loadReviews()
  const reviewIndex = reviews.findIndex((r) => r.id === req.params.id)

  if (reviewIndex === -1) {
    return res.status(404).json({ error: "Review not found" })
  }

  // Check if the user is the owner of the review
  if (reviews[reviewIndex].userId !== req.user.id) {
    return res.status(403).json({ error: "Not authorized to update this review" })
  }

  reviews[reviewIndex] = {
    ...reviews[reviewIndex],
    title: title || reviews[reviewIndex].title,
    content: content || reviews[reviewIndex].content,
    productName: productName || reviews[reviewIndex].productName,
    category: category || reviews[reviewIndex].category,
    rating: rating ? Number.parseInt(rating) : reviews[reviewIndex].rating,
    updatedAt: new Date().toISOString(),
  }

  saveReviews(reviews)

  res.json(reviews[reviewIndex])
})

// Delete a review
router.delete("/:id", requireAuth, (req, res) => {
  const reviews = loadReviews()
  const reviewIndex = reviews.findIndex((r) => r.id === req.params.id)

  if (reviewIndex === -1) {
    return res.status(404).json({ error: "Review not found" })
  }

  // Check if the user is the owner of the review
  if (reviews[reviewIndex].userId !== req.user.id) {
    return res.status(403).json({ error: "Not authorized to delete this review" })
  }

  // Remove the review
  const deletedReview = reviews.splice(reviewIndex, 1)[0]
  saveReviews(reviews)

  // Also delete all comments associated with this review
  const comments = loadComments()
  const updatedComments = comments.filter((c) => c.reviewId !== req.params.id)
  fs.writeFileSync(commentsFile, JSON.stringify(updatedComments, null, 2))

  res.json({ message: "Review deleted successfully", review: deletedReview })
})

module.exports = router
