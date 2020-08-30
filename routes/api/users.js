const express = require("express");
const router = express.Router();
const { validationResult } = require("express-validator");
const normalizeUrl = require("normalize-url");
const gravatar = require("gravatar");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const config = require("config");
const chalk = require("chalk");

const User = require("../../models/User");
const { signUpCheck } = require("../../validator/index");

// @route      POST api/users
// @desc       Register User
// access      Public
router.post("/signup", signUpCheck, async (req, res) => {
  // express-validator:
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array()[0].msg });
  }

  const { name, email, password } = req.body;
  try {
    // user exists check:
    let user = await User.findOne({ email: email });
    if (user) {
      return res
        .status(400)
        .json({ errors: [{ msg: "Error! Users already exists." }][0].msg });
      //OR:
      // res.status(400).json({ msg: "Error! Users already exists." });
    }

    // get users Gravatar:
    const avatar = normalizeUrl(
      gravatar.url(email, {
        s: "200", // size
        r: "pg", // rating
        d: "mm", // default
      }),
      { forceHttps: true }
    );
    user = new User({
      name: name,
      email: email,
      password: password,
      avatar: avatar,
    });

    // hash password:
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);

    // return jwt
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
        res.json({
          token,
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
          },
        });
      }
    );

    await user.save();
    console.log(
      `${chalk.blue(user.name)} ${chalk.green(`signed in successfully!`)}`
    );
  } catch (error) {
    console.log(chalk.red(error.message));
    res.status(500).json({ msg: "Server Error! Sign-in failed." }.msg);
  }
});

module.exports = router;
