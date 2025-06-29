// controllers/review.js
const Listing = require("../models/listing");
const Review  = require("../models/review");

// ─────────────────────────────────────────────
//  CREATE REVIEW
// ─────────────────────────────────────────────
module.exports.createReview = async (req, res) => {
  const listing = await Listing.findById(req.params.id);
  if (!listing) {
    req.flash("error", "Listing not found.");
    return res.redirect("/listings");
  }

  // Build the review with body, rating, and author
  const newReview = new Review({
    body:   req.body.review.body,         // textarea name="review[body]"
    rating: req.body.review.rating,
    author: req.user._id                  // logged‑in user
  });

  listing.reviews.push(newReview);

  await newReview.save();
  await listing.save();

  req.flash("success", "Review added!");
  res.redirect(`/listings/${listing._id}`);
};

// ─────────────────────────────────────────────
//  DELETE REVIEW
// ─────────────────────────────────────────────
module.exports.destroyReview = async (req, res) => {
  const { id, reviewId } = req.params;

  // Pull review ref from listing and delete the review document
  await Listing.findByIdAndUpdate(id, { $pull: { reviews: reviewId } });
  await Review.findByIdAndDelete(reviewId);

  req.flash("success", "Review deleted.");
  res.redirect(`/listings/${id}`);
};
