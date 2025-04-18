import { useState } from "react";
import { useNavigate } from "react-router-dom"; // Import useNavigate
import axios from "axios"; // Import axios
import { useContext } from "react";
import { UserContext } from "../context/userContext";
import { toast } from "react-toastify";

const LoginForm = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });
  const { setUserType } = useContext(UserContext);

  const navigate = useNavigate(); // Initialize useNavigate

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setFormData({
      ...formData,
      [id]: value,
    });
  };

  const handleUserTypeChange = (e) => {
    setFormData({
      ...formData,
      userType: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Determine the correct endpoint based on user type
    let endpoint = `/api/users/normal/login`; // Default endpoint for normal users
    if (formData.userType === "community") {
      endpoint = `/api/users/community/login`; // Endpoint for community users
    } else if (formData.userType === "expert") {
      endpoint = `/api/users/expert/login`; // Endpoint for expert users
    }
    
    try {
      const response = await axios.post(endpoint, formData);
      if (response.status === 200) {
        
        setUserType(formData.userType); // Example: Set userType to "expert"
        toast.success("Login successful!");

      // console.log("Login successful:", response.data);
      navigate("/home"); // Navigate to the home page after successful login
      }
    } catch (error) {
      // console.error("Login error:", error);
      toast.error(error.response?.data?.message || "Login failed!");

    }
  };

  return (
    <div className="min-h-1 flex items-center justify-center bg-gray-800">
      <div className="bg-gray-900 p-8 rounded-lg shadow-lg max-w-md w-full">
        <h1 className="font-bold text-center text-white mb-6 text-5xl">Welcome Back!</h1>
        <form onSubmit={handleSubmit}>
          <select
            id="userType"
            value={formData.userType}
            onChange={handleUserTypeChange}
            className="w-full p-3 mb-4 border rounded"
            required
          >
            <option value="normal">Normal User</option>
            <option value="community">Community User</option>
            <option value="expert">Expert User</option>
          </select>
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
            placeholder="Password"
            className="w-full p-3 mb-4 border rounded"
            required
          />
          <p className="text-right text-blue-500 mb-4 cursor-pointer">Forgot Password?</p>
          <button className="w-full p-3 bg-blue-500 text-white rounded">Log In</button>
        </form>
      </div>
    </div>
  );
};

export default LoginForm;
