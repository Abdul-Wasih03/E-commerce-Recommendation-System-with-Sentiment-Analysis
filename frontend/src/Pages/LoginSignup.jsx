import React, { useState } from 'react';
import './CSS/LoginSignup.css';

const LoginSignup = () => {
  const [state, setState] = useState("Login");
  const [isChecked, setIsChecked] = useState(false); // Track checkbox status
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    email: "",
    cpassword: ""
  });

  const changeHandler = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const login = async () => {
    console.log("Login Function Executed", formData);
    let responseData;

    await fetch('http://localhost:4000/login', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(formData),
    })
    .then((response) => response.json())
    .then((data) => responseData = data);

    console.log("Response from Backend:", responseData);

    if (responseData.success) {
      localStorage.setItem('auth-token', responseData.token);
      localStorage.setItem('user-details', JSON.stringify(responseData.user));
      alert(`Welcome back, ${responseData.user.username}`);
      window.location.replace("/");
    } else {
      alert(responseData.errors || "Login failed. Please try again.");
    }
  };

  const signup = async () => {
    console.log("Sign Up Function Executed", formData);
    let responseData;

    await fetch('http://localhost:4000/signup', {
      method: 'POST',
      headers: {
        Accept: 'application/form-data',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(formData),
    })
    .then((response) => response.json())
    .then((data) => responseData = data);

    if (responseData.success) {
      localStorage.setItem('auth-token', responseData.token);
      window.location.replace("/");
    } else {
      alert(responseData.errors);
    }
  };

  return (
    <div className='loginsignup'>
      <div className="loginsignup-container">
        <h1 align="center">{state}</h1>
        <div className="loginsignup-fields">
          {state === "Sign Up" ? (
            <>
              <input name="username" value={formData.username} onChange={changeHandler} type="text" placeholder="Your Name" />
              <input name="email" value={formData.email} onChange={changeHandler} type="email" placeholder="Email Address" />
              <input type="password" name="password" value={formData.password} onChange={changeHandler} placeholder="Password" />
              <input type="password" name="cpassword" value={formData.cpassword} onChange={changeHandler} placeholder="Confirm Password" />
            </>
          ) : (
            <>
              <input name="email" value={formData.email} onChange={changeHandler} type="email" placeholder="Email Address" />
              <input type="password" name="password" value={formData.password} onChange={changeHandler} placeholder="Password" />
            </>
          )}
        </div>

        <button
          onClick={() => {
            if (state === "Sign Up" && !isChecked) {
              alert("Please agree to the Terms of Use & Privacy Policy to continue.");
            } else {
              state === "Login" ? login() : signup();
            }
          }}
        >
          Continue
        </button>

        {state === "Sign Up" ? (
          <>
            <p className="loginsignup-login">Already have an account? <span onClick={() => setState("Login")}>Login here</span></p>
            <div className="loginsignup-agree">
              <input
                type="checkbox"
                checked={isChecked}
                onChange={() => setIsChecked(!isChecked)}
              />
              <p>By Continuing, I agree to the Terms of Use & Privacy Policy.</p>
            </div>
          </>
        ) : (
          <p className="loginsignup-login">Create an account? <span onClick={() => setState("Sign Up")}>Click here</span></p>
        )}
      </div>
    </div>
  );
}

export default LoginSignup;
