const { check } = require("express-validator");

const signUpCheck = [
  // name:
  check("name", "Name must not be empty.").not().isEmpty().bail(),
  check("name", "Name must be between 3 and 150 characters.").isLength({
    min: 3,
    max: 150,
  }),
  check("name", "Name cannot contain specail characters or numbers")
    .matches(/^[A-Za-z\s]+$/)
    .withMessage("Name cannot contain special characters or numbers")
    .bail(),
  //email:
  check("email", "Please enter a valid email address").isEmail(),
  check("email", "Email address already exists.").exists(),

  // password:
  check("password", "Password must not be empty.").not().isEmpty(),
  check("password", "Password must be between 6 and 15 characters.").isLength({
    min: 6,
    max: 15,
  }),
  check("password", "Password must contain numbers and special characters.")
    .matches(/\d/)
    .matches(/[!@#$%&*()-/:-?{-~!"^_`\[\]]/)
    .bail(),
];

const signInCheck = [
  // email
  check("email", "Email address must not be empty.").not().isEmpty(),
  check("email", "Please enter a valid email address.").isEmail(),

  // password:
  check("password", "Password must not be empty!").not().isEmpty(),
  check("password", "Password is required!").exists(),
];

module.exports = {
  signUpCheck,
  signInCheck,
};
