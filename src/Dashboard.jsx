import React, { useEffect, useState } from "react";
import axios from "axios";
import { BsPeopleFill, BsGenderFemale, BsGenderMale } from "react-icons/bs";
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMoon, faCross } from "@fortawesome/free-solid-svg-icons";
import "./App.css";

const API_URL = "http://localhost:5000/dashboard";

function Dashboard({ refresh }) {
  const [dashboard, setDashboard] = useState({
    totalResidents: 0,
    totalMales: 0,
    totalFemales: 0,
    totalChristians: 0,
    totalIslams: 0,
    purokData: [], 
  });

  const fetchDashboard = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(API_URL, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setDashboard({
        totalResidents: response.data.totalResidents,
        totalMales: response.data.totalMales,
        totalFemales: response.data.totalFemales,
        totalChristians: response.data.totalChristians,
        totalIslams: response.data.totalIslams,
        purokData: response.data.purokData || [],
      });
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, [refresh]);

  return (
    <main className="main-container">
      <div className="main-title">
        <h3>DASHBOARD</h3>
      </div>

      <div className="main-cards">
        <div className="card">
          <div className="card-inner">
            <h3>RESIDENTS</h3>
            <BsPeopleFill className="card_icon" />
          </div>
          <h2>{dashboard.totalResidents}</h2>
        </div>

        <div className="card">
          <div className="card-inner">
            <h3>MALE</h3>
            <BsGenderMale className="card_icon" />
          </div>
          <h2>{dashboard.totalMales}</h2>
        </div>

        <div className="card">
          <div className="card-inner">
            <h3>FEMALE</h3>
            <BsGenderFemale className="card_icon" />
          </div>
          <h2>{dashboard.totalFemales}</h2>
        </div>

        <div className="card">
          <div className="card-inner">
            <h3>CHRISTIANITY</h3>
            <FontAwesomeIcon icon={faCross} className="card_icon" />
          </div>
          <h2>{dashboard.totalChristians}</h2>
        </div>
        <div className="card">
          <div className="card-inner">
            <h3>ISLAM</h3>
            <FontAwesomeIcon icon={faMoon} className="card_icon" />
          </div>
          <h2>{dashboard.totalIslams}</h2>
        </div>
      </div>

      <div className="chart-container">
        <h3>Residents per Purok</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={dashboard.purokData}>
            <XAxis dataKey="purok" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="residents" fill="#8884d8" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </main>
  );
}

export default Dashboard;
