const express = require("express");
const router = express.Router();
// const Axios = require("axios");
const normalizeUrl = require("normalize-url");
const auth = require("../../middleware/auth");
const { validationResult } = require("express-validator");
const {
  profileCheck,
  experienceCheck,
  educationCheck,
} = require("../../validator/index");
const request = require("request");
const config = require("config");
const chalk = require("chalk");

const Profile = require("../../models/Profile");
const User = require("../../models/User");
const { response } = require("express");
const { default: Axios } = require("axios");

// @route      GET api/profile
// @desc       Get all profile
// access      Public
router.get("/", async (req, res) => {
  try {
    const profiles = await Profile.find()
      .populate("user", ["name", "avatar"])
      .select("-updated");
    res.json(profiles);
  } catch (error) {
    console.log(chalk.red(error.message));
    return res.status(500).json({ msg: "Server Error!" });
  }
});

// @route      GET api/profile/me
// @desc       Get current users profile
// access      Public
router.get("/me", auth, async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.user.id }) // user obj in ProfileSchema.
      .populate("user", ["name", "avatar"])
      .select("-__v -updated");
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

// @route   GET api/profile/user/:userId
// @desc    Get user profile by user Id
// @access  Public
router.get("/user/:userId", async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.params.userId })
      .populate("user", ["name", "avatar"])
      .select("-updated");

    if (!profile) {
      return res
        .status(400)
        .json({ errors: [{ msg: "User profile not found!" }][0].msg });
    }
    console.log(chalk.blue("GET profile by userId was successfull!"));
    return res.json(profile);
  } catch (error) {
    console.log(chalk.red(error.message));
    if (error.kind == "ObjectId") {
      return res
        .status(400)
        .json({ errors: [{ msg: "User profile not found!" }][0].msg });
    }
    return res.status(500).json({ errors: `Server Error! ${error}` });
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
  let {
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
    updated,
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

  updated = Date.now();
  if (updated) profileFields.updated = updated;
  try {
    let profile = await Profile.findOne({ user: req.user.id });

    // Update:
    if (profile) {
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
    return res.status(500).json({ errors: `Server Error! ${error}` });
  }
});

// Add experience
// @route   PUT api/profile/experince
// @desc    Add profile experince
// @access  Private
router.put("/experience", experienceCheck, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array()[0].msg });
  }

  const { title, company, location, from, to, current, description } = req.body;
  // Create a new obj with the data the user submits:

  const newExp = {
    title,
    company,
    location,
    from,
    to,
    current,
    description,
  };

  try {
    let profile = await Profile.findOne({ user: req.user.id });

    // Add experience,sorting the latest data up top:
    profile.experience.unshift(newExp);
    await profile.save();

    console.log(chalk.blue(`User profile experience added successfully!`));
    res.json(profile);
  } catch (error) {
    console.log(chalk.red(error.message));
    return res.status(500).json({ errors: `Server Error! ${error}` });
  }
});

// Delete experience
// @route   Delete api/profile/experience/:exp_id
// @desc    Delete experience from profile
// @access  Private
router.delete("/experience/:exp_id", auth, async (req, res) => {
  try {
    // Get the profile of the logged in user:
    const profile = await Profile.findOne({ user: req.user.id });

    // Get remove index:
    const removeIndex = profile.experience
      .map((item) => item._id)
      .indexOf(req.params.exp_id);
    profile.experience.splice(removeIndex, 1);

    await profile.save();
    console.log(
      chalk.blue(`User profile experience was successfully removed!`)
    );
    res.json(profile);
  } catch (error) {
    console.log(chalk.red(error.message));
    return res.status(500).json({ errors: `Server Error! ${error}` });
  }
});

// Add education
// @route PUT     api/profile/education
// @description   api/profile/description
// @access        Private

router.put("/education", educationCheck, async (req, res) => {
  const {
    school,
    degree,
    fieldofstudy,
    from,
    to,
    current,
    description,
  } = req.body;

  const newEdu = {
    school,
    degree,
    fieldofstudy,
    from,
    to,
    current,
    description,
  };
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array()[0].msg });
  }

  try {
    let profile = await Profile.findOne({ user: req.user.id });
    profile.education.unshift(newEdu);
    await profile.save();
    console.log(chalk.blue("New education has been added successfully!"));
    res.json(profile);
  } catch (error) {
    console.log(chalk.red(error.message));
    return res.status(500).json({ errors: `Server Error! ${error}` });
  }
});
// Delete Education
// @route   Delete api/profile/:edu_id
// @desc    Delete user profile education
// @access Private
router.delete("/education/:edu_id", auth, async (req, res) => {
  try {
    let profile = await Profile.findOne({ user: req.user.id });
    // Get remove index:
    const removeIndex = profile.education
      .map((item) => item._id)
      .indexOf(req.params.edu_id);

    profile.education.splice(removeIndex, 1);
    profile.save();

    console.log(chalk.blue(`User profile education was successfully removed!`));
    res.json(profile);
  } catch (error) {
    console.log(chalk.red(error.message));
    return res.status(500).json({ errors: `Server Error! ${error}` });
  }
});

// @route   Delete api/profile/:userId
// @desc    Delete profile: user and posts
// @access  Private
router.delete("/", auth, async (req, res) => {
  try {
    // @todo - remove users posts

    // Remove profile
    await Profile.findOneAndRemove({ user: req.user.id });

    // Remove User:
    const user = await User.findOneAndRemove({ _id: req.user.id });
    if (!user) {
      return res
        .status(400)
        .json({ errors: [{ msg: `User not found!` }][0].msg });
    }
    console.log(chalk.blue("User deletion was successfull!"));
    res.json({ msg: `User was successfully removed!` });
  } catch (error) {
    console.log(chalk.red(error.message));
    return res.status(500).json({ msg: "Server Error!" });
  }
});

// @route   GET api/profile/github/:username
// @desc    Get user repos from Github
// @access  Public
router.get("/github/:username", async (req, res) => {
  try {
    const uri = encodeURI(
      `https://api.github.com/users/${req.params.username}/repos?per_page=5&sort=created:asc`
    );
    const headers = {
      "user-agent": "node.js",
      Authorization: `token ${config.get("githubToken")}`,
    };

    const gitHubResponse = await Axios.get(uri, { headers });
    return res.json(gitHubResponse.data);
  } catch (err) {
    console.error(err.message);
    return res.status(404).json({ msg: "No Github profile found" });
  }
});

module.exports = router;

// const profileExpFields = {};
// const experience = (profile.experience = []);
// if (title) experience.title = title;
// if (company) experience.company = company;
// if (location) experience.location = location;
// if (from) experience.from = from;
// if (to) experience.to = to;
// if (current) experience.current = current;
// if (description) experience.description = description;

// Update profile:
// const expId = profile.experience.map((elem) => elem._id);
// console.log("exp ID: ", expId);
// if (expId) {
//   profile = await Profile.findOneAndUpdate(
//     { user: req.user.id },
//     { $set: experience },
//     { new: true }
//   );
//   // console.log(profileFields);
//   console.log(chalk.blue(`User profile experience updated successfully!`));
//   return res.json(profile);
// }
