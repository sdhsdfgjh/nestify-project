const express = require("express");
const router = express.Router();
const User = require("../models/user.js");
const passport = require("passport");
const wrapAsync = require("../utils/wrapAsync.js");
const {saveRedirectUrl} = require("../middleware.js");

const userController = require("../controllers/user.js")


// Show registration form
router.get("/register", (req, res) => {
  res.render("users/register"); // Make sure views/users/register.ejs exists
});

// Handle registration logic
router.post("/register", async (req, res) => {
  try {
    const { username, password, email } = req.body;
    const newUser = new User({ username, email });
    const registeredUser = await User.register(newUser, password);
    req.login(registeredUser, err => {
      if (err) return next(err);
      req.flash("success", "Welcome to Nestify!");
      res.redirect("/listings");
    });
  } catch (e) {
    req.flash("error", e.message);
    res.redirect("/register");
  }
});


router.route("/signup")
.get(userController.renderSignupForm )
.post(wrapAsync(userController.signup))


router.route("/login")
.get(userController.renderLoginForm)
.post(saveRedirectUrl, passport.authenticate("local",{failureRedirect: "/login", failureFlash: true}), userController.Login
)



// logout 
router.get("/logout", userController.Logout);
module.exports = router;


 