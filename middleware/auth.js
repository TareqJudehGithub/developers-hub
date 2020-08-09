const jwt = require("jsonwebtoken");
const config = require("config");

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

    next();
  } catch (error) {
    res.status(401).json({ msg: "Error! Token is not valid!" });
  }
};
