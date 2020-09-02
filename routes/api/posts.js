const express = require("express");
const router = express.Router();

const auth = require("../../middleware/auth");
const { postCheck } = require("../../validator/index");
const { validationResult } = require("express-validator");

const User = require("../../models/User");
const Post = require("../../models/Post");
const Profile = require("../../models/Profile");
const chalk = require("chalk");
const { findOneAndUpdate } = require("../../models/User");

// IMPORTANT Implement GET all posts auth: block deleted users acces.

// @route      GET api/posts
// @desc       GET all Post
// access      Private
router.get("/", auth, async (req, res) => {
  try {

    const user = await User
      .findById(req.user.id)
      .select("-password");

    // Check if user exists:
    if (!user) {
      return res.status(404).json({ msg: "User does not exist!" });
    }
    const posts = await Post
      .find()
      .sort({ date: -1 }) //sort by recent posts

    res.json(posts);
    console.log(chalk.blue("Fetching all users posts!"));
  } catch (error) {
    console.log(chalk.red(error.message));
    return res.status(500).json({ msg: "Server error!" });
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
    return res.status(500).json({ msg: "Server error!" });
  }
});

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
      .select("-password");

    // Check user exists:
    if (!user) {
      res.status(404).json({ msg: "User not found!" });
    };

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
    // Fetch user by Id 
    const user = await User
      .findById(req.user.id)
      .select("-password")

    // Check user exists:
    if (!user) {
      res.status(404).json({ msg: "User not found!" });
    }

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
});

// @route      DELETE api/posts/:post_id
// @desc       Delete a Post
// @access     Private
router.delete("/:post_id", auth, async (req, res) => {
  try {
    const user = await User
      .findById(req.user.id)
      .select("-password");
    // Check if user is logged-in/exists:
    if (!user) {
      return res.status(404).json({ msg: "User not found!" });
    }
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
});


// Likes build:

// @route   PUT api/posts/like/:id
// @desc    users Like on posts
// @access  Private
router.put("/like/:post_id", auth, async (req, res) => {
  try {
    // Check if user exists:
    if (!req.user.id) {
      return res.status(404).json({ msg: "Error! User not found!" });
    }

    let post = await Post.findById(req.params.post_id);

    // Make sure a user only likes a post just 1 time, by comparing 
    // user like user Id to the logged-in user Id:
    if (post.likes
      .filter(like => like.user.toString() === req.user.id).length > 0) {
      return res.status(400).json({ msg: "Post already liked!" });
    }
    post = await Post.findOneAndUpdate(
      { _id: req.params.post_id },
      {
        $push: {
          likes: [
            { user: req.user.id }
          ]
        }
      },
      { new: true }
    );

    // post.likes.unshift({ user: req.user.id });
    // await post.save();
    res.json(post.likes);
    console.log(chalk.blue("User successfully liked a post!"));

  } catch (error) {
    console.log(chalk.red(error.message));
    if (error.kind === "ObjectId") {
      return res.status(404).json({ msg: "Post not found!" });
    }
    return res.status(500).json({ msg: "Server error" });
  }
});

// @route   PUT api/posts/unlike/:id
// @desc    users remove their like on posts
// @access  Private
router.delete("/unlike/:post_id", auth, async (req, res) => {
  try {
    // Check if user exists:
    if (!req.user.id) {
      return res.status(404).json({ msg: "Error! User not found!" });
    }
    let post = await Post.findById(req.params.post_id);

    const likes = post.likes;
    // Make sure a user only likes a post just 1 time, by comparing 
    // user like user is to the logged-in: 
    if (likes
      .filter(like => like.user.toString() === req.user.id).length === 0) {
      return res.status(400).json({ msg: "No likes founds on this Post!" });
    }
    // Get remove index:  

    // const removeIndex = likes
    //   .map(like => like.user.toString())
    //   .indexOf(req.user.id)

    post = await Post.findOneAndUpdate(
      { _id: req.params.post_id },
      {
        $pull: {
          likes:
            { user: req.user.id }

        }
      },
      { new: true }
    )
    // likes.splice(removeIndex, 1);
    // post.save();

    res.json(likes);
    console.log(chalk.blue("User successfully unliked a post!"));
  } catch (error) {
    console.log(chalk.red(error.message));
    res.status(500).json({ msg: "Server error!" });
  }

});

// Comments Build

// @route   POST api/posts/comment/:id
// @desc    Add new comment to posts
// @access  Private
router.post("/comment/:post_id", postCheck, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array()[0].msg });
  }

  try {
    const user = await User
      .findById(req.user.id)
      .select("-password");

    // Check if user exists:
    if (!user) {
      return res.status(404).json({ msg: "User not found!" });
    }

    let post = await Post.findById(req.params.post_id);

    // Check if post exists:
    if (!post) {
      return res.status(404).json({ msg: "Post not found!" });
    }

    // Building comment body:
    const newComment = {
      text: req.body.text,

      user: req.user.id,
      name: user.name,
      avatar: user.avatar
    }
    post = await Post.findOneAndUpdate(
      { _id: req.params.post_id },
      {
        $push:
        {
          comments: newComment
        }
      },
      { new: true }
    )

    post = await Post.findById(req.params.post_id);

    res.json(post.comments);
    console.log("User added a new comment!");
  } catch (error) {
    console.log(chalk.red(error.message));
    if (error.kind === "ObjectId") {
      return res.status(404).json({ msg: "User not found!" });
    }
  }
})


