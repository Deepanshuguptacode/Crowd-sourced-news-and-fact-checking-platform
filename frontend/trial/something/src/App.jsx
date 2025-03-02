import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import './App.css';
import Login from './components/Login';
import Header from './components/Header';
import NewsFeed from './components/NewsFeed';
import Sidebar from './components/Sidebar';
import Footer from './components/Footer';
import RightBar from './components/RightBar';
import NewsSubmissionForm from './components/NewsSubmissionForm';



function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={<Login />} />
        <Route path="/home" element={
          <div>
            <Header />
            <div className="flex">
              <RightBar />
              <NewsFeed />
              <Sidebar />
            </div>
            <Footer />
          </div>
        } />
        <Route path="/submit-news" element={<NewsSubmissionForm />} />
      </Routes>
    </Router>
  );
}

export default App;