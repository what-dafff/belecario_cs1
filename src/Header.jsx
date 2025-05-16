import React from 'react'
import {BsJustify, BsBoxArrowRight} from 'react-icons/bs'
import './App.css'


  //to handle logout
  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.href = "/login"; 
  };

function Header({toggleSidebar}) {
  return (
    <header className='header'>
        <div className='menu-icon'>
            <BsJustify className='icon' onClick={toggleSidebar}/>
        </div>
        <div className='header-right'>
            <button onClick={handleLogout} className='logout-btn' title='Logout'>
            <BsBoxArrowRight className='icon'/>
            </button>
        </div>
    </header>
  )
}

export default Header
