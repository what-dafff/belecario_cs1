import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useState } from "react";
import Login from "./Login";
import Dashboard from "./Dashboard";
import ResidentProfile from "./Profile";
import Residents from "./Residents";
import Home from "./Home";
import Header from "./Header";
import Sidebar from "./Sidebar";
import Reports from "./Reports";
import "./App.css";

function ProtectedRoute({ children }) {
  const token = localStorage.getItem("token");
  return token ? children : <Navigate to="/login" replace />;
}

function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [dashboardRefresh, setDashboardRefresh] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const refreshDashboard = () => {
    setDashboardRefresh((prev) => !prev);
  };


  return (
    <Router>
      <Routes>
        {/* Public Route */}
        <Route path="/login" element={<Login />} />

        {/* Protected Routes */}
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <div className="grid-container">
                <Header toggleSidebar={toggleSidebar} />
                <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
                <div className={`content ${isSidebarOpen ? "content-shift" : ""}`}>
                  <div className="main-content">
                    <Routes>                   
                      <Route path="/home" element={<Home />} />          
                      <Route path="/dashboard" element={<Dashboard refresh={dashboardRefresh} />} />
                      <Route path="/" element={<Navigate to="/home" replace />} />
                      <Route path="/residents" element={<Residents onResidentDelete={refreshDashboard} />} />
                      <Route path="/profile/:id" element={<ResidentProfile />} />   
                      <Route path="/reports" element={<Reports />} />   
                    </Routes>
                  </div>
                </div>
              </div>
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
