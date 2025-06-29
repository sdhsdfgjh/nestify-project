if (process.env.NODE_ENV !== "production") {
    require("dotenv").config();
}

const express = require("express");
const app = express();
const mongoose = require("mongoose");
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const ExpressError = require("./utils/ExpressError.js");

const session = require("express-session");
const MongoStore = require("connect-mongo");
const flash = require("connect-flash");

const passport = require("passport");
const LocalStrategy = require("passport-local");
const User = require("./models/user.js");

// Routers
const listingRouter = require("./routes/listing.js");
const reviewRouter = require("./routes/review.js");
const userRouter = require("./routes/user.js");

// MongoDB connection
const dbUrl = process.env.ATLAS_URL || "mongodb://localhost:27017/wanderlust";

mongoose.connect(dbUrl)
    .then(() => console.log("✅ Connected to MongoDB"))
    .catch(err => console.error("❌ MongoDB Error:", err));

// View engine setup
app.engine("ejs", ejsMate);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Middleware setup
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.use(express.static(path.join(__dirname, "public")));

// Session store
const store = MongoStore.create({
    mongoUrl: dbUrl,
    crypto: {
        secret: process.env.SECRET || "backupsecret",
    },
    touchAfter: 24 * 3600,
});

store.on("error", err => {
    console.log("❌ SESSION STORE ERROR:", err);
});

const sessionConfig = {
    store,
    secret: process.env.SECRET || "backupsecret",
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        maxAge: 1000 * 60 * 60 * 24 * 7, // 1 week
    },
};

app.use(session(sessionConfig));
app.use(flash());

// Passport configuration
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// Flash and current user middleware
app.use((req, res, next) => {
    res.locals.success = req.flash("success");
    res.locals.error = req.flash("error");
    res.locals.currUser = req.user;
    next();
});

// Routes
app.use("/", userRouter);
app.use("/listings", listingRouter);
app.use("/listings/:id/reviews", reviewRouter);

// Catch-all 404
app.all("/*any", (req, res, next) => {
    next(new ExpressError(404, "Page Not Found"));
});

// Central error handler
app.use((err, req, res, next) => {
    const { statusCode = 500 } = err;
    if (!err.message) err.message = "Oh no! Something went wrong.";
    res.status(statusCode).render("error", { err });
});

// Start server
const port = process.env.PORT || 8080;
app.listen(port, () => {
    console.log(`🚀 Server running on port ${port}`);
});
