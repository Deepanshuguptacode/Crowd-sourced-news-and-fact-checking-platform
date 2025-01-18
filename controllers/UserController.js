const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Import Models
const NormalUser = require('../models/NormalUser');
const CommunityUser = require('../models/CommunityUser');
const ExpertUser = require('../models/ExpertUser');

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

    res.status(200).json({ message: "Login successful!", token });
  } catch (error) {
    res.status(500).json({ message: "Login failed!", error: error.message });
  }
};

// Export Functions
module.exports = {
  normalUserSignup: (req, res) => signup(req, res, NormalUser),
  communityUserSignup: (req, res) => signup(req, res, CommunityUser),
  expertUserSignup: (req, res) => signup(req, res, ExpertUser),
  normalUserLogin: (req, res) => login(req, res, NormalUser),
  communityUserLogin: (req, res) => login(req, res, CommunityUser),
  expertUserLogin: (req, res) => login(req, res, ExpertUser),
};
