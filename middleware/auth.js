const jwt = require("jsonwebtoken");
const config = require("config");
const User = require("../models/User");

module.exports = function (req, res, next) {
  // get token from header
  const token = req.header("Authorization"); // header key

  // check if token does not exist:
  if (!token) {
    return res
      .status(401)
      .json({ msg: "Error! Token not found. Authorization denied!" });
  }
  try {
    // if there's a token, first verify:
    const decoded = jwt.verify(token, config.get("JWT_SECRET"));

    // set the user inside the payload
    req.user = decoded.user;

    // disable tokens of deleted users:
    const activeUser = User.findById(req.user);

    if (!activeUser) {
      return res.status(401).json({ msg: "Error! User no longer exists" });
    }

    next();
  } catch (error) {
    return res.status(401).json({ msg: "Error! Token is not valid!" });
  }
};
