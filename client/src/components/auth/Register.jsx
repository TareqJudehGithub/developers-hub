import React, { Fragment, useState } from "react";
import { Link } from "react-router-dom";
import { connect } from "react-redux"
import { setAlert } from "../../redux/alert/alertActions";
import PropTypes from "prop-types"

const Register = ({ setAlert }) => {

 const [formData, setFormData] = useState({
  name: "",
  email: "",
  password: "",
  password2: ""
 });

 const { name, email, password, password2 } = formData;

 const onChangeHandler = (event) => {
  const { name, value } = event.target;
  setFormData({
   ...formData,
   [name]: value
  })
 }
 const onSubmitHandler = async (event) => {
  event.preventDefault()

  if (password !== password2) {
   // "danger" is the alertType
   return setAlert("Password and Confirm password must match.", "danger");
  }
  else {
   console.log("success!")
  }
 }


 return (
  <Fragment>
   <h1 className="large text-primary">Sign Up</h1>
   <p className="lead"><i className="fas fa-user"></i> Create Your Account</p>
   <form className="form"
    onSubmit={onSubmitHandler}
   >

    <div className="form-group">
     <input type="text" placeholder="Enter name" name="name" value={name}
      required onChange={onChangeHandler}
     />
    </div>
    <div className="form-group">
     <input
      type="email"
      placeholder="Email Address"
      name="email"
      value={email}
      required
      onChange={onChangeHandler}
     />
     <small className="form-text"
     >This site uses Gravatar so if you want a profile image, use a
      Gravatar email
     </small>
    </div>
    <div className="form-group">
     <input
      type="password"
      placeholder="Password"
      name="password"
      minLength="6"
      value={password}
      required
      onChange={onChangeHandler}
     />
    </div>
    <div className="form-group">
     <input
      type="password"
      placeholder="Confirm Password"
      name="password2"
      minLength="6"
      value={password2}
      required onChange={onChangeHandler}
     />
    </div>
    <input type="submit" className="btn btn-primary" value="Register" />
   </form>
   <p className="my-1">
    Already have an account? <Link to="/login">Sign In</Link>
   </p>
  </Fragment>
 )
}
Register.propTypes = {
 setAlert: PropTypes.func.isRequired
};

// mapDispatchToProp = (dispatch) => ({
//  alert: 
// })

export default connect(null, { setAlert })(Register);
