const express = require("express");
const router = express.Router();
const auth = require("../../middleware/auth");
const { validationResult } = require("express-validator");
const { profileCheck, experienceCheck } = require("../../validator/index");
const chalk = require("chalk");

const Profile = require("../../models/Profile");
const User = require("../../models/User");
const { response } = require("express");

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
    return res.status(500).json({ msg: "Server Error!" });
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

  // // Build experience array:

  // const experience = (profile.experience = []);
  // if (experience.title) experience.title = title;
  // if (experience.company) experience.company = company;
  // if (experience.location) experience.location = location;
  // if (from) experience.from = from;
  // if (to) experience.to = to;
  // if (current) experience.current = current;
  // if (description) experience.description = description;

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
    return res.status(500).json({ msg: "Server Error!" });
  }
});

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

  // const profileExpFields = {};
  // const experience = (profile.experience = []);
  // if (title) experience.title = title;
  // if (company) experience.company = company;
  // if (location) experience.location = location;
  // if (from) experience.from = from;
  // if (to) experience.to = to;
  // if (current) experience.current = current;
  // if (description) experience.description = description;

  try {
    let profile = await Profile.findOne({ user: req.user.id });
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

    // Add experience,sorting the latest data up top:
    // profile = await new Profile(experience);
    profile.experience.unshift(newExp);
    await profile.save();
    console.log("exp ID: ", expId.length);
    console.log(chalk.blue(`User profile experience added successfully!`));
    res.json(profile);
  } catch (error) {
    console.log(chalk.red(error.message));
    return res.status(500).json({ msg: "Server Error!" });
  }
});

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
    return res.status(500).json({ msg: "Server Error!" });
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

module.exports = router;
