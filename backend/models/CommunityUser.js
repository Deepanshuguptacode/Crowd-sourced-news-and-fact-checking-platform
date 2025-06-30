import mongoose from "mongoose";

const communityUserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  username: {
    type: String,
    required: true,
    unique: true,
  },
  role: {
    type: String,
    default: 'Community', // Should be 'Community'
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  isApproved: {
    type: Boolean,
    default: false, // Admin approval required
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const CommunityUser = mongoose.model('CommunityUser', communityUserSchema);
export default CommunityUser;