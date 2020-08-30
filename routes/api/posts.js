const express = require("express");
const router = express.Router();

const { postCheck } = require("../../validator/index");
const { validationResult } = require("express-validator");

const User = require("../../models/User");
const Post = require("../../models/Post");
const Profile = require("../../models/Profile");
const chalk = require("chalk");


// @route      POST api/posts
// @desc       Create a Post
// access      Private
router.post("/", postCheck, async (req, res) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array()[0].msg });
  }
  try {
    // Fetch user by Id 
    const user = await User
      .findById(req.user.id)
      .select("-password")

    // New post:
    const newPost = await new Post({
      text: req.body.text,

      user: req.user.id,
      name: user.name,
      avatar: user.avatar
    })

    const post = await newPost.save();

    res.json(post);
    console.log(chalk.blue("Post was created successfully!"));

  } catch (error) {
    console.log(chalk.red(error.message));
    return res.status(500).json({ msg: "Server error" });
  }
});

module.exports = router;
