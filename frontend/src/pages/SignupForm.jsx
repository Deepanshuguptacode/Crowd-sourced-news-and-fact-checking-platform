import { useState, useContext } from "react";
import { useNavigate, Link } from "react-router-dom";
import { UserContext } from "../context/userContext";
import { authAPI } from "../services/api";
import { toast } from "react-toastify";
import { Eye, EyeOff, Mail, Lock, User, UserPlus, LogIn, ArrowLeft, Briefcase } from 'lucide-react';

const SignupForm = () => {
  const [formData, setFormData] = useState({
    name: "",
    username: "",
    email: "",
    password: "",
    userType: "normal",
    confirmPassword: "",
    profession: ""
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useContext(UserContext);
  const navigate = useNavigate();

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setFormData({
      ...formData,
      [id]: value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords don't match!");
      return;
    }

    setLoading(true);

    try {
      const signupData = {
        name: formData.name,
        username: formData.username,
        email: formData.email,
        password: formData.password,
        ...(formData.userType === 'expert' && { profession: formData.profession })
      };

      const response = await authAPI.signup(formData.userType, signupData);
      
      if (response.token) {
        // Auto-login after successful signup
        login({
          ...response.user,
          userType: formData.userType
        }, response.token);

        toast.success("Signup successful!");
        navigate("/home");
      } else {
        toast.success("Signup successful! Please wait for admin approval.");
        navigate("/login");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Signup failed!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="min-h-screen bg-gray-50 dark:bg-slate-900 stage-1-background relative overflow-x-hidden transition-colors duration-300"
    >
      {/* Stage 2: Animated Logo */}
      <div className="fixed top-8 left-8 z-50 stage-2-logo">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
            <span className="text-white font-bold text-lg">N</span>
          </div>
          <span className="text-gray-900 dark:text-white font-semibold text-xl">NewsCheck</span>
        </div>
      </div>

      {/* Stage 3: Main Signup Form */}
      <div className="min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 py-4 stage-3-form">
        <div className="w-full max-w-5xl mx-auto">
          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-lg rounded-2xl shadow-2xl border border-gray-200/50 dark:border-slate-700/50 overflow-hidden">
            <div className="grid lg:grid-cols-2 min-h-[580px]">
            
            {/* Left Panel - Welcome Content */}
            <div className="bg-gradient-to-br from-indigo-600 via-purple-700 to-blue-800 p-6 lg:p-8 flex flex-col justify-center text-white relative overflow-hidden">
              <div className="absolute inset-0 bg-black/10"></div>
              <div className="relative z-10">
                <h1 className="text-2xl lg:text-3xl font-bold mb-3 lg:mb-4 leading-tight">
                  Join the Future of
                  <span className="block text-indigo-200">News Verification</span>
                </h1>
                <p className="text-indigo-100 text-sm lg:text-base mb-4 lg:mb-6 leading-relaxed">
                  Be part of a global community dedicated to fighting misinformation 
                  and promoting truth in journalism.
                </p>
                <div className="space-y-2">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-indigo-300 rounded-full animate-pulse"></div>
                    <span className="text-indigo-100 text-sm lg:text-base">Submit and verify news articles</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-indigo-300 rounded-full animate-pulse"></div>
                    <span className="text-indigo-100 text-sm lg:text-base">Collaborate with fact-checking experts</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-indigo-300 rounded-full animate-pulse"></div>
                    <span className="text-indigo-100 text-sm lg:text-base">Build a trusted news ecosystem</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Panel - Signup Form */}
            <div className="p-4 lg:p-6 flex flex-col justify-center">
              <div className="max-w-md mx-auto w-full">
                <div className="mb-4">
                  <h2 className="text-xl lg:text-2xl font-bold text-gray-900 dark:text-white mb-1">Create Account</h2>
                  <p className="text-gray-600 dark:text-slate-400 text-sm">Join the NewsCheck community</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-3">
                  {/* User Type Selection */}
                  <div>
                    <label className="block text-gray-700 dark:text-slate-300 text-sm font-medium mb-1">
                      Account Type
                    </label>
                    <select
                      id="userType"
                      value={formData.userType}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2.5 bg-gray-100 dark:bg-slate-700/50 border border-gray-300 dark:border-slate-600 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all duration-200"
                      required
                    >
                      <option value="normal">Normal User</option>
                      <option value="community">Community User</option>
                      <option value="expert">Expert User</option>
                    </select>
                  </div>

                  {/* Name and Username Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="block text-gray-700 dark:text-slate-300 text-sm font-medium mb-1">
                        Full Name
                      </label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-slate-400 w-4 h-4" />
                        <input
                          type="text"
                          id="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          className="w-full pl-9 pr-3 py-2.5 bg-gray-100 dark:bg-slate-700/50 border border-gray-300 dark:border-slate-600 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all duration-200"
                          placeholder="Full name"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-gray-700 dark:text-slate-300 text-sm font-medium mb-1">
                        Username
                      </label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-slate-400 w-4 h-4" />
                        <input
                          type="text"
                          id="username"
                          value={formData.username}
                          onChange={handleInputChange}
                          className="w-full pl-9 pr-3 py-2.5 bg-gray-100 dark:bg-slate-700/50 border border-gray-300 dark:border-slate-600 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all duration-200"
                          placeholder="Username"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  {/* Email Field */}
                  <div>
                    <label className="block text-gray-700 dark:text-slate-300 text-sm font-medium mb-1">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-slate-400 w-4 h-4" />
                      <input
                        type="email"
                        id="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className="w-full pl-9 pr-3 py-2.5 bg-gray-100 dark:bg-slate-700/50 border border-gray-300 dark:border-slate-600 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all duration-200"
                        placeholder="Enter your email"
                        required
                      />
                    </div>
                  </div>

                  {/* Password Fields Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="block text-gray-700 dark:text-slate-300 text-sm font-medium mb-1">
                        Password
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-slate-400 w-4 h-4" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          id="password"
                          value={formData.password}
                          onChange={handleInputChange}
                          className="w-full pl-9 pr-9 py-2.5 bg-gray-100 dark:bg-slate-700/50 border border-gray-300 dark:border-slate-600 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all duration-200"
                          placeholder="Password"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-slate-400 hover:text-gray-600 dark:hover:text-white transition-colors"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-gray-700 dark:text-slate-300 text-sm font-medium mb-1">
                        Confirm Password
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-slate-400 w-4 h-4" />
                        <input
                          type={showConfirmPassword ? 'text' : 'password'}
                          id="confirmPassword"
                          value={formData.confirmPassword}
                          onChange={handleInputChange}
                          className="w-full pl-9 pr-9 py-2.5 bg-gray-100 dark:bg-slate-700/50 border border-gray-300 dark:border-slate-600 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all duration-200"
                          placeholder="Confirm"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-slate-400 hover:text-gray-600 dark:hover:text-white transition-colors"
                        >
                          {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Profession Field (for experts) */}
                  {formData.userType === "expert" && (
                    <div className="transition-all duration-300 ease-in-out">
                      <label className="block text-gray-700 dark:text-slate-300 text-sm font-medium mb-1">
                        Profession
                      </label>
                      <div className="relative">
                        <Briefcase className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-slate-400 w-4 h-4" />
                        <input
                          type="text"
                          id="profession"
                          value={formData.profession}
                          onChange={handleInputChange}
                          className="w-full pl-10 pr-3 py-2.5 bg-gray-100 dark:bg-slate-700/50 border border-gray-300 dark:border-slate-600 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all duration-200"
                          placeholder="Enter your profession"
                          required
                        />
                      </div>
                    </div>
                  )}

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold py-2.5 rounded-xl transition-all duration-200 transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-indigo-500/50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                  >
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    ) : (
                      <>
                        <UserPlus className="w-5 h-5" />
                        <span>Create Account</span>
                      </>
                    )}
                  </button>
                </form>

                {/* Stage 4: Navigation Links */}
                <div className="mt-4 stage-4-details">
                  <div className="text-center">
                    <p className="text-gray-600 dark:text-slate-400 mb-3 text-sm">
                      Already have an account?{' '}
                      <Link 
                        to="/login" 
                        className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium transition-colors inline-flex items-center space-x-1"
                      >
                        <LogIn className="w-4 h-4" />
                        <span>Sign In</span>
                      </Link>
                    </p>
                    
                    <Link 
                      to="/" 
                      className="text-gray-500 dark:text-slate-500 hover:text-gray-700 dark:hover:text-slate-300 text-xs transition-colors inline-flex items-center space-x-1"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      <span>Back to Home</span>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignupForm;
