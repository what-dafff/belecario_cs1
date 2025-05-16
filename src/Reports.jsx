import { useEffect, useState } from "react";
import { 
  BarChart, Bar, PieChart, Pie, Tooltip, Legend, XAxis, YAxis, ResponsiveContainer, Cell 
} from "recharts";
import axios from "axios";
import "../component/Reports.css";

const API_URL = "http://localhost:5000/reports";

export default function Reports() {
  const [reportData, setReportData] = useState({
    totalResidents: 0,
    genderData: [],
    ageGroupData: [],
    purokData: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(API_URL);
      setReportData(response.data);
    } catch (error) {
      console.error("Error fetching reports:", error);
      setError("Failed to load reports. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const COLORS = ["#0088FE", "#FFBB28", "#FF8042", "#00C49F", "#A28BFA", "#FF6384"];

  return (
    <main className="maincontainer">
      <div className="maintitle">
        <h3>REPORTS & ANALYTICS</h3>
        <button className="refresh-btn" onClick={fetchReports}>Refresh</button>
      </div>

      {loading ? (
        <p className="loading-text">Loading reports...</p>
      ) : error ? (
        <p className="error-text">{error}</p>
      ) : (
        <div className="reports-container">
          <div className="cards">
            <h3>Total Residents</h3>
            <h2 className="large-text">{reportData.totalResidents}</h2>
          </div>

          {reportData.genderData.length > 0 && (
            <div className="chart-cards">
              <h3>Gender Distribution</h3>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={reportData.genderData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80}>
                    {reportData.genderData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}

          {reportData.ageGroupData.length > 0 && (
            <div className="chart-cards">
              <h3>Age Group Distribution</h3>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={reportData.ageGroupData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80}>
                    {reportData.ageGroupData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}

          {reportData.purokData.length > 0 && (
            <div className="chart-cards">
              <h3>Residents by Purok</h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={reportData.purokData}>
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="residents" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}
    </main>
  );
}
