// controllers/listing.js
const Listing = require("../models/listing");
const mbxGeocoding = require("@mapbox/mapbox-sdk/services/geocoding");
const mapToken = process.env.MAP_TOKEN;
const geocodingClient = mbxGeocoding({ accessToken: mapToken });

// ───────────────────────────────────────────────────────
// LIST ALL LISTINGS
// ───────────────────────────────────────────────────────
module.exports.index = async (req, res) => {
  const allListings = await Listing.find({});
  res.render("listings/index.ejs", { allListings });
};

// ───────────────────────────────────────────────────────
// RENDER NEW FORM
// ───────────────────────────────────────────────────────
module.exports.renderNewForm = (req, res) => {
  res.render("listings/new.ejs");
};

// ───────────────────────────────────────────────────────
// SHOW SINGLE LISTING (owner + reviews + author populated)
// ───────────────────────────────────────────────────────
module.exports.showListing = async (req, res) => {
  const { id } = req.params;

  const listing = await Listing.findById(id)
    .populate("owner")
    .populate({
      path: "reviews",
      populate: { path: "author" }
    });

  if (!listing) {
    req.flash("error", "Listing you requested does not exist.");
    return res.redirect("/listings");
  }

  res.render("listings/show.ejs", { listing });
};

// ───────────────────────────────────────────────────────
// CREATE LISTING
// ───────────────────────────────────────────────────────
module.exports.createListing = async (req, res, next) => {
  const geoRes = await geocodingClient.forwardGeocode({
    query: req.body.listing.location,
    limit: 1
  }).send();

  const { path: url, filename } = req.file;

  const newListing = new Listing(req.body.listing);
  newListing.owner = req.user._id;
  newListing.image = { url, filename };
  newListing.geometry = geoRes.body.features[0].geometry;

  await newListing.save();

  req.flash("success", "New Listing Created!");
  res.redirect(`/listings/${newListing._id}`);
};

// ───────────────────────────────────────────────────────
// RENDER EDIT FORM
// ───────────────────────────────────────────────────────
module.exports.renderEditForm = async (req, res) => {
  const { id } = req.params;
  const listing = await Listing.findById(id).populate("owner");

  if (!listing) {
    req.flash("error", "Listing you requested does not exist.");
    return res.redirect("/listings");
  }

  const originalImageUrl = listing.image.url.replace("/upload", "/upload/h_150,w_250");
  res.render("listings/edit.ejs", { listing, originalImageUrl });
};

// ───────────────────────────────────────────────────────
// UPDATE LISTING
// ───────────────────────────────────────────────────────
module.exports.updateListing = async (req, res) => {
  const { id } = req.params;
  const listing = await Listing.findByIdAndUpdate(id, { ...req.body.listing }, { new: true });

  if (req.file) {
    const { path: url, filename } = req.file;
    listing.image = { url, filename };
    await listing.save();
  }

  req.flash("success", "Listing Updated!");
  res.redirect(`/listings/${listing._id}`);
};

// ───────────────────────────────────────────────────────
// DELETE LISTING
// ───────────────────────────────────────────────────────
module.exports.destroyListing = async (req, res) => {
  const { id } = req.params;
  await Listing.findByIdAndDelete(id);
  req.flash("success", "Listing Deleted!");
  res.redirect("/listings");
};
