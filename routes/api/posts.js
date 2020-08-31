const express = require("express");
const router = express.Router();

const auth = require("../../middleware/auth");
const { postCheck } = require("../../validator/index");
const { validationResult } = require("express-validator");

const User = require("../../models/User");
const Post = require("../../models/Post");
const Profile = require("../../models/Profile");
const chalk = require("chalk");
const { json } = require("express");



// @route      GET api/posts
// @desc       GET all Post
// access      Private
router.get("/", auth, async (req, res) => {
  try {
    const posts = await Post
      .find()
      .sort({ date: -1 }) //sort by recent posts

    res.json(posts);
    console.log(chalk.blue("Fetching all users posts!"));
  } catch (error) {
    console.log(chalk.red(error.message));
    return res.status(500).json({ msg: "Server Error!" });
  }
});

// @route      GET api/posts
// @desc       GET a single post by Id
// access      Private
router.get("/:post_id", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);


    console.log("req.user.id", req.user.id);

    const post = await Post.findById(req.params.post_id);
    console.log("post.user.toString()", post.user.toString());

    if (post.user.toString() !== req.user.id) {
      return res.status(403).json({ msg: "Action not authorized!" });
    }

    res.json(post);
    console.log(chalk.blue(`${user.name} post ${req.params.post_id} retrieval has been successful!`));
  } catch (error) {
    if (error.kind === "ObjectId") {
      return res.status(404).json({ msg: "Post not found!!" });
    }
    console.log(chalk.red(error.message));
    return res.status(500).json({ msg: "Server Error!" });
  }
})

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
    const { text } = req.body;

    const newPost = await new Post({
      text: text,

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

// @route     PUT api/posts/:post_id
// @desc      Edit user's post
// @access    Private
router.put("/:post_id", postCheck, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array()[0].msg });
  }
  try {
    const { text } = req.body;
    let post = await Post.findById(req.params.post_id);
    post = await Post.findOneAndUpdate(
      { user: req.user.id },
      {
        $set:
          { "text": text }
      },
      { new: true }
    );
    res.json(post);
    console.log(chalk.blue(`Post ${req.params.post_id} update completed!`));
  } catch (error) {
    console.log(chalk.red(error.message));
    if (error.kind === "ObjectId") {
      return res.status(404).json({ msg: "Post not found!" });
    }
    return res.status(500).json({ msg: "Server error" });
  }
})


// @route      DELETE api/posts/:post_id
// @desc       Delete a Post
// @access     Private
router.delete("/:post_id", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    let post = await Post.findById(req.params.post_id);
    // Check if post exists:
    if (!post) {
      return res.status(404).json({ msg: "Post not found!" });
    }
    // Only logged-in user can delete his/her own post:
    if (post.user.toString() !== req.user.id) {
      return res.status(403).json({ msg: "Action not authorized!" });
    }
    post = await Post.findByIdAndRemove(req.params.post_id);

    res.json(
      { msg: `${user.name} post ID(${req.params.post_id}) has been successfully deleted!` }
    );


  } catch (error) {
    if (error.kind === "ObjectId") {
      return res.status(404).json({ msg: "Post not found!!" });
    }
    console.log(chalk.red(error.message));
    return res.status(500).json({ msg: "Server error" });
  }
})


module.exports = router;
