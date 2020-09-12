import React, { Fragment, useState } from "react";
import { Link } from "react-router-dom";

const Login = () => {

 const [formData, setFormData] = useState({
  email: "",
  password: ""
 });

 const { email, password } = formData;

 const onChangeHandler = (event) => {
  const { name, value } = event.target;
  setFormData({
   ...formData,
   [name]: value
  })
 };

 const onSubmitHandler = async (event) => {
  event.preventDefault()
  console.log("Success!");
 };

 return (
  <Fragment>
   <h1 className="large text-primary">Sign Ip</h1>
   <p className="lead"><i className="fas fa-user"></i> Sign into your Account</p>
   <form className="form"
    onSubmit={onSubmitHandler}
   >

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

    <input type="submit" className="btn btn-primary" value="Login" />
   </form>
   <p className="my-1">
    Don't have an account? <Link to="/register">Sign up</Link>
   </p>
  </Fragment>
 )
}

export default Login;
