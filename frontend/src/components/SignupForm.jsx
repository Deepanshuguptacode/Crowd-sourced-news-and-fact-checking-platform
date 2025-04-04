import { useState } from "react";
import { useNavigate } from "react-router-dom"; // Import useNavigate
import axios from "axios"; 

const SignupForm = () => {
  const [formData, setFormData] = useState({
    name: "",
    username: "",
    email: "",
    password: "",
    userType:"normal",
    confirmPassword:""
  });
  const navigate = useNavigate(); // Initialize useNavigate

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setFormData({
      ...formData,
      [id]: value,
    });
  };

  /*const handleUserTypeChange = (e) => {
    setFormData({
      ...formData,
      userType: e.target.value,
    });
  };*/

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Determine the correct endpoint based on user type
    let endpoint = `/api/users/normal/signup`;
    if (formData.userType === "community") {
      endpoint = `/api/users/community/signup`;
    } else if (formData.userType === "expert") {
      endpoint = `/api/users/expert/signup`;
    }

    try {
      const response = await axios.post(endpoint, formData);
      console.log("Signup successful:", response.data);
      console.log("yo");
      navigate("/home"); // Navigate to the home page after successful signup
    } catch (error) {
      console.error("Signup error:", error);
    }
  };

  return (
    <div className="min-h-1 flex items-center justify-center bg-gray-800">
      <div className="bg-gray-900 p-8 rounded-lg shadow-lg max-w-md w-full">
        <h1 className="font-bold text-center text-white mb-6 text-5xl">Sign Up</h1>
        <form onSubmit={handleSubmit}>
          <select
            id="userType"
            value={formData.userType}
            onChange={handleInputChange}
            className="w-full p-3 mb-4 border rounded"
            required
          >
            <option value="normal">Normal User</option>
            <option value="community">Community User</option>
            <option value="expert">Expert User</option>
          </select>
          <div className="flex mb-4">
            <input
              type="text"
              id="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="Full name"
              className="w-1/2 p-3 mr-2 border rounded"
              required
            />
          </div>
          <input
              type="text"
              id="username"
              value={formData.username}
              onChange={handleInputChange}
              placeholder="user name"
              className="w-1/2 p-3 border rounded"
              required
            />
          <input
            type="email"
            id="email"
            value={formData.email}
            onChange={handleInputChange}
            placeholder="Email address"
            className="w-full p-3 mb-4 border rounded"
            required
          />
          <input
            type="password"
            id="password"
            value={formData.password}
            onChange={handleInputChange}
            placeholder="Set password"
            className="w-full p-3 mb-4 border rounded"
            required
          />
          <input
            type="password"
            id="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleInputChange}
            placeholder="Confirm password"
            className="w-full p-3 mb-4 border rounded"
            required
          />
          <button className="w-full p-3 bg-blue-500 text-white rounded">Sign Up</button>
        </form>
      </div>
    </div>
  );
};

export default SignupForm;
