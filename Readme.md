# Crowd-Sourced News & Fact-Checking Platform

## **Overview**
This project is a robust crowd-sourced news and fact-checking platform designed to combat misinformation and provide verified news to the public. By combining user participation, expert validation, and advanced AI technologies, the platform ensures accurate and reliable information dissemination.

### **Key Features**
- **User Roles**:
  - **Normal Users**: Upload news articles with screenshots and descriptions for fact-checking, and view all discussions.
  - **Community Users**: Vote on the validity of news and participate in discussions. Requires admin approval to join.
  - **Expert Users**: Provide expert opinions after admin verification. Experts must be journalists.
  
- **News Verification**:
  - Users upload news articles and screenshots for fact-checking.
  - AI-powered analysis flags potential misinformation.

- **Voting System**:
  - Community users vote to validate news authenticity.

- **Comment System**:
  - Community users and expert users provide insights and engage in discussions.

- **AI Integration**:
  - AI algorithms analyze news content and highlight potentially manipulative articles.

### **Tech Stack**
- **Backend**: Node.js with Express.js
- **Database**: MongoDB
- **Authentication**: JWT (JSON Web Tokens)
- **File Uploads**: Multer
- **AI Analysis**: (Integration-ready for external AI models)

### **Setup Instructions**
1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/dbms-news-platform.git
   ```
2. Navigate to the project directory:
   ```bash
   cd dbms-news-platform
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Configure environment variables in `.env`:
   ```plaintext
   MONGO_URI=<your-mongodb-connection-string>
   JWT_SECRET=<your-secret-key>
   ```
5. Start the server:
   ```bash
   npm start
   ```
6. Access the platform at `http://localhost:3000`.

### **Future Enhancements**
- Advanced AI models for automated fact-checking.
- Notifications for news updates and discussions.
- A comprehensive dashboard for admins.

---

## **Short Description for Recruiters**
Developed a dynamic crowd-sourced news and fact-checking platform to combat misinformation using a multi-role user system (Normal, Community, and Expert users). The platform includes AI-powered analysis, a robust voting system, and expert validations, ensuring the delivery of verified and accurate news. Built with Node.js, Express.js, MongoDB, and JWT for authentication, it showcases a blend of innovation and technical expertise in backend development. Actively expanding the platform with AI integrations for enhanced credibility.