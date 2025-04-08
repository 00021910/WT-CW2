// Importing the much needed NPM packages
const express = require("express")
const bodyParser = require("body-parser")
const cookieParser = require("cookie-parser")
const i18n = require("i18n")
const path = require("path")

// Importing our own modules
const mainRoutes = require("./routes/main")
const authRoutes = require("./routes/authroute")
const apiRoutes = require("./routes/api/entry")

const app = express()
const PORT = process.env.PORT || 7070

// setting up the languages we will be using for the app
i18n.configure({
  locales: ["en", "uz", "ru"],
  directory: path.join(__dirname, "locales"),
  defaultLocale: "en",
  cookie: "imo-locale",
})

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))
app.use(cookieParser())
app.use(i18n.init)

app.use(express.static(path.join(__dirname, "public")))

app.set("views", path.join(__dirname, "views"))
app.set("view engine", "ejs")

app.use("/", authRoutes)
app.use("/", mainRoutes)
app.use("/api", apiRoutes)

app.listen(PORT, () => {
  console.log(`IMO app running at http://localhost:${PORT}`)
})
