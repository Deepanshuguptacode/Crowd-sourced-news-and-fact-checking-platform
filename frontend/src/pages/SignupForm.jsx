import { useState, useContext } from "react";
import { useNavigate, Link } from "react-router-dom";
import { UserContext } from "../context/userContext";
import { authAPI } from "../services/api";
import { toast } from "react-toastify";
import { Eye, EyeOff, Mail, Lock, User, UserPlus, LogIn, Briefcase, Camera, Shield, Users, Award, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import LivenessFaceCapture from "../components/LivenessFaceCapture";
import NavigationHeader from "../components/NavigationHeader";

const roleContent = {
  normal: { title: "Join as an Onlooker", subtitle: "Start Your Journey", icon: Eye, features: [{ text: "Access verified news", icon: Sparkles }, { text: "Browse fact-checked articles", icon: Shield }, { text: "Stay informed daily", icon: Users }] },
  community: { title: "Become a Community Member", subtitle: "Make Your Voice Heard", icon: Users, features: [{ text: "Submit news articles", icon: Sparkles }, { text: "Participate in verification", icon: Shield }, { text: "Build your reputation", icon: Award }] },
  expert: { title: "Register as an Expert", subtitle: "Lead the Fact-Checking", icon: Award, features: [{ text: "Provide expert insights", icon: Shield }, { text: "Verify complex claims", icon: Sparkles }, { text: "Guide the community", icon: Award }] }
};

const styles = {
  input: "w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-slate-700/50 border-2 border-gray-200 dark:border-slate-600 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-300",
  label: "block text-gray-700 dark:text-slate-300 text-sm font-medium mb-1",
  icon: "absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-slate-400 w-5 h-5 group-focus-within:text-blue-500 transition-colors duration-300"
};

const InputField = ({ id, type = "text", icon: Icon, placeholder, value, onChange, children }) => (
  <div className="relative group">
    <Icon className={styles.icon} />
    <input type={type} id={id} value={value} onChange={onChange} className={styles.input + (children ? " pr-12" : "")} placeholder={placeholder} required />
    {children}
  </div>
);

const SignupForm = () => {
  const [formData, setFormData] = useState({ name: "", username: "", email: "", password: "", confirmPassword: "", userType: "normal", profession: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [faceImage, setFaceImage] = useState(null);
  const [showFaceCapture, setShowFaceCapture] = useState(false);

  const { login } = useContext(UserContext);
  const navigate = useNavigate();
  const currentRole = roleContent[formData.userType];

  const handleInputChange = (e) => setFormData({ ...formData, [e.target.id]: e.target.value });

  const handleFaceCapture = (imageDataUrl) => {
    setFaceImage(imageDataUrl);
    setShowFaceCapture(false);
    toast.success("Liveness verified & face captured successfully!");
  };

  const handleFaceCaptureError = (err) => {
    toast.error("Liveness verification failed: " + err);
    setFaceImage(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) return toast.error("Passwords don't match");
    if (!faceImage) {
      toast.error("Face authentication is required. Please complete face capture.");
      setShowFaceCapture(true);
      return;
    }
    setLoading(true);
    try {
      const payload = {
        name: formData.name,
        username: formData.username,
        email: formData.email,
        password: formData.password,
        confirmPassword: formData.confirmPassword,
        userType: formData.userType
      };
      
      if (formData.userType === "expert" && formData.profession) {
        payload.profession = formData.profession;
      }
      
      payload.faceImage = faceImage;
      
      const res = await authAPI.signup(formData.userType, payload);
      if (res.token) {
        login({ ...res.user, userType: formData.userType }, res.token);
        navigate("/home");
      } else navigate("/login");
    } catch (err) {
      toast.error(err.response?.data?.message || "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen lg:h-screen lg:overflow-hidden bg-gradient-to-br from-gray-50 to-blue-50/20 dark:from-[#0D1117] dark:to-slate-900 relative overflow-x-hidden transition-all duration-700">
      <NavigationHeader />
      <div className="min-h-screen lg:h-screen flex items-center justify-center px-4 py-20 lg:py-8 relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 15 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="w-full max-w-6xl lg:mt-16 bg-white/70 dark:bg-slate-800/70 backdrop-blur-2xl rounded-2xl shadow-2xl overflow-hidden border border-white/20 dark:border-slate-700/50"
        >
          <div className="grid lg:grid-cols-2">
            <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 p-6 sm:p-8 flex flex-col justify-center text-white relative overflow-hidden min-h-[400px] sm:min-h-[450px]">
              <div className="absolute inset-0 opacity-10">
                <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '32px 32px' }} />
              </div>
              <AnimatePresence mode="wait">
                <motion.div 
                  key={formData.userType} 
                  initial={{ opacity: 0, y: 10 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  exit={{ opacity: 0, y: -10 }} 
                  transition={{ duration: 0.4, ease: "easeInOut" }} 
                  className="relative z-10 space-y-4 sm:space-y-6"
                >
                  <currentRole.icon className="w-12 h-12 sm:w-14 sm:h-14 opacity-90" strokeWidth={1.5} />
                  <div>
                    <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2 sm:mb-3 leading-tight">{currentRole.title}</h1>
                    <p className="text-lg sm:text-xl text-white/90">{currentRole.subtitle}</p>
                  </div>
                  <div className="space-y-3 sm:space-y-4 pt-2">
                    {currentRole.features.map((feature, idx) => (
                      <div key={idx} className="flex items-start space-x-3 group">
                        <div className="mt-1 p-2 bg-white/20 rounded-lg group-hover:bg-white/30 transition-all duration-300">
                          <feature.icon className="w-4 h-4" />
                        </div>
                        <span className="text-sm sm:text-base text-white/90 group-hover:text-white transition-colors duration-300">{feature.text}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            <motion.div 
              className="p-6 sm:p-8 flex flex-col justify-start lg:justify-center lg:max-h-screen lg:overflow-y-auto scrollbar-hide max-w-md mx-auto w-full" 
              initial={{ opacity: 0, x: 20 }} 
              animate={{ opacity: 1, x: 0 }} 
              transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
            >
              <div className="space-y-3">
                <div>
                  <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-1">Create Account</h2>
                  <p className="text-sm sm:text-base text-gray-600 dark:text-slate-400">Join the truth revolution</p>
                </div>
                <form onSubmit={handleSubmit} className="space-y-3">
                  <div>
                    <label htmlFor="userType" className={styles.label}>Account Type</label>
                    <select id="userType" value={formData.userType} onChange={handleInputChange} className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-700/50 border-2 border-gray-200 dark:border-slate-600 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-300 cursor-pointer" required>
                      <option value="normal">Onlooker</option>
                      <option value="community">Community User</option>
                      <option value="expert">Expert User</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {['name', 'username'].map((field) => (
                      <div key={field}>
                        <label htmlFor={field} className={styles.label}>{field === 'name' ? 'Full Name' : 'Username'}</label>
                        <InputField id={field} icon={User} placeholder={field === 'name' ? 'Full name' : 'Username'} value={formData[field]} onChange={handleInputChange} />
                      </div>
                    ))}
                  </div>
                  <div>
                    <label htmlFor="email" className={styles.label}>Email Address</label>
                    <InputField id="email" type="email" icon={Mail} placeholder="you@example.com" value={formData.email} onChange={handleInputChange} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { id: 'password', show: showPassword, setShow: setShowPassword, label: 'Password', placeholder: 'Password' },
                      { id: 'confirmPassword', show: showConfirmPassword, setShow: setShowConfirmPassword, label: 'Confirm', placeholder: 'Confirm' }
                    ].map((field) => (
                      <div key={field.id}>
                        <label htmlFor={field.id} className={styles.label}>{field.label}</label>
                        <InputField id={field.id} type={field.show ? 'text' : 'password'} icon={Lock} placeholder={field.placeholder} value={formData[field.id]} onChange={handleInputChange}>
                          <button type="button" onClick={() => field.setShow(!field.show)} className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-slate-400 hover:text-gray-600 dark:hover:text-white transition-colors duration-300">
                            {field.show ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                          </button>
                        </InputField>
                      </div>
                    ))}
                  </div>
                  <AnimatePresence mode="wait">
                    {formData.userType === "expert" && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }} 
                        animate={{ opacity: 1, height: 'auto' }} 
                        exit={{ opacity: 0, height: 0 }} 
                        transition={{ duration: 0.4, ease: "easeInOut" }}
                      >
                        <label htmlFor="profession" className={styles.label}>Profession</label>
                        <InputField id="profession" icon={Briefcase} placeholder="Your profession" value={formData.profession} onChange={handleInputChange} />
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <motion.div 
                    className="bg-gradient-to-br from-blue-50/50 to-indigo-50/50 dark:from-slate-800/50 dark:to-slate-700/50 p-4 rounded-xl border-2 border-blue-200/50 dark:border-slate-600" 
                    initial={{ opacity: 0, y: 10 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    transition={{ delay: 0.3, duration: 0.5, ease: "easeOut" }}
                  >
                    <div className="flex items-center mb-3">
                      <div className="flex items-center space-x-2">
                        <Camera className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        <h3 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white">Face Authentication</h3>
                        <span className="text-xs font-medium text-red-500 dark:text-red-400">(Required)</span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-slate-400 mb-3">Face liveness verification is required to create an account</p>
                    <AnimatePresence mode="wait">
                      {(
                        <motion.div 
                          initial={{ opacity: 0, height: 0 }} 
                          animate={{ opacity: 1, height: 'auto' }} 
                          exit={{ opacity: 0, height: 0 }} 
                          transition={{ duration: 0.4, ease: "easeInOut" }} 
                          className="space-y-3"
                        >
                          {!faceImage && (
                            <motion.button 
                              type="button" 
                              onClick={() => setShowFaceCapture(!showFaceCapture)} 
                              className="w-full px-4 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-xl transition-all duration-300 flex items-center justify-center space-x-2 shadow-lg shadow-blue-500/20" 
                              whileHover={{ scale: 1.02 }} 
                              whileTap={{ scale: 0.98 }}
                              transition={{ duration: 0.2 }}
                            >
                              <Camera className="w-5 h-5" />
                              <span>Start Liveness + Face Verification</span>
                            </motion.button>
                          )}
                          <AnimatePresence mode="wait">
                            {showFaceCapture && !faceImage && (
                              <motion.div 
                                initial={{ opacity: 0, height: 0 }} 
                                animate={{ opacity: 1, height: 'auto' }} 
                                exit={{ opacity: 0, height: 0 }} 
                                transition={{ duration: 0.4, ease: "easeInOut" }}
                                className="p-4 bg-white dark:bg-slate-800 rounded-xl border-2 border-gray-200 dark:border-slate-600"
                              >
                                <LivenessFaceCapture onSuccess={handleFaceCapture} onError={handleFaceCaptureError} />
                              </motion.div>
                            )}
                          </AnimatePresence>
                          {faceImage && (
                            <motion.div 
                              initial={{ opacity: 0, scale: 0.95 }} 
                              animate={{ opacity: 1, scale: 1 }} 
                              transition={{ duration: 0.3, ease: "easeOut" }}
                              className="p-3 bg-green-50 dark:bg-green-900/20 border-2 border-green-200 dark:border-green-800 rounded-xl flex items-center justify-between"
                            >
                              <div className="flex items-center space-x-2">
                                <Camera className="w-4 h-4 text-green-700 dark:text-green-300" />
                                <span className="text-sm text-green-700 dark:text-green-300 font-medium">✓ Liveness verified & face captured!</span>
                              </div>
                              <button 
                                type="button"
                                onClick={() => { setFaceImage(null); setShowFaceCapture(true); }}
                                className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                              >
                                Retake
                              </button>
                            </motion.div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                  <motion.button
                    type="submit" 
                    disabled={loading} 
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-3.5 rounded-xl transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500/50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 shadow-lg shadow-blue-500/20" 
                    whileHover={{ scale: loading ? 1 : 1.02 }} 
                    whileTap={{ scale: loading ? 1 : 0.98 }}
                    transition={{ duration: 0.2 }}
                  >
                    {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><UserPlus className="w-5 h-5" /><span>Create Account</span></>}
                  </motion.button>
                </form>
                <p className="pt-4 border-t border-gray-200 dark:border-slate-700 text-center text-gray-600 dark:text-slate-400 text-sm">
                  Already have an account?{' '}
                  <Link to="/login" className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium transition-colors inline-flex items-center space-x-1 hover:underline">
                    <LogIn className="w-4 h-4" /><span>Sign In</span>
                  </Link>
                </p>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default SignupForm;