// @route   PUT api/posts/comment/:id
// @desc    Edit User comment
// @access  Private
router.put("/comment/:post_id/:comment_id", postCheck, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array()[0].msg });
  }

  try {
    const user = await User
      .findById(req.user.id)
      .select("-password");

    // Check user existance and authorization:
    if (!user) {
      return res.status(404).json({ msg: "User not found!" });
    };

    let post = await Post.findById(req.params.post_id);

    // Check if post exists:
    if (!post) {
      return res.status(404).json({ msg: "Post not found!" });
    }

    //Pull out comment:
    const comment = post.comments
      .find(comment =>
        comment.id === req.params.comment_id);

    // Check user authorization:
    if (comment.user.toString() !== req.user.id) {
      return res.status(403).json({ msg: "This action is not authorized!" });
    };

    // Building comment body:
    const newComment = {
      text: req.body.text,

      user: req.user.id,
      name: user.name,
      avatar: user.avatar,
      updated: user.updated
    }
    post = await Post.findOneAndUpdate(
      { _id: req.params.post_id },
      {
        $set:
        {
          comments: newComment
        }
      },
      { new: true }
    )

    post = await Post.findById(req.params.post_id);

    res.json(post.comments);
    console.log("User successfully updated his/her comment!");
  } catch (error) {
    console.log(chalk.red(error.message));
    if (error.kind === "ObjectId") {
      return res.status(404).json({ msg: "User not found!" });
    }
  }
})

// @route   DELETE api/posts/comment/:id
// @desc    Delete a comment
// @access  Private
router.delete("/comment/:post_id/:comment_id", auth, async (req, res) => {
  const user = await User
    .findById(req.user.id)
    .select("-password");

  // Check if user exists:
  if (!user) {
    return res.status(404).json({ msg: "User does not exist!" });
  }

  try {
    let post = await Post.findById(req.params.post_id);

    // Check if post exists:
    if (!post) {
      return res.status(404).json({ msg: "Post not found!" });
    }

    // Check if comment exists:
    const commentIndex = post.comments
      .map(index => index._id)
      .includes(req.params.comment_id);
    console.log("commentIndex: ", commentIndex);
    if (!commentIndex) {
      return res.status(404).json({ msg: "This comment is not found!" });
    }

    // Pull out comment:
    const comment = post.comments
      .find(comment =>
        comment.id === req.params.comment_id);

    // Check user authorization:
    if (comment.user.toString() !== req.user.id) {
      return res.status(403).json({ msg: "This action is not authorized!" });
    };

    // Deleting own user comment:
    post = await Post.findOneAndUpdate(
      { _id: req.params.post_id },
      {
        $pull:
        {
          comments: { _id: req.params.comment_id }
        }
      }
    )

    // Refreshing users post comments: 
    post = await Post.findById(req.params.post_id);

    res.json(
      post.comments.length <= 0
        ?
        `After deleting this comment, this post has no more comments.`
        :
        post.comments
    );
    console.log("User deleted a comment!");

  } catch (error) {
    console.log(chalk.red(error.message));
    if (error.kind === "ObjectId") {
      return res.status(404).json({ msg: "User not found!" });
    }
  }
})
module.exports = router;
