const express = require("express");
const router = express.Router();
const auth = require("../../middleware/auth");
const Profile = require("../../models/Profile");
const User = require("../../models/User");
const chalk = require("chalk");

// @route      GET api/profile/me
// @desc       Get current users profile
// access      Public
router.get("/me", auth, async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.user.id }) // user obj in ProfileSchema.
      .populate("user", ["name", "avatar"]);
    if (!profile) {
      return res
        .status(400)
        .json({ errors: [{ msg: "User profile not found!" }][0].msg });
    }
    res.json(profile);
  } catch (error) {
    console.log(chalk.red(error.message));
    res
      .status(500)
      .json({ msg: "Server Error! Fetching user profile failed." }.msg);
  }
});

module.exports = router;
