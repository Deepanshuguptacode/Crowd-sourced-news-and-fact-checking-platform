import React, { useState } from "react";
import SignupForm from "./SignupForm"; // Importing the SignupForm component
import LoginForm from "./LoginForm";   // Importing the LoginForm component

const Login = () => {
  const [activeTab, setActiveTab] = useState("signup");

  return (
    <div className="min-h-screen flex justify-center items-center bg-gray-800">
      <div className=" max-w-md w-full rounded-lg shadow-lg">
        <div className="flex justify-center items-center mt-0 mb-0">
          <button
            className={`p-3 w-1/2 m-1 mb-2  ${activeTab === "signup" ? "bg-blue-500 text-white" : "bg-gray-700 text-gray-400"}`}
            onClick={() => setActiveTab("signup")}
          >
            Sign Up
          </button>
          <button
            className={`p-3 w-1/2 m-1 mb-2 ${activeTab === "login" ? "bg-blue-500 text-white" : "bg-gray-700 text-gray-400 "}`}
            onClick={() => setActiveTab("login")}
          >
            Log In
          </button>
        </div>
        <div className="">
          {activeTab === "signup" ? <SignupForm /> : <LoginForm />}
        </div>
      </div>
    </div>
  );
};

export default Login;
