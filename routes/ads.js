const express = require("express");
const authMiddleware = require("../middlewares/auth.middleware");
const { getAd, getAds, createAd, updateAds, updateAd, deleteAds, deleteAd } = require("../controllers/ads");

const router = express.Router();

// Create a new ad
router.route("/").post(authMiddleware, createAd);

// Get list of ads
router.route("/").get(authMiddleware, getAds);

// Get a specific ad
router.route("/:id/info").get(authMiddleware, getAd);

// Update ads
router.route("/bulk-updates").patch(updateAds);

// Update single ad
router.route("/:id/update").put(updateAd);

// Delete ads
router.route("/bulk-delete").post(deleteAds);

// Delete ad
router.route("/:id/delete").delete(deleteAd);

module.exports = router;
