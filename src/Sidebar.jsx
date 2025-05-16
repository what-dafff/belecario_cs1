import React from "react";
import { BsGrid1X2Fill, BsHouseFill, BsPeopleFill, BsJustify, BsBoxArrowLeft, BsFileBarGraphFill} from "react-icons/bs";
import { Link } from "react-router-dom";
import "./App.css";

  //to handle logout
  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.href = "/login"; 
  };

function Sidebar({ isOpen, toggleSidebar,  }) {
  return (
    <aside id="sidebar" className={`sidebar ${isOpen ? "sidebar-responsive" : ""}`}>
      <div className="sidebar-title">
        <div className="sidebar-brand">
          <img src="/images/sanmiguel_logo.jpg" className="icon-header" alt="Logo" />
          <span>BRGY. SAN MIGUEL</span>
        </div>
        <div>
        </div>
      </div>

      <ul className="sidebar-list">
        <li className="sidebar-list-item">
          <Link to="/home"  title="Home">
            <BsHouseFill className="icon" /> Home
          </Link>
        </li>
        <li className="sidebar-list-item">
          <Link to="/dashboard"  title= "Dashboard">
            <BsGrid1X2Fill className="icon" /> Dashboard
          </Link>
        </li>
        <li className="sidebar-list-item">
          <Link to="/residents" title="Residents">
            <BsPeopleFill className="icon" /> Residents
          </Link>
        </li>
        <li className="sidebar-list-item">
          <Link to="/reports" title="Reports">
            <BsFileBarGraphFill className="icon" /> Reports & Analytics
          </Link>
        </li>
        <li className="sidebar-list-item">
          <Link to="/login" onClick={handleLogout} title="Logout">
            <BsBoxArrowLeft className="icon" /> Logout
          </Link>
        </li>
      </ul>
    </aside>
  );
}

export default Sidebar;
