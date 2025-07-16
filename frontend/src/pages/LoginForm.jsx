import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useContext } from "react";
import { UserContext } from "../context/userContext";
import { authAPI } from "../services/api";
import { toast } from "react-toastify";
import { Eye, EyeOff, Mail, Lock, LogIn, UserPlus, ArrowLeft } from 'lucide-react';

const LoginForm = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    userType: "normal"
  });
  const [showPassword, setShowPassword] = useState(false);
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

  const handleUserTypeChange = (e) => {
    setFormData({
      ...formData,
      userType: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await authAPI.login(formData.userType, {
        email: formData.email,
        password: formData.password
      });

      if (response.token) {
        // Use the login function from context
        login({
          ...response.user,
          userType: formData.userType
        }, response.token);

        toast.success("Login successful!");
        navigate("/home");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Login failed!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="min-h-screen stage-1-background relative overflow-x-hidden"
      style={{
        background: '#0f172a',
        fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      }}
    >
      {/* Stage 2: Animated Logo */}
      <div className="fixed top-8 left-8 z-50 stage-2-logo">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
            <span className="text-white font-bold text-lg">N</span>
          </div>
          <span className="text-white font-semibold text-xl">NewsCheck</span>
        </div>
      </div>

      {/* Stage 3: Main Login Form */}
      <div className="min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 py-4 stage-3-form">
        <div className="w-full max-w-5xl mx-auto">
          <div className="bg-slate-800/80 backdrop-blur-lg rounded-2xl shadow-2xl border border-slate-700/50 overflow-hidden">
            <div className="grid lg:grid-cols-2 min-h-[480px]">              {/* Left Panel - Welcome Content */}
              <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 p-6 lg:p-8 flex flex-col justify-center text-white relative overflow-hidden">
                <div className="absolute inset-0 bg-black/10"></div>
                <div className="relative z-10">
                  <h1 className="text-2xl lg:text-3xl font-bold mb-3 lg:mb-4 leading-tight">
                    Welcome Back to
                    <span className="block text-blue-200">NewsCheck</span>
                  </h1>
                  <p className="text-blue-100 text-sm lg:text-base mb-4 lg:mb-6 leading-relaxed">
                    Continue your journey in crowd-sourced news verification. 
                    Help build a more informed digital community.
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-blue-300 rounded-full animate-pulse"></div>
                      <span className="text-blue-100 text-sm lg:text-base">Verify news authenticity</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-blue-300 rounded-full animate-pulse"></div>
                      <span className="text-blue-100 text-sm lg:text-base">Contribute to fact-checking</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-blue-300 rounded-full animate-pulse"></div>
                      <span className="text-blue-100 text-sm lg:text-base">Join expert discussions</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Panel - Login Form */}
              <div className="p-4 lg:p-6 flex flex-col justify-center">
                <div className="max-w-sm mx-auto w-full">
                  <h2 className="text-xl lg:text-2xl font-bold text-white mb-1">Sign In</h2>
                  <p className="text-slate-400 mb-4 text-sm">Access your NewsCheck account</p>

                  <form onSubmit={handleSubmit} className="space-y-3">
                  {/* User Type Selection */}
                  <div>
                    <label className="block text-slate-300 text-sm font-medium mb-1">
                      Account Type
                    </label>
                    <select
                      id="userType"
                      value={formData.userType}
                      onChange={handleUserTypeChange}
                      className="w-full px-3 py-2.5 bg-slate-700/50 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-200"
                      required
                    >
                      <option value="normal">Normal User</option>
                      <option value="community">Community User</option>
                      <option value="expert">Expert User</option>
                    </select>
                  </div>

                  {/* Email Field */}
                  <div>
                    <label className="block text-slate-300 text-sm font-medium mb-1">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                      <input
                        type="email"
                        id="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className="w-full pl-10 pr-3 py-2.5 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-200"
                        placeholder="Enter your email"
                        required
                      />
                    </div>
                  </div>

                  {/* Password Field */}
                  <div>
                    <label className="block text-slate-300 text-sm font-medium mb-1">
                      Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        id="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        className="w-full pl-10 pr-10 py-2.5 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-200"
                        placeholder="Enter your password"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-2.5 rounded-xl transition-all duration-200 transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-blue-500/50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                  >
                    {loading ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    ) : (
                      <>
                        <LogIn className="w-4 h-4" />
                        <span>Sign In</span>
                      </>
                    )}
                  </button>
                </form>

                {/* Stage 4: Navigation Links */}
                <div className="mt-4 stage-4-details">
                  <div className="text-center">
                    <p className="text-slate-400 mb-2 text-sm">
                      Don't have an account?{' '}
                      <Link 
                        to="/signup" 
                        className="text-blue-400 hover:text-blue-300 font-medium transition-colors inline-flex items-center space-x-1"
                      >
                        <UserPlus className="w-4 h-4" />
                        <span>Create Account</span>
                      </Link>
                    </p>
                    
                    <Link 
                      to="/" 
                      className="text-slate-500 hover:text-slate-300 text-sm transition-colors inline-flex items-center space-x-1"
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

export default LoginForm;
