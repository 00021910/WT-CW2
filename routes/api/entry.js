const express = require("express")
const router = express.Router()

// Import API routes
const reviewsRoutes = require("./reviews")
const commentsRoutes = require("./comments")
const usersRoutes = require("./users")

// Uses API routes
router.use("/reviews", reviewsRoutes)
router.use("/comments", commentsRoutes)
router.use("/users", usersRoutes)

module.exports = router
