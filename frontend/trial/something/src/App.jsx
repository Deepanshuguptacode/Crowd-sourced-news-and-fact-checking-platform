import { useState } from 'react'
import './App.css'
import Header from './components/Header';
import NewsFeed from './components/NewsFeed';
import Sidebar from './components/Sidebar';
import Footer from './components/Footer';
import RightBar from './components/RightBar';


function App() {
  const [count, setCount] = useState(0);

  return (
    <div className="flex flex-col items-center bg-gray-100 min-h-screen">
    <Header />
    <div className="flex w-full h-full">
      <div className="w-1/5 h-full ml-10 flex justify-center">
        <RightBar />
      </div>
      <div className="w-4/5 h-full mr-10">
        <NewsFeed/>
      </div>
      
    </div>
    <Footer />
  </div>
  )
}

export default App
