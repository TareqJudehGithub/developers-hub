const express = require("express");
const router = express.Router();
const auth = require("../../middleware/auth");
const { validationResult } = require("express-validator");
const { profileCheck } = require("../../validator/index");
const chalk = require("chalk");

const Profile = require("../../models/Profile");
const User = require("../../models/User");

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

// @route      POST api/profile
// @desc       Create/Update user profile
// access      Private
router.post("/", profileCheck, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array()[0].msg });
  }
  const {
    company,
    website,
    location,
    bio,
    status,
    githubusername,
    skills,
    youtube,
    facebook,
    twitter,
    instagram,
    linkedin,
  } = req.body;

  // Build profile object:
  const profileFields = {};
  profileFields.user = req.user.id;
  if (company) profileFields.company = company;
  if (website) profileFields.website = website;
  if (location) profileFields.location = location;
  if (bio) profileFields.bio = bio;
  if (status) profileFields.status = status;
  if (githubusername) profileFields.githubusername = githubusername;
  if (skills) {
    // split skills into an array:
    profileFields.skills = skills.split(",").map((skill) => skill.trim());
  }
  // Build social object:
  const social = (profileFields.social = {});
  if (youtube) social.youtube = youtube;
  if (facebook) social.facebook = facebook;
  if (twitter) social.twitter = twitter;
  if (instagram) social.instagram = instagram;
  if (linkedin) social.linkedin = linkedin;

  try {
    let profile = await Profile.findOne({ user: req.user.id });

    if (profile) {
      // Update:
      profile = await Profile.findOneAndUpdate(
        { user: req.user.id },
        { $set: profileFields },
        { new: true }
      );
      console.log(chalk.blue(`User profile details updated successfully!`));
      return res.json(profile);
    }
    // Create new profile:
    profile = new Profile(profileFields);
    await profile.save();
    console.log(chalk.blue(`User new profile was successfully! created!`));
    return res.json(profile);
  } catch (error) {
    console.log(chalk.red(error.message));
    return res.status(500).json({ msg: "Server Error!" });
  }
});

module.exports = router;
