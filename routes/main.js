const express = require("express")
const router = express.Router()
const fs = require("fs")
const path = require("path")
const requireAuth = require("../middleware/auth")

const reviewsFile = path.join(__dirname, "../data/reviews.json")
const commentsFile = path.join(__dirname, "../data/comments.json")

// Helper functions
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

// Home page - accessible to all
router.get("/", (req, res) => {
  const reviews = loadReviews()

  // Sort by popularity (most commented)
  const comments = loadComments()
  const reviewCounts = {}

  comments.forEach((comment) => {
    if (reviewCounts[comment.reviewId]) {
      reviewCounts[comment.reviewId]++
    } else {
      reviewCounts[comment.reviewId] = 1
    }
  })

  const popularReviews = [...reviews]
    .sort((a, b) => {
      const countA = reviewCounts[a.id] || 0
      const countB = reviewCounts[b.id] || 0
      return countB - countA
    })
    .slice(0, 10)

  res.render("home", {
    user: req.cookies.userId ? req.user || req.cookies.userId : null,
    popularReviews,
  })
})

// Search page
router.get("/search", (req, res) => {
  const reviews = loadReviews()
  let filteredReviews = [...reviews]

  // Apply search filters
  if (req.query.q) {
    const searchTerm = req.query.q.toLowerCase()
    filteredReviews = filteredReviews.filter(
      (review) =>
        review.title.toLowerCase().includes(searchTerm) ||
        review.content.toLowerCase().includes(searchTerm) ||
        review.productName.toLowerCase().includes(searchTerm),
    )
  }

  if (req.query.rating) {
    const rating = Number.parseInt(req.query.rating)
    filteredReviews = filteredReviews.filter((review) => review.rating === rating)
  }

  if (req.query.category) {
    filteredReviews = filteredReviews.filter((review) => review.category === req.query.category)
  }

  if (req.query.sentiment) {
    if (req.query.sentiment === "positive") {
      filteredReviews = filteredReviews.filter((review) => review.rating >= 4)
    } else if (req.query.sentiment === "negative") {
      filteredReviews = filteredReviews.filter((review) => review.rating <= 2)
    } else if (req.query.sentiment === "neutral") {
      filteredReviews = filteredReviews.filter((review) => review.rating === 3)
    }
  }

  // Get unique categories for filter dropdown
  const categories = [...new Set(reviews.map((review) => review.category))]

  res.render("search", {
    user: req.cookies.userId ? ( req.user || req.cookies.userId ) : null,
    reviews: filteredReviews,
    categories,
    query: req.query,
  })
})

// Review detail page
router.get("/reviews/:id", (req, res) => {
  const reviews = loadReviews()
  const review = reviews.find((r) => r.id === req.params.id)

  if (!review) {
    return res.status(404).render("error", {
      message: "Review not found",
      user: req.cookies.userId ? req.user : null,
    })
  }

  const comments = loadComments()
  const reviewComments = comments.filter((c) => c.reviewId === req.params.id)

  res.render("review-detail", {
    user: req.cookies.userId ? ( req.user || req.cookies.userId ) : null,
    review,
    comments: reviewComments,
  })
})

// Create review page (protected)
router.get("/create-review", requireAuth, (req, res) => {
  // Get unique categories for dropdown
  const reviews = loadReviews()
  const categories = [...new Set(reviews.map((review) => review.category))]

  res.render("create-review", {
    user: req.user,
    categories,
  })
})

// Edit review page (protected)
router.get("/edit-review/:id", requireAuth, (req, res) => {
  const reviews = loadReviews()
  const review = reviews.find((r) => r.id === req.params.id)

  if (!review) {
    return res.status(404).render("error", {
      message: "Review not found",
      user: req.cookies.userId ? ( req.user || req.cookies.userId ) : null,
    })
  }

  // Check if the user is the owner of the review
  if (review.userId !== req.user.id) {
    return res.status(403).render("error", {
      message: "Not authorized to edit this review",
      user: req.cookies.userId ? ( req.user || req.cookies.userId ) : null
    })
  }

  // Get unique categories for dropdown
  const categories = [...new Set(reviews.map((review) => review.category))]

  res.render("edit-review", {
    user: req.cookies.userId ? ( req.user || req.cookies.userId ) : null,
    review,
    categories,
  })
})

// User profile page
router.get("/profile", requireAuth, (req, res) => {
  const reviews = loadReviews()
  const userReviews = reviews.filter((r) => r.userId === req.user.id)

  const comments = loadComments()
  const userComments = comments.filter((c) => c.userId === req.user.id)

  res.render("profile", {
    user: req.cookies.userId ? ( req.user || req.cookies.userId ) : null,
    reviews: userReviews,
    comments: userComments,
  })
})

module.exports = router
