const fs = require("fs")
const path = require("path")

const usersFile = path.join(__dirname, "../data/users.json")

// Loading users JSON data
function loadUsers() {
  const data = fs.readFileSync(usersFile, "utf8")
  return JSON.parse(data)
}

// Middleware to load user data for all routes (non-protected)
function loadUser(req, res, next) {
  const { userId } = req.cookies

  if (userId) {
    const users = loadUsers()
    const user = users.find((u) => u.id === userId)
    if (user) {
      req.user = user
    }
  }

  next()
}

// Middleware to protect routes and redirect if a user is not authenticated
function requireAuth(req, res, next) {
  const { userId } = req.cookies

  if (!userId) {
    return res.redirect("/login")
  }

  const users = loadUsers()
  const user = users.find((u) => u.id === userId)

  if (!user) {
    return res.redirect("/login")
  }

  // request carries the user data for ease of use
  req.user = user
  next()
}

module.exports = { requireAuth, loadUser }
