const Listing = require("../models/listing");
require("dotenv").config();
const opencage = require("opencage-api-client");

module.exports.index = async (req, res) => {
  const { category, location } = req.query;
  let allListings = [];

  if (category && location) {
    allListings = await Listing.find({
      category,
      location: { $regex: new RegExp(location, "i") },
    });
  } else if (category) {
    allListings = await Listing.find({ category });
  } else if (location) {
    allListings = await Listing.find({
      location: { $regex: new RegExp(location, "i") },
    });
  } else {
    allListings = await Listing.find({});
  }

  res.render("listings/index.ejs", { allListings, category });
};

module.exports.renderNewForm = (req, res) => {
  res.render("listings/new.ejs");
};

module.exports.showListing = async (req, res) => {
  let { id } = req.params;
  const listing = await Listing.findById(id)
    .populate({
      path: "reviews",
      populate: {
        path: "author",
      },
    })
    .populate("owner");
  if (!listing) {
    req.flash("error", "Listing You requested for does not Exist");
    res.redirect("/listings");
  }

  res.render("listings/show.ejs", { listing });
};

module.exports.createListing = async (req, res, next) => {
  try {
    console.log("Form Data:", req.body);

    // 1. Get geocode from OpenCage
    const geoData = await opencage.geocode({
      q: req.body.listing.location,
      key: process.env.OPENCAGE_API_KEY,
    });

    console.log("GeoData:", geoData);

    if (!geoData.results.length) {
      req.flash("error", "Invalid location entered.");
      return res.redirect("/listings/new");
    }
    const { lat, lng } = geoData.results[0].geometry;

    console.log("Uploaded File:", req.file);

    let url = req.file.path;
    let filename = req.file.filename;
    const newListing = new Listing(req.body.listing);
    newListing.owner = req.user._id;
    newListing.image = { url, filename };

    newListing.geometry = {
      type: "Point",
      coordinates: [lng, lat], // Must be [longitude, latitude]
    };

    await newListing.save();
    req.flash("success", "New Listing Created!");
    res.redirect(`/listings/${newListing._id}`);
  } catch (error) {
    console.error("Error creating listing:", error.message);
    req.flash("error", "Something went wrong while creating listing.");
    res.redirect("/listings/new");
  }
};

module.exports.renderEditForm = async (req, res) => {
  let { id } = req.params;
  const listing = await Listing.findById(id);
  if (!listing) {
    req.flash("error", "Listing You requested for does not Exist");
    res.redirect("/listings");
  }
  let originalImageUrl = listing.image.url;
  originalImageUrl = originalImageUrl.replace("/upload", "/upload/h_300,w_250");

  res.render("listings/edit.ejs", { listing, originalImageUrl });
};

module.exports.updateListing = async (req, res) => {
  let { id } = req.params;

  // Get coordinates for new location (from opencage)
  const geoData = await opencage.geocode({
    q: req.body.listing.location,
    key: process.env.OPENCAGE_API_KEY,
  });

  if (!geoData.results.length) {
    req.flash("error", "Invalid location.");
    return res.redirect(`/listings/${id}/edit`);
  }

  const { lat, lng } = geoData.results[0].geometry;

  // Update listing including geometry
  const listing = await Listing.findByIdAndUpdate(
    id,
    {
      ...req.body.listing,
      geometry: {
        type: "Point",
        coordinates: [lng, lat],
      },
    },
    { new: true }
  );

  if (typeof req.file !== "undefined") {
    let url = req.file.path;
    let filename = req.file.filename;
    listing.image = { url, filename };
    await listing.save();
  }
  req.flash("success", "Listing Updated!");
  res.redirect(`/listings/${id}`);
};

module.exports.destroyListing = async (req, res) => {
  let { id } = req.params;
  let deletedListing = await Listing.findByIdAndDelete(id);
  console.log(deletedListing);
  req.flash("success", "Listing Deleted!");
  res.redirect("/listings");
};
