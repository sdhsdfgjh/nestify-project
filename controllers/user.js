const User = require("../models/user");

// Render signup form
module.exports.renderSignupForm = (req, res) => {
    res.render("users/signup.ejs");
};

// Signup logic
module.exports.signup = async (req, res, next) => {
    try {
        const { username, password, email } = req.body;
        const newUser = new User({ username, email });
        const registeredUser = await User.register(newUser, password);
        console.log(registeredUser);

        // Automatically login after registration
        req.login(registeredUser, (err) => {
            if (err) return next(err);
            req.flash("success", "Welcome to Nestify!");
            res.redirect("/listings");
        });
    } catch (e) {
        req.flash("error", e.message);
        res.redirect("/signup");
    }
};

// Render login form
module.exports.renderLoginForm = (req, res) => {
    res.render("users/login.ejs");
};

// Login logic (passport middleware already authenticates)
module.exports.Login = (req, res) => {
    req.flash("success", "Welcome back to Nestify!");
    const redirectUrl = res.locals.redirectUrl || "/listings";
    res.redirect(redirectUrl);
};

// Logout logic
module.exports.Logout = (req, res, next) => {
    req.logout((err) => {
        if (err) return next(err);
        req.flash("success", "You are logged out!");
        res.redirect("/listings");
    });
};
