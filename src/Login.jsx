import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import { FaEye, FaEyeSlash } from "react-icons/fa"; 
import "../component/Login.css";

const API_URL = "http://localhost:5000/login"; 
export default function Login() {
  const [isSignUp, setIsSignUp] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      navigate("/");
    }
  }, [navigate]);

  const toggleForm = () => {
    setIsSignUp(!isSignUp);
  };

  return (
    <div id="container" className={`container ${isSignUp ? "sign-up" : "sign-in"}`}>
      {/* FORM SECTION */}
      <div className="row">
        <div className={`col align-items-center flex-col sign-up ${isSignUp ? "active" : "hidden"}`}>
          <SignUpForm toggleForm={toggleForm} />
        </div>

        <div className={`col align-items-center flex-col sign-in ${!isSignUp ? "active" : "hidden"}`}>
          <SignInForm toggleForm={toggleForm} />
        </div>
      </div>

      {/* CONTENT SECTION */}
      <div className="row content-row">
        <div className="col align-items-center flex-col">
          <div className="text sign-in"><h2>Welcome!</h2></div>
        </div>
        <div className="col align-items-center flex-col">
          <div className="text sign-up"><h2>Create your account.</h2></div>
        </div>
      </div>
    </div>
  );
}

//SIGN UP FORM
function SignUpForm({ toggleForm }) {
  const [userData, setUserData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: ""
  });

  const handleChange = (e) => {
    setUserData({ ...userData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (userData.password !== userData.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    try {
      await axios.post("http://localhost:5000/register", userData);
      toast.success("Sign up successful! Please log in.");
      toggleForm();
    } catch (error) {
      toast.error(error.response?.data?.message || "Sign up failed");
    }
  };

  return (
    <div className="form-wrapper align-items-center">
      <div className="form sign-up">
        <form onSubmit={handleSubmit}>
          <InputField
            type="text"
            placeholder="Username"
            name="username"
            value={userData.username}
            onChange={handleChange}
          />
          <InputField
            type="email"
            placeholder="Email"
            name="email"
            value={userData.email}
            onChange={handleChange}
          />
          <PasswordField
            placeholder="Password"
            name="password"
            value={userData.password}
            onChange={handleChange}
          />
          <PasswordField
            placeholder="Confirm Password"
            name="confirmPassword"
            value={userData.confirmPassword}
            onChange={handleChange}
          />
          <button type="submit">Sign up</button>
        </form>
        <p>
          <span>Already have an account? </span>
          <b onClick={toggleForm} className="pointer">Sign in here</b>
        </p>
      </div>
    </div>
  );
}

//SIGN IN FORM
function SignInForm({ toggleForm }) {
  const [credentials, setCredentials] = useState({ username: "", password: "" });
  const navigate = useNavigate();

  const handleChange = (e) => {
    setCredentials({ ...credentials, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("Attempting login with:", credentials);
  
    try {
      const response = await axios.post(API_URL, credentials, { withCredentials: true });
  
      console.log("Login response:", response.data);
  
      if (!response.data.token) {
        throw new Error("No token received");
      }
  
      localStorage.setItem("token", response.data.token);
      if (response.data.token === "admin") {
        toast.success("You are logged in successfully!");
      }
  
      navigate("/");
      window.location.reload();
    } catch (error) {
      console.error("Login Error:", error.response?.data || error.message);
      toast.error(error.response?.data?.message || "Invalid credentials");
    }
  };
  
  return (
    <div className="form-wrapper align-items-center">
      <div className="form sign-in">
        <form onSubmit={handleSubmit}>
          <InputField
            type="text"
            placeholder="Username"
            name="username"
            value={credentials.username}
            onChange={handleChange}
          />
          <PasswordField
            placeholder="Password"
            name="password"
            value={credentials.password}
            onChange={handleChange} 
          />
          <button type="submit" className="signin-btn">Sign in</button>
        </form>
        <p>
          <span>Don't have an account? </span>
          <b onClick={toggleForm} className="pointer">Sign up here</b>
        </p>
      </div>
    </div>
  );
}

//INPUT FIELD COMPONENT
function InputField({ type, placeholder, name, value, onChange }) {
  return (
    <div className="input-group">
      <input type={type} placeholder={placeholder} name={name} value={value} onChange={onChange} />
    </div>
  );
}

//PASSWORD FIELD COMPONENT
function PasswordField({ placeholder, name, value, onChange }) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="input-group password-group">
      <input
        type={showPassword ? "text" : "password"}
        placeholder={placeholder}
        name={name}
        value={value}
        onChange={onChange}
      />
      <span className="eye-icon" onClick={() => setShowPassword(!showPassword)}>
        {showPassword ? <FaEyeSlash /> : <FaEye />}
      </span>
    </div>
  );
}
