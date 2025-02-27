import React from 'react'

import { useState } from "react";

const Login = () => {
  const [activeTab, setActiveTab] = useState("signup");
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
  });

  const [focusedInput, setFocusedInput] = useState(null);

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setFormData({
      ...formData,
      [id]: value,
    });
  };

  const handleFocus = (id) => {
    setFocusedInput(id);
  };

  const handleBlur = () => {
    setFocusedInput(null);
  };

  const handleTabClick = (tab) => {
    setActiveTab(tab);
  };

  const isLabelActive = (id) => {
    return formData[id] || focusedInput === id ? "active highlight" : "";
  };

  return (

  <div className="w-screen h-screen flex justify-center items-center">
    <div className="form bg-[rgba(22,19,54,0.9)] p-10 max-w-[600px] w-4/5 h-auto my-8 rounded-lg shadow-lg shadow-[#131f2f4d] ">
      <ul className="top-area list-none p-0 m-0 mb-6 flex justify-center items-center">
        <li
          className={`tab inline-block ${activeTab === "signup" ? "active" : ""}`}
        >
          <a
            href="#signup"
            onClick={() => handleTabClick("signup")}
            className="block py-4 px-6 text-[#a0b3b0] text-[20px] bg-[rgba(160,179,176,0.25)] text-center cursor-pointer transition-all duration-500 ease-in-out hover:bg-[#0080ff] hover:text-white mr-0.5"
          >
            Sign Up
          </a>
        </li>
        <li
          className={`tab inline-block ${activeTab === "login" ? "active" : ""}`}
        >
          <a
            href="#login"
            onClick={() => handleTabClick("login")}
            className="block py-4 px-6 text-[#a0b3b0] text-[20px] bg-[rgba(160,179,176,0.25)] text-center cursor-pointer transition-all duration-500 ease-in-out hover:bg-[#0080ff] hover:text-white"
          >
            Log In
          </a>
        </li>
        <li>
          <select className="block py-4 text-[#a0b3b0] text-[20px] bg-[rgba(160,179,176,0.25)] text-center cursor-pointer transition-all duration-500 ease-in-out hover:text-white ml-5">
            <option value="User" className="hover:bg-[#8d8c8c00] hover:text-white">User</option>
            <option value="Community User" className="hover:bg-[#8d8c8c00] hover:text-white">Community User</option>
            <option value="Expert User" className="hover:bg-[#8d8c8c00] hover:text-white">Expert User</option>
          </select>

        </li>
      </ul>

      <div className="tab-content">
        {/* Sign Up Form */}
        {activeTab === "signup" && (
          <div id="signup">
            <h1 className="font-sigmar font-bold text-center text-white mb-6 text-5xl">
              Sign Up 
            </h1>
            <form action="/" method="post">
              <div className="top-row flex mb-10">
                <div className="label-field relative w-1/2 mr-2">
                  <label
                    htmlFor="firstName"
                    className={`absolute left-3 top-1/2 transform -translate-y-1/2 text-white opacity-50 text-xl transition-all duration-300 ease-in-out pointer-events-none ${isLabelActive(
                      "firstName"
                    )}`}
                  >
                  </label>
                  <input
                    type="text"
                    id="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    onFocus={() => handleFocus("firstName")}
                    onBlur={handleBlur}
                    className="w-full py-4 pl-10 text-white bg-transparent border border-[#a0b3b0] rounded-md focus:outline-none focus:border-[#1da1f2] transition-all duration-250 ease-in-out"
                    required
                    autoComplete="off"
                    placeholder='First name'
                  />
                </div>

                <div className="label-field relative w-1/2">
                  <label
                    htmlFor="lastName"
                    className={`absolute left-3 top-1/2 transform -translate-y-1/2 text-white opacity-50 text-xl transition-all duration-300 ease-in-out pointer-events-none ${isLabelActive(
                      "lastName"
                    )}`}
                  >
                  </label>
                  <input
                    type="text"
                    id="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    onFocus={() => handleFocus("lastName")}
                    onBlur={handleBlur}
                    className="w-full py-4 pl-10 text-white bg-transparent border border-[#a0b3b0] rounded-md focus:outline-none focus:border-[#1da1f2] transition-all duration-250 ease-in-out"
                    required
                    autoComplete="off"
                    placeholder='Last name'
                  />
                </div>
              </div>

              <div className="label-field relative mb-10">
                <label
                  htmlFor="email"
                  className={`absolute left-3 top-1/2 transform -translate-y-1/2 text-white opacity-50 text-xl transition-all duration-300 ease-in-out pointer-events-none ${isLabelActive(
                    "email"
                  )}`}
                >
                </label>
                <input
                  type="email"
                  id="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  onFocus={() => handleFocus("email")}
                  onBlur={handleBlur}
                  className="w-full py-4 pl-10 text-white bg-transparent border border-[#a0b3b0] rounded-md focus:outline-none focus:border-[#1da1f2] transition-all duration-250 ease-in-out"
                  required
                  autoComplete="off"
                  placeholder='Email address'
                />
              </div>

              <div className="label-field relative mb-10">
                <label
                  htmlFor="password"
                  className={`absolute left-3 top-1/2 transform -translate-y-1/2 text-white opacity-50 text-xl transition-all duration-300 ease-in-out pointer-events-none ${isLabelActive(
                    "password"
                  )}`}
                >
                  
                </label>
                <input
                  type="password"
                  id="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  onFocus={() => handleFocus("password")}
                  onBlur={handleBlur}
                  className="w-full py-4 pl-10 text-white bg-transparent border border-[#a0b3b0] rounded-md focus:outline-none focus:border-[#1da1f2] transition-all duration-250 ease-in-out"
                  required
                  autoComplete="off"
                  placeholder='Set password'
                />
              </div>

              <div className="label-field relative mb-10">
                <label
                  htmlFor="password"
                  className={`absolute left-3 top-1/2 transform -translate-y-1/2 text-white opacity-50 text-xl transition-all duration-300 ease-in-out pointer-events-none ${isLabelActive(
                    "password"
                  )}`}
                >
                  
                </label>
                <input
                  type="password"
                  id="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  onFocus={() => handleFocus("password")}
                  onBlur={handleBlur}
                  className="w-full py-4 pl-10 text-white bg-transparent border border-[#a0b3b0] rounded-md focus:outline-none focus:border-[#1da1f2] transition-all duration-250 ease-in-out"
                  required
                  autoComplete="off"
                  placeholder='Confirm password'
                />
              </div>

              <button
                type="submit"
                className="button w-full py-4 text-white text-xl font-semibold uppercase tracking-wider bg-[#1da1f2] hover:bg-[#0080ff] transition-all duration-500 ease-in-out"
              >
                SIGN UP
              </button>
            </form>
          </div>
        )}

        {/* Log In Form */}
        {activeTab === "login" && (
          <div id="login">
            <h1 className="font-kanit text-center text-white font-bold mb-6 text-5xl">
              Welcome Back!
            </h1>
            <form action="/" method="post">
              <div className="label-field relative mb-10">
                <label
                  htmlFor="emailLogin"
                  className={`absolute left-3 top-1/2 transform -translate-y-1/2 text-white opacity-50 text-xl transition-all duration-300 ease-in-out pointer-events-none ${isLabelActive(
                    "emailLogin"
                  )}`}
                >
                </label>
                <input
                  type="email"
                  id="emailLogin"
                  value={formData.email}
                  onChange={handleInputChange}
                  onFocus={() => handleFocus("emailLogin")}
                  onBlur={handleBlur}
                  className="w-full py-4 pl-10 text-white bg-transparent border border-[#a0b3b0] rounded-md focus:outline-none focus:border-[#1da1f2] transition-all duration-250 ease-in-out"
                  required
                  autoComplete="off"
                  placeholder='Email address'
                />
              </div>

              <div className="label-field relative mb-10">
                <label
                  htmlFor="passwordLogin"
                  className={`absolute left-3 top-1/2 transform -translate-y-1/2 text-white opacity-50 text-xl transition-all duration-300 ease-in-out pointer-events-none ${isLabelActive(
                    "passwordLogin"
                  )}`}
                >
                </label>
                <input
                  type="password"
                  id="passwordLogin"
                  value={formData.password}
                  onChange={handleInputChange}
                  onFocus={() => handleFocus("passwordLogin")}
                  onBlur={handleBlur}
                  className="w-full py-4 pl-10 text-white bg-transparent border border-[#a0b3b0] rounded-md focus:outline-none focus:border-[#1da1f2] transition-all duration-250 ease-in-out"
                  required
                  autoComplete="off"
                  placeholder='Password'
                />
              </div>

              <p className="forgot text-right text-[#1da1f2] hover:text-[#0080ff] my-4">
                <a href="#">Forgot Password?</a>
              </p>

              <button
                type="submit"
                className="button w-full py-4 text-white text-xl font-semibold uppercase tracking-wider bg-[#1da1f2] hover:bg-[#0080ff] transition-all duration-500 ease-in-out"
              >
                LOG IN
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  </div>
  );
};

export default Login;
