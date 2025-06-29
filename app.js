/****************************
 *  Load environment vars   *
 ****************************/
if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

/****************************
 *  Imports & initial setup *
 ****************************/
const express        = require("express");
const mongoose       = require("mongoose");
const path           = require("path");
const methodOverride = require("method-override");
const ejsMate        = require("ejs-mate");
const flash          = require("connect-flash");
const session        = require("express-session");
const MongoStore     = require("connect-mongo");

const passport       = require("passport");
const LocalStrategy  = require("passport-local");
const User           = require("./models/user");
const ExpressError   = require("./utils/ExpressError");

const app = express();

/****************************
 *  Routers                 *
 ****************************/
const listingRouter = require("./routes/listing");
const reviewRouter  = require("./routes/review");
const userRouter    = require("./routes/user");

/****************************
 *  MongoDB connection      *
 ****************************/
const dbUrl =
  process.env.ATLAS_URL || "mongodb://localhost:27017/nestify";

mongoose
  .connect(dbUrl)
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch(err => console.error("❌ MongoDB Error:", err));

/****************************
 *  View engine             *
 ****************************/
app.engine("ejs", ejsMate);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

/****************************
 *  Global middleware       *
 ****************************/
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.use(express.static(path.join(__dirname, "public")));

/****************************
 *  Session / Flash         *
 ****************************/
const store = MongoStore.create({
  mongoUrl: dbUrl,
  crypto: { secret: process.env.SECRET || "backupsecret" },
  touchAfter: 24 * 3600,
});

store.on("error", err => console.log("❌ SESSION STORE ERROR:", err));

const sessionConfig = {
  store,
  secret: process.env.SECRET || "backupsecret",
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24 * 7, // 1 week
  },
};

app.use(session(sessionConfig));
app.use(flash());

/****************************
 *  Passport config         *
 ****************************/
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

/****************************
 *  Locals for all views    *
 ****************************/
app.use((req, res, next) => {
  res.locals.success  = req.flash("success");
  res.locals.error    = req.flash("error");
  res.locals.currUser = req.user;
  next();
});

/****************************
 *  Routes                  *
 ****************************/
app.use("/",       userRouter);
app.use("/listings",            listingRouter);
app.use("/listings/:id/reviews", reviewRouter);

/****************************
 *  404 handler             *
 ****************************/
app.all("/*any", (req, res, next) => {
  next(new ExpressError(404, "Page Not Found"));
});

/****************************
 *  Central error handler   *
 ****************************/
app.use((err, req, res, next) => {
  const { statusCode = 500 } = err;
  if (!err.message) err.message = "Oh no! Something went wrong.";
  res.status(statusCode).render("error", { err });
});

/****************************
 *  Start server            *
 ****************************/
const port = process.env.PORT || 8080;
app.listen(port, () => console.log(`🚀 Server running on port ${port}`));
