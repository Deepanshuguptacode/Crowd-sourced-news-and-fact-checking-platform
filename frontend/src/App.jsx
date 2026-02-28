import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import Login from './components/Login';
import SignupForm from './pages/SignupForm';
import Header from './components/Header';
import NewsFeed from './components/NewsFeed';
import Sidebar from './components/Sidebar';
import Footer from './components/Footer';
import RightBar from './components/RightBar';
import NewsSubmissionForm from './pages/NewsSubmissionForm';
import HomePage from './pages/HomePage';
import LandingPage from './pages/LandingPage';
import TrendingPage from './pages/TrendingPage';
import ExpertsPage from './pages/ExpertsPage';
import ProfilePage from './pages/ProfilePage';
import DebateRoomsList from './pages/DebateRoomsList';
import DebateRoom from './pages/DebateRoom';
import AdvancedDebateRoom from './components/AdvancedDebateRoom';
import TestAccuracy from './pages/TestAccuracy';
import AdminLogin from './pages/AdminLogin';
import AdminSignup from './pages/AdminSignup';
import ProtectedRoute from './components/ProtectedRoute';
import { UserProvider } from './context/userContext';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import TourProvider from './components/TourProvider';

function App() {
  return (
    <UserProvider>
      <Router>
        <TourProvider>
          <div className="App">
            <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<SignupForm />} />
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin/signup" element={<AdminSignup />} />
            <Route 
              path="/home" 
              element={
                <ProtectedRoute>
                  <HomePage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/submit-news" 
              element={
                <ProtectedRoute allowedUserTypes={['normal', 'community', 'expert', 'admin']}>
                  <NewsSubmissionForm />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/profile" 
              element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/trending" 
              element={
                <ProtectedRoute>
                  <TrendingPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/experts" 
              element={
                <ProtectedRoute>
                  <ExpertsPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/debate-rooms" 
              element={
                <ProtectedRoute>
                  <DebateRoomsList />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/debate-room/:roomId" 
              element={
                <ProtectedRoute>
                  <DebateRoom />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/advanced-debate-room/:roomId" 
              element={
                <ProtectedRoute>
                  <AdvancedDebateRoom />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/test-accuracy" 
              element={
                <ProtectedRoute>
                  <TestAccuracy />
                </ProtectedRoute>
              } 
            />
            {/* Redirect any unknown paths to home */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          <ToastContainer
            position="top-right"
            autoClose={3000}
            hideProgressBar={false}
            newestOnTop={false}
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme="colored"
          />
          </div>
        </TourProvider>
      </Router>
    </UserProvider>
  );
}

export default App;