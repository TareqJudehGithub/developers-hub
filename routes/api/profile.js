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
        .status(404)
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
        .status(404)
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

  if (skills) {
    // split skills into an array:
    skills = skills.split(",").map((skill) => skill.trim());
  }

  let profileFields = {
    company: company,
    website: website,
    location: location,
    bio: bio,
    status: status,
    githubusername: githubusername,
    skills: skills,
    social: [
      {
        youtube: youtube,
        facebook: facebook,
        twitter: twitter,
        instagram: instagram,
        linkedin: linkedin,
      },
    ],
  };

  try {
    let profile = await Profile.findOne({ user: req.user.id });

    // Update Profile:
    if (profile) {
      updated = Date.now();
      profile = await Profile.findOneAndUpdate(
        { user: req.user.id },
        { $set: profileFields, updated: updated },
        { new: true }
      );
      console.log(chalk.blue(`User profile details updated successfully!`));
      return res.json(profile);
    }

    // Create new profile:
    console.log(`user: ${req.user.id}`);
    profile = await Profile.findOneAndUpdate(
      { user: req.user.id },
      {
        $setOnInsert: profileFields,
      },
      { upsert: true }
    );

    console.log(chalk.blue(`User new profile was successfully! created!`));
    return res.json(profile);
  } catch (error) {
    console.log(chalk.red(error.message));
    return res.status(500).json({ errors: `Server Error! ${error}` });
  }
});

// Profile Experience:

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

  try {
    // Add experience:
    const profile = await Profile.findOneAndUpdate(
      { user: req.user.id },
      {
        $push: {
          experience: [
            {
              title: title,
              company: company,
              location: location,
              from: from,
              to: to,
              current: current,
              description: description,
            },
          ],
        },
      }
    );

    console.log(chalk.blue(`User profile experience added successfully!`));
    res.json(profile);
  } catch (error) {
    console.log(chalk.red(error.message));
    return res.status(500).json({ errors: `Server Error! ${error}` });
  }
});
// Update Profile Experience:
// @route   PUT api/profile/experience/:exp_id
// @desc    Update experience in profile
// @access  Private
router.put("/experience/:exp_id", experienceCheck, async (req, res) => {
  const { title, company, location, from, to, current, description } = req.body;
  let profile = await Profile.findOne({ user: req.user.id });
  try {
    const expIndex = profile.experience
      .map((item) => item._id)
      .includes(req.params.exp_id);
    console.log("index", expIndex);
    console.log(`params: ${req.params.exp_id}`);
    if (!expIndex) {
      return res.status(404).json({ msg: "Record not found!" });
    }
    profile = await Profile.findOneAndUpdate(
      {
        experience: { $elemMatch: { _id: req.params.exp_id } },
      },
      {
        $set: {
          "experience.$.title": title,
          "experience.$.company": company,
          "experience.$.location": location,
          "experience.$.from": from,
          "experience.$.to": to,
          "experience.$.current": current,
          "experience.$.description": description,
        },
      },
      { new: true }
    );
    res.json(profile);
    console.log(chalk.blue("Profile experience update was successful!"));
  } catch (error) {
    console.log(chalk.red(error.message));
    return res.status(500).json({ msg: `Server Error! ${error}` });
  }
});

// Delete experience
// @route   Delete api/profile/experience/:exp_id
// @desc    Delete experience from profile
// @access  Private
router.delete("/experience/:exp_id", auth, async (req, res) => {
  try {
    // Check if user exists:
    const user = await User.findOne({ user: req.user.id });
    if (!user) {
      return res.status(404).json({ msg: "Error! User not found!" });
    }
    // Get the profile of the logged in user:
    let profile = await Profile.findOne({ user: req.user.id });

    // Check if index exists:
    const expIndex = profile.experience
      .map((item) => item._id)
      .includes(req.params.exp_id);

    if (!expIndex) {
      return res.status(401).json({ msg: "No record found!" });
    }
    // Get remove index:
    profile = await Profile.findOneAndUpdate(
      { user: req.user.id },
      { $pull: { experience: { _id: req.params.exp_id } } }
    );

    console.log(
      chalk.blue(`User profile experience was successfully removed!`)
    );
    res.json(profile.experience);
  } catch (error) {
    console.log(chalk.red(error.message));
    return res.status(500).json({ errors: `Server Error! ${error}` });
  }
});

// Profile Education:

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

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array()[0].msg });
  }

  try {
    // Check if user exists:
    const user = await User.findOne({ user: req.user.id });
    if (!user) {
      return res.status(404).json({ msg: "Error! User not found!" });
    }

    profile = await Profile.findOneAndUpdate(
      { user: req.user.id },
      {
        $push: {
          education: [
            {
              school: school,
              degree: degree,
              fieldofstudy: fieldofstudy,
              from: from,
              to: to,
              current: current,
              description: description,
            },
          ],
        },
      }
    );

    console.log(chalk.blue("New education has been added successfully!"));
    res.json(profile);
  } catch (error) {
    console.log(chalk.red(error.message));
    return res.status(500).json({ errors: `Server Error! ${error}` });
  }
});
// Update Education in Profile:
router.put("/education/:edu_id", educationCheck, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array()[0].msg });
  }
  try {
    const {
      school,
      degree,
      fieldofstudy,
      from,
      to,
      current,
      description,
    } = req.body;

    // Check if user exists:
    const user = await User.findOne({ user: req.user.id });
    if (!user) {
      return res.status(404).json({ msg: "Error! User not found!" });
    }
    // Check if profile exists:
    let profile = await Profile.findOne({ user: req.user.id });
    if (!profile) {
      return res.status(404).json({ msg: "Error! User profile not found!" });
    }

    // Check if record exists:
    const eduId = profile.education
      .map((item) => item._id)
      .includes(req.params.edu_id);
    if (!eduId) {
      return res.status(401).json({ msg: "No record found!" });
    }

    profile = await Profile.findOneAndUpdate(
      { education: { $elemMatch: { _id: req.params.edu_id } } },
      {
        $set: {
          "education.$.school": school,
          "education.$.degree": degree,
          "education.$.fieldofstudy": fieldofstudy,
          "education.$.from": from,
          "education.$.to": to,
          "education.$.current": current,
          "education.$.description": description,
        },
      },
      { new: true }
    );
    res.json(profile);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ msg: "Server error" });
  }
});

// Delete Education
// @route   Delete api/profile/:edu_id
// @desc    Delete user profile education
// @access Private
router.delete("/education/:edu_id", auth, async (req, res) => {
  try {
    let profile = await Profile.findOne({ user: req.user.id });

    // Check if index exists:
    const eduIndex = profile.education
      .map((item) => item._id)
      .includes(req.params.edu_id);
    if (!eduIndex) {
      return res.status(401).json({ msg: "No record found!" });
    }
    // Remove index:
    profile = await Profile.findOneAndUpdate(
      { user: req.user.id },
      { $pull: { education: { _id: req.params.edu_id } } }
    );

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
        .status(404)
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
