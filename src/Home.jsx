import React, { useState } from "react";
import "./Home.css";

const Home = () => {
  const [activeSection, setActiveSection] = useState(null);

  const toggleSection = (section) => {
    setActiveSection(activeSection === section ? null : section);
  };

  return (
    <main className="main_container">
      <div className="main_title">
        <h3>HOME</h3>
      </div>

      <div className="content-wrapper">
        {/* Left Section: Buttons & Info */}
        <div className="left-section">
          <div className="button-container">
            <button onClick={() => toggleSection("officials")}>Barangay Officials</button>
            <button onClick={() => toggleSection("hotlines")}>Emergency Hotlines</button>
            <button onClick={() => toggleSection("about")}>About Barangay</button>
          </div>

          <div className="content-section">
            {activeSection === "officials" && (
              <div className="info-box">
                <h3>Barangay Officials</h3>
                <ul>
                  <li><strong>Captain:</strong> Juan Dela Cruz</li>
                  <li><strong>Kagawad:</strong> Jose Ramos</li>
                  <li><strong>Kagawad:</strong> Ana Fernandez</li>
                  <li><strong>SK Chairman:</strong> Luis Martinez</li>
                  <li><strong>Secretary:</strong> Angela Mendoza</li>
                  <li><strong>Treasurer:</strong> Roberto Cruz</li>
                </ul>
              </div>
            )}

            {activeSection === "hotlines" && (
              <div className="info-box">
                <h3>Emergency Hotlines</h3>
                <ul>
                  <li><strong>Barangay Hall:</strong> (063) 221-1234</li>
                  <li><strong>Police Station:</strong> (063) 221-5678</li>
                  <li><strong>Fire Department:</strong> (063) 221-9101</li>
                  <li><strong>Ambulance:</strong> (063) 221-4321</li>
                  <li><strong>Disaster Response:</strong> 0932-456-7890</li>
                </ul>
              </div>
            )}

            {activeSection === "about" && (
              <div className="info-box">
                <h3>Barangay San Miguel</h3>
                <p>
                  Barangay San Miguel is one of the vibrant communities in Iligan City, known for its
                  strong local governance, active community participation, and rich cultural heritage.
                  The barangay aims to provide excellent public service, ensure safety and security,
                  and promote socio-economic development for its residents.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right Section: Map */}
        <div className="map-container">
          <iframe 
            title="Barangay San Miguel Map"
            src="https://embed.waze.com/iframe?zoom=16&lat=8.237697&lon=124.246328&ct=livemap"
            allowFullScreen
          ></iframe>
        </div>
      </div>

      {/* Footer */}
      <footer className="footer">
        <p>&copy; {new Date().getFullYear()} Barangay San Miguel. All Rights Reserved.</p>
      </footer>
    </main>
  );
};

export default Home;
