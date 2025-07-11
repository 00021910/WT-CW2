const express = require("express")
const router = express.Router()
const fs = require("fs")
const path = require("path")
const { requireAuth } = require("../middleware/auth")

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
  try {
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

    // Define categories with keys, localized names, and image filenames
    const categoryList = [
      { key: 'electronics', name: req.__("category.electronics"), image: '/images/categories/electronics.jpg' },
      { key: 'home_appliances', name: req.__("category.home_appliances"), image: '/images/categories/home_appliances.jpg' },
      { key: 'kitchen_appliances', name: req.__("category.kitchen_appliances"), image: '/images/categories/kitchen_appliances.jpg' },
      { key: 'restaurants', name: req.__("category.restaurants"), image: '/images/categories/restaurants.jpg' },
      { key: 'hotels', name: req.__("category.hotels"), image: '/images/categories/hotels.jpg' },
      { key: 'entertainment', name: req.__("category.entertainment"), image: '/images/categories/entertainment.jpg' },
      { key: 'movies', name: req.__("category.movies"), image: '/images/categories/movies.jpg' },
      { key: 'series', name: req.__("category.series"), image: '/images/categories/series.jpg' },
      { key: 'books', name: req.__("category.books"), image: '/images/categories/books.jpg' },
      { key: 'fitness', name: req.__("category.fitness"), image: '/images/categories/fitness.jpg' },
      { key: 'footwear', name: req.__("category.footwear"), image: '/images/categories/footwear.jpg' },
      { key: 'other', name: req.__("category.other"), image: '/images/categories/other.jpg' },
    ]

    res.render("home", {
      user: req.user || null,
      popularReviews,
      locale: req.getLocale(),
      categories: categoryList,
    })
  } catch (err) {
    res.status(500).render("error", {
      message: err.message || "An unexpected error occurred.",
      user: req.user || null,
      error: err
    })
  }
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
    filteredReviews = filteredReviews.filter((review) => review.category.replace(/\s+/g, '_').toLowerCase() === req.query.category)
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
  
  if (req.query.language) {
    filteredReviews = filteredReviews.filter((review) => review.language === req.query.language)
  }

  // Use the full category list for filter dropdown
  const categoryList = [
    { key: 'electronics', name: req.__("category.electronics") },
    { key: 'home_appliances', name: req.__("category.home_appliances") },
    { key: 'kitchen_appliances', name: req.__("category.kitchen_appliances") },
    { key: 'restaurants', name: req.__("category.restaurants") },
    { key: 'hotels', name: req.__("category.hotels") },
    { key: 'entertainment', name: req.__("category.entertainment") },
    { key: 'movies', name: req.__("category.movies") },
    { key: 'series', name: req.__("category.series") },
    { key: 'books', name: req.__("category.books") },
    { key: 'fitness', name: req.__("category.fitness") },
    { key: 'footwear', name: req.__("category.footwear") },
    { key: 'other', name: req.__("category.other") },
  ]

  res.render("search", {
    user: req.user || null,
    reviews: filteredReviews,
    categories: categoryList,
    query: req.query,
    locale: req.getLocale(),
  })
})

// Review detail page
router.get("/reviews/:id", (req, res) => {
  const reviews = loadReviews()
  const review = reviews.find((r) => r.id === req.params.id)

  if (!review) {
    return res.status(404).render("error", {
      message: "Review not found",
      user: req.user || null,
    })
  }

  const comments = loadComments()
  const reviewComments = comments.filter((c) => c.reviewId === req.params.id)

  res.render("review-detail", {
    user: req.user || null,
    review,
    comments: reviewComments,
    locale: req.getLocale(),
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
    locale: req.getLocale(),
  })
})

// Edit review page (protected)
router.get("/edit-review/:id", requireAuth, (req, res) => {
  const reviews = loadReviews()
  const review = reviews.find((r) => r.id === req.params.id)

  if (!review) {
    return res.status(404).render("error", {
      message: "Review not found",
      user: req.user || null,
    })
  }

  // Check if the user is the owner of the review
  if (review.userId !== req.user.id) {
    return res.status(403).render("error", {
      message: "Not authorized to edit this review",
      user: req.user || null
    })
  }

  // Get unique categories for dropdown
  const categories = [...new Set(reviews.map((review) => review.category))]

  res.render("edit-review", {
    user: req.user || null,
    review,
    categories,
    locale: req.getLocale(),
  })
})

// User profile page
router.get("/profile", requireAuth, (req, res) => {
  const reviews = loadReviews()
  const userReviews = reviews.filter((r) => r.userId === req.user.id)

  const comments = loadComments()
  const userComments = comments.filter((c) => c.userId === req.user.id)

  res.render("profile", {
    user: req.user || null,
    reviews: userReviews,
    comments: userComments,
    locale: req.getLocale(),
  })
})

// Category page - list all posts in a category
router.get("/category/:categoryKey", (req, res) => {
  const categoryKey = req.params.categoryKey
  // Define categories as in the homepage
  const categoryList = [
    { key: 'electronics', name: req.__("category.electronics"), image: '/images/categories/electronics.jpg' },
    { key: 'home_appliances', name: req.__("category.home_appliances"), image: '/images/categories/home_appliances.jpg' },
    { key: 'kitchen_appliances', name: req.__("category.kitchen_appliances"), image: '/images/categories/kitchen_appliances.jpg' },
    { key: 'restaurants', name: req.__("category.restaurants"), image: '/images/categories/restaurants.jpg' },
    { key: 'hotels', name: req.__("category.hotels"), image: '/images/categories/hotels.jpg' },
    { key: 'entertainment', name: req.__("category.entertainment"), image: '/images/categories/entertainment.jpg' },
    { key: 'movies', name: req.__("category.movies"), image: '/images/categories/movies.jpg' },
    { key: 'series', name: req.__("category.series"), image: '/images/categories/series.jpg' },
    { key: 'books', name: req.__("category.books"), image: '/images/categories/books.jpg' },
    { key: 'fitness', name: req.__("category.fitness"), image: '/images/categories/fitness.jpg' },
    { key: 'footwear', name: req.__("category.footwear"), image: '/images/categories/footwear.jpg' },
    { key: 'other', name: req.__("category.other"), image: '/images/categories/other.jpg' },
  ]
  const category = categoryList.find(cat => cat.key === categoryKey)
  if (!category) {
    return res.status(404).render("error", {
      message: req.__("Category not found"),
      user: req.user || null,
    })
  }
  const reviews = loadReviews().filter(r => r.category.replace(/\s+/g, '_').toLowerCase() === categoryKey)
  res.render("category", {
    user: req.user || null,
    category,
    reviews,
    locale: req.getLocale(),
  })
})

module.exports = router
