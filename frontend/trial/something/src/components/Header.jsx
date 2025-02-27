import React from 'react'

const Header = () => {
  return (
    <header className="w-full bg-gray-800 text-white p-4 flex justify-between items-center">
      <h1 className="text-xl font-bold">Crowd-Sourced News</h1>
      <input
        type="text"
        placeholder="Search news..."
        className="p-2 rounded text-black w-60"
      />

    </header>
  )
}

export default Header;
