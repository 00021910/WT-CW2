const express = require("express")
const router = express.Router()
const fs = require("fs")
const path = require("path")
const crypto = require("crypto")
const bcrypt = require("bcryptjs")

const usersFile = path.join(__dirname, "../data/users.json")

// Helper function to generate 9-digit ID
function generateId() {
  return Math.floor(100000000 + Math.random() * 900000000).toString()
}

// Helper function to load users
function loadUsers() {
  try {
    const data = fs.readFileSync(usersFile, "utf8")
    return JSON.parse(data)
  } catch (error) {
    return []
  }
}

// Helper function to save users
function saveUsers(users) {
  fs.writeFileSync(usersFile, JSON.stringify(users, null, 2))
}

// Login page
router.get("/login", (req, res) => {
  res.render("login", { error: null, user: req.user || req.userId })
})

// Signup page
router.get("/signup", (req, res) => {
  res.render("signup", { error: null, user: req.user || req.userId })
})

// Login post
router.post("/login", (req, res) => {
  const { email, password } = req.body
  const users = loadUsers()
  const user = users.find((u) => u.email === email)

  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.render("login", { error: "Invalid email or password" })
  }

  // Set cookie for authentication
  res.cookie("userId", user.id, { httpOnly: true })
  res.redirect("/")
})

// Signup post
router.post("/signup", (req, res) => {
  const { username, email, password } = req.body
  const users = loadUsers()

  // Check if email already exists
  if (users.some((u) => u.email === email)) {
    return res.render("signup", { error: "Email already in use" })
  }

  // Create new user
  const newUser = {
    id: generateId(),
    username,
    email,
    password: bcrypt.hashSync(password, 10),
    createdAt: new Date().toISOString(),
  }

  users.push(newUser)
  saveUsers(users)

  // Set cookie for authentication
  res.cookie("userId", newUser.id, { httpOnly: true })
  res.redirect("/")
})

// Logout
router.get("/logout", (req, res) => {
  res.clearCookie("userId")
  res.redirect("/login")
})

module.exports = router
