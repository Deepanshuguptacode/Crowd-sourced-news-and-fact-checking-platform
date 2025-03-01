import { useState } from 'react'
import './App.css'
import Login from './components/Login';
import Header from './components/Header';
import NewsFeed from './components/NewsFeed';
import Sidebar from './components/Sidebar';
import Footer from './components/Footer';
import RightBar from './components/RightBar';
import SignupForm from './components/SignupForm';
import LoginForm from './components/LoginForm';


function App() {
  const [count, setCount] = useState(0);

  return (
  <div>
    <Login/>
  </div>
  )
}

export default App
