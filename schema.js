// schema.js
const Joi = require("joi");

const listingSchema = Joi.object({
  listing: Joi.object({
    title: Joi.string().required(),
    price: Joi.number().min(0).required(),
    description: Joi.string().required(),
    location: Joi.string().required(),
    country: Joi.string().required(), // ✅ Added missing country field
    // Add other fields here as needed (e.g., image, category, etc.)
  }).required()
});

const reviewSchema = Joi.object({
  review: Joi.object({
    rating: Joi.number().min(1).max(5).required(),
    body: Joi.string().required()
  }).required()
});

module.exports = { listingSchema, reviewSchema };
