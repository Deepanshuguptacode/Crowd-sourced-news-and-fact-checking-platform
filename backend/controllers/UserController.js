
// Import Models
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import NormalUser from '../models/NormalUser.js';
import CommunityUser from '../models/CommunityUser.js';
import ExpertUser from '../models/ExpertUser.js'
// JWT Secret Key
const JWT_SECRET = "RAM"; // Replace with a secure secret key

// Signup Function
const signup = async (req, res, UserModel) => {
  try {
    const { name,username, email, password, profession } = req.body;
    // Check if user already exists
    const existingUser = await UserModel.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists!" });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create a new user
    const newUser = new UserModel({
      name,
      username,
      email,
      password: hashedPassword,
      ...(profession && { profession }), // Include profession for ExpertUser
    });

    await newUser.save();
      // Generate JWT
      const token = jwt.sign(
        { id: newUser._id, email: newUser.email, role: UserModel.modelName },
        JWT_SECRET,
        { expiresIn: "1d" }
      );
      res.cookie("token", token, {
        httpOnly: true,
        // secure: process.env.NODE_ENV === 'production', // true in production
        maxAge: 24 * 60 * 60 * 1000, // 1 day in milliseconds
      });
    res.status(201).json({ message: "User registered successfully!" });
  } catch (error) {
    res.status(500).json({ message: "Signup failed!", error: error.message });
  }
};

// Login Function
const login = async (req, res, UserModel) => {
  try {
    const { email, password } = req.body;

    // Check if user exists
    const user = await UserModel.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "User does not exist!" });
    }

    // Compare passwords
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid credentials!" });
    }

    // Generate JWT
    const token = jwt.sign(
      { id: user._id, email: user.email, role: UserModel.modelName },
      JWT_SECRET,
      { expiresIn: "1d" }
    );
    res.cookie("token", token, {
      httpOnly: true,
      // secure: process.env.NODE_ENV === 'production', // true in production
      maxAge: 24 * 60 * 60 * 1000, // 1 day in milliseconds
    });

    res.status(200).json({ message: "Login successful!", token });
  } catch (error) {
    res.status(500).json({ message: "Login failed!", error: error.message });
  }
};

// Export Functions
// module.exports = {
//   normalUserSignup: (req, res) => signup(req, res, NormalUser),
//   communityUserSignup: (req, res) => signup(req, res, CommunityUser),
//   expertUserSignup: (req, res) => signup(req, res, ExpertUser),
//   normalUserLogin: (req, res) => login(req, res, NormalUser),
//   communityUserLogin: (req, res) => login(req, res, CommunityUser),
//   expertUserLogin: (req, res) => login(req, res, ExpertUser),
// };

// Export Functions (ESM syntax)
export const normalUserSignup = (req, res) => signup(req, res, NormalUser);
export const communityUserSignup = (req, res) => signup(req, res, CommunityUser);
export const expertUserSignup = (req, res) => signup(req, res, ExpertUser);
export const normalUserLogin = (req, res) => login(req, res, NormalUser);
export const communityUserLogin = (req, res) => login(req, res, CommunityUser);
export const expertUserLogin = (req, res) => login(req, res, ExpertUser);
