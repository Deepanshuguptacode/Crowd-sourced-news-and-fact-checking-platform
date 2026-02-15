import { useState, useContext } from "react";
import { useNavigate, Link } from "react-router-dom";
import { UserContext } from "../context/userContext";
import { authAPI } from "../services/api";
import { toast } from "react-toastify";
import { Eye, EyeOff, Mail, Lock, LogIn, Shield, Key } from "lucide-react";
import { motion } from "framer-motion";
import NavigationHeader from "../components/NavigationHeader";

const AdminLogin = () => {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useContext(UserContext);
  const navigate = useNavigate();

  const handleInput = (e) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.email || !formData.password) {
      return toast.error("Email and password are required!");
    }
    setLoading(true);
    try {
      const res = await authAPI.adminLogin(formData);
      if (res.token) {
        toast.success("Admin login successful!");
        login({ ...res.admin, userType: "admin" }, res.token);
        navigate("/home");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Admin login failed!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/20 dark:from-[#0D1117] dark:to-slate-900 relative overflow-x-hidden transition-all duration-700">
      <NavigationHeader />
      <motion.div
        className="absolute inset-0 opacity-20 dark:opacity-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.18 }}
        transition={{ duration: 1.2 }}
      >
        <div className="absolute top-20 left-10 w-96 h-96 bg-red-300 dark:bg-red-600 rounded-full mix-blend-multiply filter blur-3xl animate-blob" />
        <div className="absolute top-40 right-10 w-96 h-96 bg-orange-300 dark:bg-orange-600 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000" />
      </motion.div>

      <div className="min-h-screen flex items-center justify-center px-4 py-20 relative z-10">
        <motion.div
          className="w-full max-w-6xl my-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="my-2 bg-white/70 dark:bg-slate-800/70 backdrop-blur-2xl rounded-2xl overflow-hidden border border-white/20 dark:border-slate-700/50 shadow-2xl">
            <div className="grid lg:grid-cols-2">
              {/* Left Panel */}
              <div className="bg-gradient-to-br from-red-600 via-red-700 to-orange-800 p-8 flex flex-col justify-center text-white min-h-[420px]">
                <div className="relative z-10 space-y-4">
                  <Shield className="w-12 h-12 opacity-90" strokeWidth={1.5} />
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mt-3">Admin Portal</h1>
                  <p className="text-lg sm:text-xl text-white/90">Platform Administration</p>
                  <div className="mt-4 space-y-3">
                    {[
                      { text: "Full platform management", icon: Shield },
                      { text: "Delete any content", icon: Key },
                      { text: "Manage all users", icon: Lock },
                    ].map((f, i) => {
                      const Icon = f.icon;
                      return (
                        <div key={i} className="flex items-start space-x-3">
                          <div className="mt-1 p-2 bg-white/20 rounded-lg">
                            <Icon className="w-4 h-4" />
                          </div>
                          <span className="text-sm sm:text-base text-white/90">{f.text}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Right Panel - Form */}
              <motion.div
                className="p-6 sm:p-8"
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
              >
                <div className="max-w-md mx-auto w-full space-y-3">
                  <div>
                    <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                      Admin Sign In
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-slate-400">
                      Restricted access - administrators only
                    </p>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Email */}
                    <div>
                      <label className="block text-gray-700 dark:text-slate-300 text-sm font-medium mb-1">
                        Admin Email
                      </label>
                      <div className="relative group">
                        <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-slate-400 w-5 h-5 group-focus-within:text-red-500 transition-colors duration-300" />
                        <input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={handleInput}
                          placeholder="admin@example.com"
                          required
                          className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-slate-700/50 border-2 border-gray-200 dark:border-slate-600 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500 transition-all duration-300"
                        />
                      </div>
                    </div>

                    {/* Password */}
                    <div>
                      <label className="block text-gray-700 dark:text-slate-300 text-sm font-medium mb-1">
                        Password
                      </label>
                      <div className="relative group">
                        <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-slate-400 w-5 h-5 group-focus-within:text-red-500 transition-colors duration-300" />
                        <input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          value={formData.password}
                          onChange={handleInput}
                          placeholder="Enter your password"
                          required
                          className="w-full pl-12 pr-12 py-3 bg-gray-50 dark:bg-slate-700/50 border-2 border-gray-200 dark:border-slate-600 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500 transition-all duration-300"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-slate-400 hover:text-gray-600 dark:hover:text-white transition-colors"
                        >
                          {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>

                    {/* Submit */}
                    <motion.button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-gradient-to-r from-red-600 to-orange-600 text-white font-semibold py-3.5 rounded-xl flex items-center justify-center space-x-2 shadow-lg"
                      whileHover={{ scale: loading ? 1 : 1.02 }}
                    >
                      {loading ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <>
                          <LogIn className="w-5 h-5" />
                          <span>Admin Sign In</span>
                        </>
                      )}
                    </motion.button>
                  </form>

                  {/* Footer */}
                  <div className="pt-4 border-t border-gray-200 dark:border-slate-700 text-center space-y-2">
                    <p className="text-gray-600 dark:text-slate-400 text-sm">
                      Need an admin account?{" "}
                      <Link
                        to="/admin/signup"
                        className="text-red-600 dark:text-red-400 font-medium hover:underline"
                      >
                        Register Admin
                      </Link>
                    </p>
                    <p className="text-gray-600 dark:text-slate-400 text-sm">
                      <Link
                        to="/login"
                        className="text-blue-600 dark:text-blue-400 font-medium hover:underline"
                      >
                        Regular User Login
                      </Link>
                    </p>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default AdminLogin;
