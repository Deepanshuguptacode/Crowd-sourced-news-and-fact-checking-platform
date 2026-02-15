import { useState, useContext } from "react";
import { useNavigate, Link } from "react-router-dom";
import { UserContext } from "../context/userContext";
import { authAPI } from "../services/api";
import { toast } from "react-toastify";
import { Eye, EyeOff, Mail, Lock, User, UserPlus, Shield, Key } from "lucide-react";
import { motion } from "framer-motion";
import NavigationHeader from "../components/NavigationHeader";

const AdminSignup = () => {
  const [formData, setFormData] = useState({
    name: "",
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    securityPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showSecurityPassword, setShowSecurityPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useContext(UserContext);
  const navigate = useNavigate();

  const handleInput = (e) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      return toast.error("Passwords don't match!");
    }
    if (!formData.securityPassword) {
      return toast.error("Security password is required for admin registration!");
    }
    setLoading(true);
    try {
      const res = await authAPI.adminSignup({
        name: formData.name,
        username: formData.username,
        email: formData.email,
        password: formData.password,
        securityPassword: formData.securityPassword,
      });
      if (res.token) {
        toast.success("Admin account created successfully!");
        login({ ...res.admin, userType: "admin" }, res.token);
        navigate("/home");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Admin registration failed!");
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-slate-700/50 border-2 border-gray-200 dark:border-slate-600 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500 transition-all duration-300";
  const iconClass =
    "absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-slate-400 w-5 h-5 group-focus-within:text-red-500 transition-colors duration-300";

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
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mt-3">
                    Admin Registration
                  </h1>
                  <p className="text-lg sm:text-xl text-white/90">
                    Create Administrator Account
                  </p>
                  <div className="mt-4 space-y-3">
                    {[
                      { text: "Full content management", icon: Shield },
                      { text: "Security password required", icon: Key },
                      { text: "Elevated privileges", icon: Lock },
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
                  <div className="mt-6 p-4 bg-white/10 rounded-xl border border-white/20">
                    <p className="text-sm text-white/80">
                      Admin registration requires a security password provided by the
                      platform owner.
                    </p>
                  </div>
                </div>
              </div>

              {/* Right Panel - Form */}
              <motion.div
                className="p-6 sm:p-8 flex flex-col justify-center lg:max-h-screen lg:overflow-y-auto"
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
              >
                <div className="max-w-md mx-auto w-full space-y-3">
                  <div>
                    <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                      Create Admin
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-slate-400">
                      Restricted registration
                    </p>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-3">
                    {/* Name & Username */}
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { id: "name", placeholder: "Full Name", icon: User },
                        { id: "username", placeholder: "Username", icon: User },
                      ].map((field) => (
                        <div key={field.id}>
                          <label className="block text-gray-700 dark:text-slate-300 text-sm font-medium mb-1">
                            {field.id === "name" ? "Full Name" : "Username"}
                          </label>
                          <div className="relative group">
                            <field.icon className={iconClass} />
                            <input
                              id={field.id}
                              type="text"
                              value={formData[field.id]}
                              onChange={handleInput}
                              placeholder={field.placeholder}
                              required
                              className={inputClass}
                            />
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Email */}
                    <div>
                      <label className="block text-gray-700 dark:text-slate-300 text-sm font-medium mb-1">
                        Email Address
                      </label>
                      <div className="relative group">
                        <Mail className={iconClass} />
                        <input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={handleInput}
                          placeholder="admin@example.com"
                          required
                          className={inputClass}
                        />
                      </div>
                    </div>

                    {/* Password & Confirm */}
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { id: "password", label: "Password", placeholder: "Password" },
                        {
                          id: "confirmPassword",
                          label: "Confirm",
                          placeholder: "Confirm",
                        },
                      ].map((field) => (
                        <div key={field.id}>
                          <label className="block text-gray-700 dark:text-slate-300 text-sm font-medium mb-1">
                            {field.label}
                          </label>
                          <div className="relative group">
                            <Lock className={iconClass} />
                            <input
                              id={field.id}
                              type={showPassword ? "text" : "password"}
                              value={formData[field.id]}
                              onChange={handleInput}
                              placeholder={field.placeholder}
                              required
                              className={inputClass + " pr-12"}
                            />
                            {field.id === "password" && (
                              <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors"
                              >
                                {showPassword ? (
                                  <EyeOff className="w-5 h-5" />
                                ) : (
                                  <Eye className="w-5 h-5" />
                                )}
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Security Password */}
                    <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-xl border-2 border-red-200 dark:border-red-800">
                      <label className="block text-red-700 dark:text-red-300 text-sm font-medium mb-1">
                        <Key className="w-4 h-4 inline mr-1" />
                        Security Password
                      </label>
                      <p className="text-xs text-red-600 dark:text-red-400 mb-2">
                        This password is provided by the platform owner to authorize admin
                        creation.
                      </p>
                      <div className="relative group">
                        <Key className={iconClass} />
                        <input
                          id="securityPassword"
                          type={showSecurityPassword ? "text" : "password"}
                          value={formData.securityPassword}
                          onChange={handleInput}
                          placeholder="Enter security password"
                          required
                          className={inputClass + " pr-12 !border-red-300 dark:!border-red-700 !focus:ring-red-500/50 !focus:border-red-500"}
                        />
                        <button
                          type="button"
                          onClick={() => setShowSecurityPassword(!showSecurityPassword)}
                          className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors"
                        >
                          {showSecurityPassword ? (
                            <EyeOff className="w-5 h-5" />
                          ) : (
                            <Eye className="w-5 h-5" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Submit */}
                    <motion.button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white font-semibold py-3.5 rounded-xl flex items-center justify-center space-x-2 shadow-lg transition-all duration-300 disabled:opacity-50"
                      whileHover={{ scale: loading ? 1 : 1.02 }}
                    >
                      {loading ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <>
                          <UserPlus className="w-5 h-5" />
                          <span>Create Admin Account</span>
                        </>
                      )}
                    </motion.button>
                  </form>

                  {/* Footer */}
                  <div className="pt-4 border-t border-gray-200 dark:border-slate-700 text-center space-y-2">
                    <p className="text-gray-600 dark:text-slate-400 text-sm">
                      Already have an admin account?{" "}
                      <Link
                        to="/admin/login"
                        className="text-red-600 dark:text-red-400 font-medium hover:underline"
                      >
                        Admin Sign In
                      </Link>
                    </p>
                    <p className="text-gray-600 dark:text-slate-400 text-sm">
                      <Link
                        to="/signup"
                        className="text-blue-600 dark:text-blue-400 font-medium hover:underline"
                      >
                        Regular User Signup
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

export default AdminSignup;
