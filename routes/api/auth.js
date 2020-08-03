const express = require("express");
const router = express.Router();
const auth = require("../../middleware/auth");
const User = require("../../models/User");
const { validationResult } = require("express-validator");
const config = require("config");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { signInCheck } = require("../../validator/index");
const chalk = require("chalk");

// @route      GET api/auth
// @desc       Get authenticated user
// access      Public

router.get("/", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    res.json(user);
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ msg: "Server Error!" });
  }
});

// @route   POST api/auth
// @desc    Sign-in authenticated users
// @access  Private
router.post("/signin", signInCheck, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array()[0].msg });
  }
  const { email, password } = req.body;

  try {
    // check if user exists:
    let user = await User.findOne({ email: email });
    if (!user) {
      return res
        .status(401)
        .json({ errors: [{ msg: "Error! User does not exist." }][0].msg });
    }
    // check password:
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res
        .status(400)
        .json({ errors: [{ msg: "Invalid username or password!" }] });
    }

    const payload = {
      user: {
        id: user._id,
      },
    };
    jwt.sign(
      payload,
      config.get("JWT_SECRET"),
      {
        expiresIn: 900,
      },
      (error, token) => {
        if (error) throw error;
        return res.json({
          token,
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
          },
        });
      }
    );
  } catch (error) {
    console.log(chalk.red(error.message));
    return res.status(500).json({ msg: "Server error!" });
  }
});

module.exports = router;
