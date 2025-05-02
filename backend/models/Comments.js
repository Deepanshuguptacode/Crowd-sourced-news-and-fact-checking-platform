// models/expertComment.js
import mongoose from "mongoose";

const expertCommentSchema = new mongoose.Schema({
  newsId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'News',
    required: true,
  },
  expert: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ExpertUser',
    required: true,
  },
  comment: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});


const communityCommentSchema = new mongoose.Schema({
  newsId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'News',
    required: true,
  },
  commenter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CommunityUser',
    required: true,
  },
  comment: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});




export  const CommunityComment = mongoose.model('CommunityComment', communityCommentSchema);
export const ExpertComment = mongoose.model('ExpertComment', expertCommentSchema);
