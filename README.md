# 🗞️ VoxVeritas - Crowd-Sourced News Verification Platform

A comprehensive platform for crowd-sourced news verification and fact-checking, powered by AI and community collaboration.

![Platform Status](https://img.shields.io/badge/status-active-brightgreen)
![Node.js](https://img.shields.io/badge/node.js-v18+-green)
![React](https://img.shields.io/badge/react-v18+-blue)
![Python](https://img.shields.io/badge/python-v3.9+-yellow)

---

## 🚀 Quick Start

### **Single Command Launch** (Easiest Way!)

**PowerShell (Recommended):**
```powershell
.\start-all-services.ps1
```

**Batch File (Alternative):**
```cmd
start-all-services.bat
```

Or double-click `start-all-services.bat` in Windows Explorer!

This will automatically start:
- ✅ Backend API (Node.js) on port 5001
- ✅ Face Recognition (Python) on port 5000
- ✅ Frontend (React/Vite) on port 5173

**Access the Platform:**
- 🌐 **Frontend**: http://localhost:5173
- 📡 **Backend API**: http://localhost:5001
- 🔐 **Face Recognition**: http://127.0.0.1:5000

📖 **Full Guide**: See [QUICK_START_GUIDE.md](QUICK_START_GUIDE.md) for detailed instructions

---

## ✨ Key Features

### 🔐 Advanced Face Authentication
- **Face Login**: Secure login using facial recognition
- **Similarity Score**: See exact match confidence (e.g., "87.3% match")
- **Duplicate Prevention**: Automatic detection of existing faces (60% threshold)
- **InsightFace AI**: State-of-the-art face recognition technology

### 📰 News Verification System
- Submit news articles for verification
- Community voting and fact-checking
- Expert analysis and AI verdict
- Trending news detection
- Real-time comments and discussions

### 💬 Debate Rooms
- Create topic-based debate rooms
- Real-time messaging
- Stance-based discussions (Support/Oppose/Neutral)
- Expert moderation

### 👥 User Types
- **Onlookers**: Read and vote on news
- **Community Users**: Submit and verify news
- **Expert Users**: Provide professional fact-checking
- **Guest Mode**: Browse without account

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                  VoxVeritas Platform                    │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │   Frontend   │  │   Backend    │  │     Face     │ │
│  │  React/Vite  │→→│   Node.js    │→→│ Recognition  │ │
│  │  Port: 5173  │  │  Port: 5001  │  │  Port: 5000  │ │
│  │              │  │              │  │   Python     │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
│         ↓                  ↓                  ↓         │
│  ┌──────────────────────────────────────────────────┐  │
│  │            MongoDB Database (Atlas)              │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

---

## 📁 Project Structure

```
Crowd-sourced-news-and-fact-checking-platform/
│
├── frontend/                    # React Frontend (Vite)
│   ├── src/
│   │   ├── components/         # Reusable components
│   │   │   └── FaceCapture.jsx # Face capture component
│   │   ├── pages/              # Page components
│   │   │   ├── LoginForm.jsx
│   │   │   └── SignupForm.jsx
│   │   └── services/           # API services
│   └── package.json
│
├── backend/                     # Node.js Backend (Express)
│   ├── index.js                # Main server file
│   ├── routes/                 # API routes
│   └── package.json
│
├── Face-authorization-System/   # Python Face Recognition
│   ├── deferred-app.py         # Flask API server
│   ├── templates/              # HTML templates (standalone system)
│   └── requirements.txt
│
├── start-all-services.ps1      # PowerShell launcher
├── start-all-services.bat      # Batch file launcher
├── QUICK_START_GUIDE.md        # Detailed setup guide
└── ENHANCEMENT_COMPLETE_SUMMARY.md  # Recent changes
```

---

## 🛠️ Technologies Used

### Frontend
- **React 18** - UI library
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Styling
- **React Router** - Navigation
- **Axios** - HTTP client
- **React Toastify** - Notifications
- **Lucide React** - Icons

### Backend
- **Node.js** - Runtime
- **Express** - Web framework
- **MongoDB** - Database (Atlas)
- **Mongoose** - ODM
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **CORS** - Cross-origin support

### Face Recognition
- **Python 3.9+** - Runtime
- **Flask** - Web framework
- **InsightFace** - Face recognition AI
- **OpenCV** - Image processing
- **NumPy** - Numerical computing
- **pymongo** - MongoDB driver

---

## 📋 Prerequisites

### Required Software
- **Node.js** v18+ ([Download](https://nodejs.org/))
- **Python** 3.9+ ([Download](https://www.python.org/))
- **MongoDB Atlas** account ([Sign up](https://www.mongodb.com/cloud/atlas))
- **Git** (for cloning repository)

### System Requirements
- **OS**: Windows 10/11 (scripts are Windows-optimized)
- **RAM**: 4GB+ recommended
- **Storage**: 2GB+ free space
- **Internet**: Required for MongoDB Atlas and AI models

---

## 🔧 Installation

### 1. Clone Repository
```bash
git clone https://github.com/yourusername/Crowd-sourced-news-and-fact-checking-platform.git
cd Crowd-sourced-news-and-fact-checking-platform
```

### 2. Install Node.js Dependencies
```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
cd ..
```

### 3. Install Python Dependencies
```bash
cd Face-authorization-System
pip install -r requirements.txt
cd ..
```

### 4. Configure Environment Variables

**Backend** (`backend/.env`):
```env
MONGODB_URI=your_mongodb_atlas_connection_string
JWT_SECRET=your_secret_key
PORT=5001
```

### 5. Start All Services
```powershell
.\start-all-services.ps1
```

---

## 🎯 Recent Enhancements

### ✅ Version 1.0 Features (Latest)

1. **Debug Code Cleanup**
   - Removed all debug console logs
   - Clean, production-ready code
   - Better performance

2. **Login Similarity Score Display**
   - Shows face match percentage during login
   - Example: "Face login successful! Match: 87.3%"
   - Builds user trust and transparency

3. **Duplicate Face Detection**
   - Prevents duplicate accounts with same face
   - 60% similarity threshold
   - Shows existing username if duplicate found
   - Example: "This face is already registered! Match: 85.2% with user: john_doe"

4. **Unified Service Launcher**
   - Single command to start all services
   - Automatic port conflict resolution
   - Status checks and reporting
   - Two options: PowerShell and Batch file

📄 **Full Details**: See [ENHANCEMENT_COMPLETE_SUMMARY.md](ENHANCEMENT_COMPLETE_SUMMARY.md)

---

## 🧪 Testing

### Manual Testing
1. **Start Services**:
   ```powershell
   .\start-all-services.ps1
   ```

2. **Test Face Login**:
   - Go to http://localhost:5173/login
   - Select "Face ID" method
   - Capture face and submit
   - **Expected**: Similarity score displayed

3. **Test Duplicate Detection**:
   - Sign up with face authentication
   - Try signing up again with same face
   - **Expected**: Error showing duplicate detected

### API Testing
- **Backend Health**: http://localhost:5001/
- **Face API Status**: http://127.0.0.1:5000/api/status

---

## 📚 Documentation

- [QUICK_START_GUIDE.md](QUICK_START_GUIDE.md) - Complete setup and usage guide
- [ENHANCEMENT_COMPLETE_SUMMARY.md](ENHANCEMENT_COMPLETE_SUMMARY.md) - Recent changes and features
- [backend/README.md](backend/README.md) - Backend API documentation
- [frontend/README.md](frontend/README.md) - Frontend architecture
- [Face-authorization-System/README.md](Face-authorization-System/README.md) - Face recognition system

---

## 🐛 Troubleshooting

### Ports Already in Use
The PowerShell script automatically handles this. For manual fixing:
```powershell
# Check what's using port 5173
Get-NetTCPConnection -LocalPort 5173

# Kill process
Stop-Process -Id <PID> -Force
```

### Face Recognition Not Loading
```bash
pip install insightface onnxruntime opencv-python
```

### Frontend Build Errors
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
```

### MongoDB Connection Issues
- Verify connection string in `backend/.env`
- Check IP whitelist in MongoDB Atlas (0.0.0.0/0 for development)
- Ensure database user has read/write permissions

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👨‍💻 Author

**Your Name**
- GitHub: [@yourusername](https://github.com/yourusername)
- Email: your.email@example.com

---

## 🙏 Acknowledgments

- **InsightFace** - Face recognition AI models
- **MongoDB Atlas** - Cloud database service
- **React Team** - UI framework
- **Vite Team** - Build tool
- **Express Team** - Backend framework

---

## 🔮 Future Roadmap

- [ ] Mobile app (React Native)
- [ ] Real-time notifications
- [ ] Advanced analytics dashboard
- [ ] Multi-language support
- [ ] Social media integration
- [ ] Chrome extension for quick fact-checking
- [ ] Blockchain-based verification records

---

## 📞 Support

Need help? Here's how to get support:

1. **Check Documentation**: Read the guides in this repository
2. **Service Logs**: Check the three PowerShell windows for error logs
3. **GitHub Issues**: Open an issue on GitHub
4. **Email Support**: your.email@example.com

---

## ⭐ Show Your Support

If you find this project useful, please consider:
- ⭐ Starring the repository
- 🐛 Reporting bugs
- 💡 Suggesting new features
- 🤝 Contributing to the code

---

<div align="center">

**Made with ❤️ for Truth and Transparency**

[Report Bug](https://github.com/yourusername/repo/issues) · [Request Feature](https://github.com/yourusername/repo/issues) · [Documentation](QUICK_START_GUIDE.md)

</div>
