import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useContext } from "react";
import { UserContext } from "../context/userContext";
import { authAPI } from "../services/api";
import { toast } from "react-toastify";
import { Eye, EyeOff, Mail, Lock, LogIn, UserPlus, ArrowLeft, Camera } from 'lucide-react';
import FaceCapture from '../components/FaceCapture';

const LoginForm = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    userType: "normal"
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loginMethod, setLoginMethod] = useState('password'); // 'password' or 'face'
  const [faceImage, setFaceImage] = useState(null);
  const [showFaceCapture, setShowFaceCapture] = useState(false);
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

  const handleGuestLogin = async () => {
    setLoading(true);
    try {
      // Set guest user context without API call
      login({
        userType: 'guest',
        token: 'guest-token',
        name: 'Guest User'
      });
      
      toast.success("Logged in as Guest!");
      navigate("/home");
    } catch (error) {
      toast.error("Guest login failed!");
    } finally {
      setLoading(false);
    }
  };

  const handleFaceCapture = (imageDataUrl) => {
    setFaceImage(imageDataUrl);
    toast.success("Face captured successfully!");
  };

  const handleFaceCaptureError = (error) => {
    toast.error("Face capture failed: " + error);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate inputs based on login method
    if (loginMethod === 'password' && (!formData.email || !formData.password)) {
      toast.error("Email and password are required for password login!");
      return;
    }
    
    if (loginMethod === 'face' && (!formData.email || !faceImage)) {
      toast.error("Email and face image are required for face login!");
      return;
    }

    setLoading(true);
    
    try {
      const loginData = {
        email: formData.email,
        loginMethod: loginMethod,
        ...(loginMethod === 'password' && { password: formData.password }),
        ...(loginMethod === 'face' && { faceImage: faceImage })
      };

      const response = await authAPI.login(formData.userType, loginData);

      if (response.token) {
        // Use the login function from context
        login({
          ...response.user,
          userType: formData.userType
        }, response.token);

        const message = response.authMethod === 'face' 
          ? "Face login successful!" 
          : "Login successful!";
        toast.success(message);
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
      className="min-h-screen bg-gray-50 dark:bg-[#0D1117] stage-1-background relative overflow-x-hidden transition-colors duration-300"
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

      {/* Stage 3: Main Login Form */}
      <div className="min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 py-4 stage-3-form">
        <div className="w-full max-w-5xl mx-auto">
          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-lg rounded-2xl shadow-2xl border border-gray-200/50 dark:border-slate-700/50 overflow-hidden">
            <div className="grid lg:grid-cols-2 min-h-[480px]">{              /* Left Panel - Welcome Content */}
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
                  <h2 className="text-xl lg:text-2xl font-bold text-gray-900 dark:text-white mb-1">Sign In</h2>
                  <p className="text-gray-600 dark:text-slate-400 mb-4 text-sm">Access your NewsCheck account</p>

                  <form onSubmit={handleSubmit} className="space-y-3">
                  {/* User Type Selection */}
                  <div>
                    <label className="block text-gray-700 dark:text-slate-300 text-sm font-medium mb-1">
                      Account Type
                    </label>
                    <select
                      id="userType"
                      value={formData.userType}
                      onChange={handleUserTypeChange}
                      className="w-full px-3 py-2.5 bg-gray-100 dark:bg-slate-700/50 border border-gray-300 dark:border-slate-600 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-200"
                      required
                    >
                      <option value="normal">Onlooker</option>
                      <option value="community">Community User</option>
                      <option value="expert">Expert User</option>
                    </select>
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
                        className="w-full pl-10 pr-3 py-2.5 bg-gray-100 dark:bg-slate-700/50 border border-gray-300 dark:border-slate-600 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-200"
                        placeholder="Enter your email"
                        required
                      />
                    </div>
                  </div>

                  {/* Login Method Selection */}
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-800/50 dark:to-slate-700/50 p-4 rounded-xl border border-blue-200 dark:border-slate-600">
                    <label className="block text-gray-700 dark:text-slate-300 text-sm font-medium mb-3">
                      Login Method
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setLoginMethod('password')}
                        className={`flex items-center justify-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                          loginMethod === 'password'
                            ? 'bg-blue-600 text-white shadow-md'
                            : 'bg-white dark:bg-slate-700 text-gray-700 dark:text-slate-300 border border-gray-300 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-600'
                        }`}
                      >
                        <Lock className="w-4 h-4" />
                        <span>Password</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setLoginMethod('face')}
                        className={`flex items-center justify-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                          loginMethod === 'face'
                            ? 'bg-green-600 text-white shadow-md'
                            : 'bg-white dark:bg-slate-700 text-gray-700 dark:text-slate-300 border border-gray-300 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-600'
                        }`}
                      >
                        <Camera className="w-4 h-4" />
                        <span>Face ID</span>
                      </button>
                    </div>
                  </div>

                  {/* Password Field (shown for password login) */}
                  {loginMethod === 'password' && (
                    <div className="transition-all duration-300 ease-in-out">
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
                          className="w-full pl-10 pr-10 py-2.5 bg-gray-100 dark:bg-slate-700/50 border border-gray-300 dark:border-slate-600 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-200"
                          placeholder="Enter your password"
                          required={loginMethod === 'password'}
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
                  )}

                  {/* Face Authentication (shown for face login) */}
                  {loginMethod === 'face' && (
                    <div className="transition-all duration-300 ease-in-out">
                      <label className="block text-gray-700 dark:text-slate-300 text-sm font-medium mb-3">
                        Face Authentication
                      </label>
                      
                      <button
                        type="button"
                        onClick={() => setShowFaceCapture(!showFaceCapture)}
                        className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center justify-center space-x-2"
                      >
                        <Camera className="w-4 h-4" />
                        <span>{faceImage ? 'Update Face Image' : 'Capture Face for Login'}</span>
                      </button>

                      {showFaceCapture && (
                        <div className="mt-4 p-4 bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-600">
                          <FaceCapture
                            onCapture={handleFaceCapture}
                            onError={handleFaceCaptureError}
                            mode="both"
                            captureButtonText="Capture Your Face"
                            uploadButtonText="Upload Face Photo"
                            className="w-full"
                          />
                        </div>
                      )}

                      {faceImage && (
                        <div className="mt-3 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                          <p className="text-sm text-green-700 dark:text-green-300 flex items-center space-x-2">
                            <Camera className="w-4 h-4" />
                            <span>Face captured successfully! You can now log in.</span>
                          </p>
                        </div>
                      )}
                    </div>
                  )}

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

                  {/* Guest Login Button */}
                  <button
                    type="button"
                    onClick={handleGuestLogin}
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white font-semibold py-2.5 rounded-xl transition-all duration-200 transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-gray-500/50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 mt-3"
                  >
                    {loading ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    ) : (
                      <>
                        <Eye className="w-4 h-4" />
                        <span>Continue as Guest</span>
                      </>
                    )}
                  </button>
                </form>

                {/* Stage 4: Navigation Links */}
                <div className="mt-4 stage-4-details">
                  <div className="text-center">
                    <p className="text-gray-600 dark:text-slate-400 mb-2 text-sm">
                      Don't have an account?{' '}
                      <Link 
                        to="/signup" 
                        className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium transition-colors inline-flex items-center space-x-1"
                      >
                        <UserPlus className="w-4 h-4" />
                        <span>Create Account</span>
                      </Link>
                    </p>
                    
                    <Link 
                      to="/" 
                      className="text-gray-500 dark:text-slate-500 hover:text-gray-700 dark:hover:text-slate-300 text-sm transition-colors inline-flex items-center space-x-1"
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
