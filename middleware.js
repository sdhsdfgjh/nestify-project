const Listing = require("./models/listing");
const Review = require("./models/review");
const ExpressError = require("./utils/ExpressError.js");
const { listingSchema, reviewSchema } = require("./schema.js");

// ───────────────────────────────────────────────────────────
// 1) AUTH CHECK
// ───────────────────────────────────────────────────────────
module.exports.isLoggedIn = (req, res, next) => {
  if (!req.isAuthenticated()) {
    req.session.redirectUrl = req.originalUrl;
    req.flash("error", "You must be logged in first!");
    return res.redirect("/login");
  }
  next();
};

// ───────────────────────────────────────────────────────────
// 2) SAVE REDIRECT URL FOR LOGIN
// ───────────────────────────────────────────────────────────
module.exports.saveRedirectUrl = (req, res, next) => {
  if (req.session.redirectUrl) {
    res.locals.redirectUrl = req.session.redirectUrl;
  }
  next();
};

// ───────────────────────────────────────────────────────────
// 3) LISTING OWNERSHIP CHECK
// ───────────────────────────────────────────────────────────
module.exports.isOwner = async (req, res, next) => {
  const { id } = req.params;
  const listing = await Listing.findById(id);

  if (!listing) {
    req.flash("error", "Listing not found.");
    return res.redirect("/listings");
  }

  if (!listing.owner || !req.user || listing.owner.toString() !== req.user._id.toString()) {
    req.flash("error", "You do not have permission to do that.");
    return res.redirect(`/listings/${id}`);
  }

  next();
};

// ───────────────────────────────────────────────────────────
// 4) REVIEW AUTHOR CHECK
// ───────────────────────────────────────────────────────────
module.exports.isReviewAuthor = async (req, res, next) => {
  const { id, reviewId } = req.params;
  const review = await Review.findById(reviewId);

  if (!review) {
    req.flash("error", "Review not found.");
    return res.redirect(`/listings/${id}`);
  }

  if (!review.author || !req.user || review.author.toString() !== req.user._id.toString()) {
    req.flash("error", "You do not have permission to do that.");
    return res.redirect(`/listings/${id}`);
  }

  next();
};

// ───────────────────────────────────────────────────────────
// 5) JOI VALIDATION — LISTINGS
// ───────────────────────────────────────────────────────────
module.exports.validateListing = (req, res, next) => {
  const { error } = listingSchema.validate(req.body);
  if (error) {
    const errMsg = error.details.map(el => el.message).join(", ");
    throw new ExpressError(400, errMsg);
  }
  next();
};

// ───────────────────────────────────────────────────────────
// 6) JOI VALIDATION — REVIEWS
// ───────────────────────────────────────────────────────────
module.exports.validateReview = (req, res, next) => {
  const { error } = reviewSchema.validate(req.body);
  if (error) {
    const errMsg = error.details.map(el => el.message).join(", ");
    throw new ExpressError(400, errMsg);
  }
  next();
};
