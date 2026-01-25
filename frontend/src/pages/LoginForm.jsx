import { useState, useContext } from "react";
import { useNavigate, Link } from "react-router-dom";
import { UserContext } from "../context/userContext";
import { authAPI } from "../services/api";
import { toast } from "react-toastify";
import {
  Eye, EyeOff, Mail, Lock, LogIn, UserPlus, ArrowLeft, Camera,
  Shield, Users, Award, Sparkles
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import FaceCapture from '../components/FaceCapture';
import NavigationHeader from "../components/NavigationHeader";

/* Role content stays the same (kept compact) */
const roleContent = {
  normal: {
    title: "Welcome Onlooker", subtitle: "Explore & Stay Informed", icon: Eye,
    features: [{ text: "Browse verified news", icon: Sparkles }, { text: "Access fact-checked content", icon: Shield }, { text: "Stay informed on trends", icon: Users }]
  },
  community: {
    title: "Welcome Community Member", subtitle: "Engage & Verify Together", icon: Users,
    features: [{ text: "Submit news for verification", icon: Sparkles }, { text: "Vote on news authenticity", icon: Shield }, { text: "Earn community reputation", icon: Award }]
  },
  expert: {
    title: "Welcome Expert Verifier", subtitle: "Lead the Truth Movement", icon: Award,
    features: [{ text: "Provide expert analysis", icon: Shield }, { text: "Verify complex claims", icon: Sparkles }, { text: "Influence fact-checking", icon: Award }]
  }
};

const Field = ({ label, id, type = "text", icon: Icon, value, onChange, required, placeholder, rightElem }) => (
  <div>
    <label className="block text-gray-700 dark:text-slate-300 text-sm font-medium mb-1">{label}</label>
    <div className="relative group">
      {Icon && <Icon className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-slate-400 w-5 h-5 group-focus-within:text-blue-500 transition-colors duration-300" />}
      <input
        id={id}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        className="w-full pl-12 pr-12 py-3 bg-gray-50 dark:bg-slate-700/50 border-2 border-gray-200 dark:border-slate-600 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-300"
      />
      {rightElem && <div className="absolute right-4 top-1/2 transform -translate-y-1/2">{rightElem}</div>}
    </div>
  </div>
);

const LoginForm = () => {
  const [formData, setFormData] = useState({ email: "", password: "", userType: "normal" });
  const [ui, setUi] = useState({ showPassword: false, loading: false, loginMethod: "password", face: { open: false, image: null } });
  const { login } = useContext(UserContext);
  const navigate = useNavigate();
  const role = roleContent[formData.userType];
  const RoleIcon = role.icon;

  const upd = (patch) => setFormData(prev => ({ ...prev, ...patch }));
  const updUi = (patch) => setUi(prev => ({ ...prev, ...patch }));

  const handleInput = (e) => {
    const { id, value } = e.target;
    upd({ [id]: value });
  };

  const handleGuestLogin = async () => {
    updUi({ loading: true });
    try {
      login({ userType: 'guest', token: 'guest-token', name: 'Guest User' });
      toast.success("Logged in as Guest!");
      navigate("/home");
    } catch {
      toast.error("Guest login failed!");
    } finally {
      updUi({ loading: false });
    }
  };

  const handleFaceCapture = (dataUrl) => {
    setUi(prev => ({ ...prev, face: { ...prev.face, image: dataUrl } }));
    toast.success("Face captured successfully!");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { loginMethod } = ui;
    if (loginMethod === 'password' && (!formData.email || !formData.password)) return toast.error("Email and password are required!");
    if (loginMethod === 'face' && (!formData.email || !ui.face.image)) return toast.error("Email and face image are required!");
    updUi({ loading: true });
    try {
      const loginData = {
        email: formData.email,
        loginMethod,
        ...(loginMethod === 'password' ? { password: formData.password } : { faceImage: ui.face.image })
      };
      const res = await authAPI.login(formData.userType, loginData);
      if (res.token) {
        if (res.authMethod === 'face' && res.similarity) {
          toast.success(`Face login successful! Match: ${(res.similarity * 100).toFixed(1)}%`, { autoClose: 3000 });
        } else toast.success("Login successful!");
        login({ ...res.user, userType: formData.userType }, res.token);
        navigate("/home");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Login failed!");
    } finally {
      updUi({ loading: false });
    }
  };

  return (
    <div className="min-h-screen lg:h-screen lg:overflow-hidden bg-gradient-to-br from-gray-50 to-blue-50/20 dark:from-[#0D1117] dark:to-slate-900 relative overflow-x-hidden transition-all duration-700">
      <NavigationHeader />
      {/* subtle animated blobs */}
      <motion.div className="absolute inset-0 opacity-20 dark:opacity-10" initial={{ opacity: 0 }} animate={{ opacity: 0.18 }} transition={{ duration: 1.2 }}>
        <div className="absolute top-20 left-10 w-96 h-96 bg-blue-300 dark:bg-blue-600 rounded-full mix-blend-multiply filter blur-3xl animate-blob"></div>
        <div className="absolute top-40 right-10 w-96 h-96 bg-indigo-300 dark:bg-indigo-600 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000"></div>
      </motion.div>

      <div className="min-h-screen lg:h-screen flex items-center justify-center px-4 py-20 lg:py-8 relative z-10">
        <motion.div className="w-full max-w-6xl lg:mt-16" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <div className="my-2 bg-white/70 dark:bg-slate-800/70 backdrop-blur-2xl rounded-2xl overflow-hidden border border-white/20 dark:border-slate-700/50 shadow-2xl">
            <div className="grid lg:grid-cols-2">
              {/* LEFT */}
              <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 p-8 flex flex-col justify-center text-white min-h-[420px]">
                <div className="relative z-10 space-y-4">
                  <motion.div key={formData.userType} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.28 }}>
                    <RoleIcon className="w-12 h-12 opacity-90" strokeWidth={1.5} />
                    <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mt-3">{role.title}</h1>
                    <p className="text-lg sm:text-xl text-white/90">{role.subtitle}</p>
                    <div className="mt-4 space-y-3">
                      {role.features.map((f, i) => {
                        const Icon = f.icon;
                        return (
                          <div key={i} className="flex items-start space-x-3">
                            <div className="mt-1 p-2 bg-white/20 rounded-lg"><Icon className="w-4 h-4" /></div>
                            <span className="text-sm sm:text-base text-white/90">{f.text}</span>
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                </div>
              </div>

              {/* RIGHT */}
              <motion.div className="p-6 sm:p-8" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}>
                <div className="max-w-md mx-auto w-full space-y-3">
                  <div>
                    <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Sign In</h2>
                    <p className="text-sm text-gray-600 dark:text-slate-400">Welcome back to VoxVeritas</p>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-3">
                    {/* Account Type */}
                    <div>
                      <label className="block text-gray-700 dark:text-slate-300 text-sm font-medium mb-1">Account Type</label>
                      <select
                        id="userType"
                        value={formData.userType}
                        onChange={(e) => upd({ userType: e.target.value })}
                        className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-700/50 border-2 border-gray-200 dark:border-slate-600 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-300 cursor-pointer hover:border-gray-300 dark:hover:border-slate-500"
                        required
                      >
                        <option value="normal">Onlooker</option>
                        <option value="community">Community User</option>
                        <option value="expert">Expert User</option>
                      </select>
                    </div>

                    {/* Email */}
                    <Field label="Email Address" id="email" type="email" icon={Mail} value={formData.email} onChange={handleInput} placeholder="you@example.com" required />

                    {/* Tabs */}
                    <div className="bg-gray-100 dark:bg-slate-800/50 p-1.5 rounded-xl border border-gray-200 dark:border-slate-700 relative">
                      <div className="grid grid-cols-2 gap-1 relative">
                        <motion.div className="absolute h-[calc(100%-8px)] top-1 bg-white dark:bg-slate-700 rounded-lg shadow-md"
                          initial={false}
                          animate={{ x: ui.loginMethod === 'password' ? 4 : 'calc(100% + 4px)', width: 'calc(50% - 8px)' }}
                          transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        />
                        {[
                          { id: 'password', icon: Lock, label: 'Password' },
                          { id: 'face', icon: Camera, label: 'Face ID' }
                        ].map(m => {
                          const Icon = m.icon;
                          return (
                            <button key={m.id} type="button" onClick={() => updUi({ loginMethod: m.id })} className={`relative z-10 flex items-center justify-center px-4 py-2.5 rounded-lg text-sm font-medium ${ui.loginMethod === m.id ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-slate-400'}`}>
                              <Icon className="w-4 h-4" /><span className="ml-2">{m.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Password or Face */}
                    <AnimatePresence mode="wait">
                      {ui.loginMethod === 'password' ? (
                        <motion.div key="pw" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }} transition={{ duration: 0.18 }}>
                          <Field
                            label="Password"
                            id="password"
                            type={ui.showPassword ? "text" : "password"}
                            icon={Lock}
                            value={formData.password}
                            onChange={handleInput}
                            placeholder="Enter your password"
                            required
                            rightElem={
                              <button type="button" onClick={() => updUi({ showPassword: !ui.showPassword })} className="text-gray-400 dark:text-slate-400 hover:text-gray-600 dark:hover:text-white transition-colors">
                                {ui.showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                              </button>
                            }
                          />
                        </motion.div>
                      ) : (
                        <motion.div key="face" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }} className="space-y-3" transition={{ duration: 0.18 }}>
                          <label className="block text-gray-700 dark:text-slate-300 text-sm font-medium">Face Authentication</label>
                          <motion.button type="button" onClick={() => setUi(prev => ({ ...prev, face: { ...prev.face, open: !prev.face.open } }))} className="w-full px-4 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-xl flex items-center justify-center space-x-2 shadow-lg transition-all duration-300" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                            <Camera className="w-5 h-5" /><span>{ui.face.image ? 'Update Face' : 'Capture Face'}</span>
                          </motion.button>

                          <AnimatePresence>
                            {ui.face.open && (
                              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="p-4 bg-white dark:bg-slate-800 rounded-xl border-2 border-gray-200 dark:border-slate-600">
                                <FaceCapture onCapture={handleFaceCapture} onError={(err)=>toast.error("Face capture failed: "+err)} mode="both" captureButtonText="Capture" uploadButtonText="Upload Photo"/>
                              </motion.div>
                            )}
                          </AnimatePresence>

                          {ui.face.image && <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-800 rounded-xl"><p className="text-sm text-blue-700 dark:text-blue-300 flex items-center space-x-2"><Camera className="w-4 h-4" /><span>Face captured! Ready to sign in.</span></p></div>}
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Buttons */}
                    <div className="space-y-3">
                      <motion.button type="submit" disabled={ui.loading} className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold py-3.5 rounded-xl flex items-center justify-center space-x-2 shadow-lg" whileHover={{ scale: ui.loading ? 1 : 1.02 }}>
                        {ui.loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : (<><LogIn className="w-5 h-5" /><span>Sign In</span></>)}
                      </motion.button>

                      <motion.button type="button" onClick={handleGuestLogin} disabled={ui.loading} className="w-full bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-300 py-3 rounded-xl flex items-center justify-center space-x-2 border-2 border-gray-200 dark:border-slate-600" whileHover={{ scale: ui.loading ? 1 : 1.01 }}>
                        <Eye className="w-5 h-5" /><span>Continue as Guest</span>
                      </motion.button>
                    </div>
                  </form>

                  {/* Footer Links */}
                  <div className="pt-4 border-t border-gray-200 dark:border-slate-700 text-center space-y-2">
                    <p className="text-gray-600 dark:text-slate-400 text-sm">Don't have an account? <Link to="/signup" className="text-blue-600 dark:text-blue-400 inline-flex items-center space-x-1"><UserPlus className="w-4 h-4"/><span>Create Account</span></Link></p>
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

export default LoginForm;
