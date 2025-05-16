import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import "react-toastify/dist/ReactToastify.css";
import { BsFilePlus, BsPersonPlus, BsTrash, BsQrCodeScan, BsDownload} from "react-icons/bs";
import { FaEye } from "react-icons/fa";
import Modal from "react-modal";
import QRCode from 'react-qr-code';
import {toPng} from "html-to-image";
import "./App.css";

const API_URL = "http://localhost:5000/residents";

Modal.setAppElement("#root");

function Residents() {
  const [residents, setResidents] = useState([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [residentToDelete, setResidentToDelete] = useState(null);
  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);
  const [idError, setIdError] = useState(false);
  const [selectedResidents, setSelectedResidents] = useState([]);
  const [selectAll, setSelectAll] = useState(false); 
  const [showModal, setShowModal] = useState(false);
  const [selectedResident, setSelectedResident] = useState(null); 
  const [newResident, setNewResident] = useState({
    id: "",
    name: "",
    age: "",
    purok: "",
    birthdate: "",
    contactNumber: "",
    householdNumber: "",
    occupation: "",
    civilStatus: "",
    sex: "",
  });

  const navigate = useNavigate();

  useEffect(() => {
    fetchResidents();
  }, []);

  const fetchResidents = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(API_URL, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const residents = response.data.residents || response.data;
      const formattedResidents = residents.map((resident) => {
        if (resident.birthdate) {
          resident.birthdate = new Date(resident.birthdate).toISOString().split("T")[0];
        }
        return resident;
      });
      setResidents(formattedResidents);

      setResidents(response.data.residents || response.data);
    } catch (error) {
      console.error("Error fetching residents:", error);
      toast.error("Failed to fetch residents!");
    }
  };

  const openAddModal = () => {
    setIsAddModalOpen(true);
  };

  const closeAddModal = () => {
    setIsAddModalOpen(false);
    setNewResident({
      id: "",
      name: "",
      age: "",
      purok: "",
      birthdate: "",
      contactNumber: "",
      householdNumber: "",
      occupation: "",
      civilStatus: "",
      sex: "",
    });
  };

  const calculateAge = (dob) => {
    if (!dob) return ""; 
    const birth = new Date(dob);
    const today = new Date();
    let calculatedAge = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
  
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      calculatedAge--;
    }
  
    return calculatedAge >= 0 ? calculatedAge : "";
  };
  
  const handleBirthdateChange = (e) => {
    const birthdate = e.target.value;
    const calculatedAge = calculateAge(birthdate);
  
    setNewResident((prevResident) => ({
      ...prevResident,
      birthdate,
      age: calculatedAge || "", 
    }));
  };
  

  const handleAddResident = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
  
    console.log("Submitted Form Data:", newResident); 
    console.log("Sending request to:", API_URL);

    // Check if ID already exists
    if (residents.some((resident) => resident.id === newResident.id)) {
      toast.error("Error: Resident ID already exists! Please use a unique ID.");
      setIdError(true);
      setTimeout(() => setIdError(false), 1000);
      return;
    } else {

      try {
        const response = await axios.post(API_URL, newResident, { 
          headers: { Authorization: `Bearer ${token}` } 
        });

        console.log("API Response:", response.data);
        toast.success("Resident added successfully!");
        
        fetchResidents();
        closeAddModal(); 

        // Reset the form after successful submission
        setNewResident({ id: "", name: "", age: "", purok: "", birthdate: "", contactNumber: "", householdNumber: "", occupation:"", civilStatus: "", sex: "",});
      } catch (error) {
        console.error("Error Response:", error.response);
        toast.error(error.response?.data?.message || "Error processing request!");
        //closeAddModal();
      }
    }
  };
  
  
const openCsvModal = () => setIsCsvModalOpen(true);
const closeCsvModal = () => setIsCsvModalOpen(false);

  const openDeleteModal = (resident) => {
    setResidentToDelete(resident);
    setIsDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setResidentToDelete(null);
    setIsDeleteModalOpen(false);
  };

  const [file, setFile] = useState(null);

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
        console.log("Selected file:", file);
        setFile(file);
    } else {
        console.log("No file selected.");
    }
    const fileType = file.type;
    if (fileType !== 'text/csv' && fileType !== 'text/plain') {
      toast.error("Please upload a valid CSV or TXT file.");
      return;
   }
  };

  const handleFileUpload = async () => {
    if (!file) {
      toast.error("No file selected. Please select a file first.");
      return;
    }
  
    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Unauthorized! Please log in.");
      return;
    }
  
    const formData = new FormData();
    formData.append("file", file); 
  
    try {
      const response = await axios.post(
        "http://localhost:5000/upload-file",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${token}`,
          },
        }
      );
  
      if (response && response.data) {
        toast.success(`${file.type === "text/csv" ? "CSV" : "TXT"} file uploaded successfully!`);
        await fetchResidents();
        setFile(null);
        closeCsvModal();
      } else {
        toast.error("Unexpected error occurred while uploading the file.");
      }
    } catch (error) {
      console.error("Error uploading file:", error.response?.data || error.message);
      toast.error(error.response?.data?.message || "Error uploading file!");
    }
  };

  const handleDeleteResident = async () => {
    const token = localStorage.getItem("token");
  
    try {
      await axios.delete(`${API_URL}/${residentToDelete.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Resident deleted successfully!");
      fetchResidents();
      closeDeleteModal();
  
      // Update state to reflect deletion
      setResidents((prevResidents) =>
        prevResidents.filter((resident) => resident.id !== residentToDelete.id)
      );

    } catch (error) {
      toast.error("Error deleting resident", error);
      closeDeleteModal();
    }
  };

  const handleSelectResident = (id) => {
    setSelectedResidents((prevSelected) =>
      prevSelected.includes(id)
        ? prevSelected.filter((residentId) => residentId !== id)
        : [...prevSelected, id]
    );
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedResidents([]);
    } else {
      setSelectedResidents(residents.map((resident) => resident.id));
    }
    setSelectAll(!selectAll);
  };

  const handleBulkDelete = async () => {
    if (selectedResidents.length === 0) {
      toast.error("No residents selected for deletion.");
      return;
    }
  
    const token = localStorage.getItem("token");
  
    try {
      await Promise.all(
        selectedResidents.map((id) =>
          axios.delete(`${API_URL}/${id}`, {
            headers: { Authorization: `Bearer ${token}` },
          })
        )
      );
  
      toast.success("Selected residents deleted successfully!");
      fetchResidents();
      setSelectedResidents([]);
      setSelectAll(false);
    } catch (error) {
      toast.error("Error deleting residents", error);
    }
  };


//for search query and sort by
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('');

  const filteredResidents = residents
  .filter((resident) => {
    if (!searchQuery) return true; 
    
  const query = searchQuery.toLowerCase();

    if (query === "male" || query === "female") {
      return resident.sex?.toLowerCase() === query;
    }

    return (
      resident.id.toString().includes(query) || 
      resident.name.toLowerCase().includes(query) 
    );
  })
    .sort((a, b) => {
      if (!sortBy) return 0;
      if (!a[sortBy] || !b[sortBy]) return 0;
      return isNaN(a[sortBy])
        ? a[sortBy].localeCompare(b[sortBy]) 
        : a[sortBy] - b[sortBy]; 
   });

   const openQrModal = () => {
    setShowModal(true);
  };

  const closeQrModal = () => {
    setShowModal(false);
    setSelectedResident(null);
  };

  const handleSelectOneResident = (resident) => {
    setSelectedResident(resident); 
    console.log('Selected Resident:', resident);
    setShowModal(false); 
  };

  //for downloading QR code
  const qrRef = useRef();
  const downloadQrCode = () => {
    if (!qrRef.current) {
      toast.error("QR code not found");
      return;
    }
  
    toPng(qrRef.current)
      .then((dataUrl) => {
        const link = document.createElement("a");
        link.download = `${selectedResident.name}-qr.png`;
        link.href = dataUrl;
        link.click();
      })
      .catch((error) => {
        console.error("Error generating image:", error);
        toast.error("Failed to download QR code.");
      });
  };  

  //for exporting data to a CSV file
  const exportCSV = async () => {
    const response = await fetch('http://localhost:5001/exportCSV');
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
  
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'residents.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };
  

  return (
    <div className="main-container">
      <div className="main-title">
        <h3>RESIDENTS</h3>
      </div>

      <div>
        <div style={{color:"gray", alignItems:"center", display: "flex", marginTop: "20px"}}>
        <input 
          type="text" 
          placeholder="Search by ID or name..." 
          value={searchQuery} 
          onChange={(e) => setSearchQuery(e.target.value)} 
          style={{marginRight: '10px', padding: '15px', paddingRight: '500px', borderRadius: '50px' }}/>
          
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} style={{marginLeft :'20px', padding: '10px'}}>
          <option value="">Sort By</option>
          <option value="id">ID</option>
          <option value="name">Name</option>
          <option value="age">Age</option>
          <option value="birthdate">Birthdate</option>
          <option value="householdNumber">Household Number</option>
        </select>
      </div>
    </div>

      <button onClick={exportCSV} className="qr-btn">
        <BsDownload className="icon" title="Export to CSV"/>
      </button>
      <button onClick={handleBulkDelete} className="deleteSelected-btn" disabled={selectedResidents.length === 0}>
        <BsTrash className="icon" disabled={selectedResidents.length === 0} 
          title={selectedResidents.length > 0 ? "Delete Selected Residents" : ""}/> 
      </button>
      <button onClick={() => openCsvModal()} className="csvUpload-btn" >
        <BsFilePlus className="icon" title="Upload CSV File"/>
      </button>
      <button onClick={() => openAddModal()} className="add-btn">
        <BsPersonPlus className="icon" title="Add Resident"/>
      </button>
       <button  className="qr-btn" onClick={openQrModal}>
        <BsQrCodeScan className="icon" title="Generate QR Code"/>
      </button>

      {/* Display QR Code for selected resident */}
      {selectedResident && (
        <div ref={qrRef} style={{ marginTop: "20px", textAlign:"center", justifyItems:"center" }}>
          <QRCode            
            value={JSON.stringify({
              id: selectedResident._id || selectedResident.id,
              name: selectedResident.name, 
              purok: selectedResident.purok,
              birthdate: selectedResident.birthdate,
              age: selectedResident.age,
              contactNumber: selectedResident.contactNumber,
              householdNumber: selectedResident.householdNumber,
              occupation: selectedResident.occupation,
              civilStatus: selectedResident.civilStatus,
              sex: selectedResident.sex,               
            })}
            
            size={400}
            level="H"
            includeMargin={true}
          />
          <p>{selectedResident.name}
            <button onClick={closeQrModal} style={{marginTop:"15px", marginLeft:"10px", cursor:"pointer"}}>Cancel</button>
            <button onClick={downloadQrCode} style={{marginTop:"15px", marginLeft:"5px", cursor:"pointer"}}>Download</button>
          </p>
        </div>
      )}

      <table className="table-container">
        <thead>
          <tr>
            <th>
              <input type="checkbox" checked={selectAll} onChange={handleSelectAll} />
            </th>          
            <th>ID</th>
            <th>Name</th>
            <th>Age</th>
            <th>Purok</th>
            <th>Birthdate</th>
            <th>Contact</th>
            <th>Household Number</th>
            <th>Occupation</th>
            <th>Civil Status</th>
            <th>Sex</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredResidents.map((resident) => (
            <tr key={resident.id || resident._id}>
              <td>
                <input
                  type="checkbox"
                  checked={selectedResidents.includes(resident.id)}
                  onChange={() => handleSelectResident(resident.id)}
                />
              </td>
              <td>{resident.id}</td>
              <td>{resident.name}</td>
              <td>{resident.age}</td>
              <td>{resident.purok}</td>
              <td>{resident.birthdate}</td>
              <td>{resident.contactNumber}</td>
              <td>{resident.householdNumber}</td>
              <td>{resident.occupation}</td>
              <td>{resident.civilStatus}</td>
              <td>{resident.sex}</td>
              <td>
                <button
                  onClick={() => navigate(`/profile/${resident.id}`)}
                  className="view-btn" >
                  <FaEye /> View Profile
                </button>

                <button
                  onClick={() => openDeleteModal(resident)}
                  className="delete-btn">
                  <BsTrash /> Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Add Resident Modal */}
      <Modal isOpen={isAddModalOpen} onRequestClose={closeAddModal} className="forAddModal" overlayClassName="forAddOverlay">
        <h2 style={{color:'rgb(50, 255, 50)'}}>Add Resident</h2>
        <div className="profile-details">
          <input type="text" name="id" placeholder="ID" value={newResident.id} onChange={(e) => setNewResident({ ...newResident, id: e.target.value })} className={idError ? "error-shake" : ""} required />
          <input type="text" placeholder="Name" value={newResident.name} onChange={(e) => setNewResident({ ...newResident, name: e.target.value })} required/>
          <input type="date" placeholder="Birthdate" value={newResident.birthdate} onChange={handleBirthdateChange} required/>
          <input type="number" placeholder="Age" value={newResident.age} readOnly onChange={(e) => setNewResident({ ...newResident, age: e.target.value })} required/>
          <select value={newResident.purok} onChange={(e) => setNewResident({ ...newResident, purok: e.target.value })} required>
              <option value="">Purok </option>
              <option value="1">1</option>
              <option value="2">2</option>
              <option value="3">3</option>
              <option value="4">4</option>
              <option value="5">5</option>
          </select> 
          <input type="text" placeholder="Contact Number" value={newResident.contactNumber} onChange={(e) => setNewResident({ ...newResident, contactNumber: e.target.value })} required/>
          <input type="text" placeholder="Household Number" value={newResident.householdNumber} onChange={(e) => setNewResident({ ...newResident, householdNumber: e.target.value })} required/>
          <input type="text" placeholder="Occupation" value={newResident.occupation} onChange={(e) => setNewResident({ ...newResident, occupation: e.target.value })} required/>
          <select value={newResident.civilStatus} onChange={(e) => setNewResident({ ...newResident, civilStatus: e.target.value })} required>
              <option value="">Civil Status </option>
              <option value="Single">Single</option>
              <option value="Married">Married</option>
              <option value="Widowed">Widowed</option>
              <option value="Divorced">Divorced</option>
          </select>        
          <select value={newResident.sex} onChange={(e) => setNewResident({ ...newResident, sex: e.target.value })} required >
            <option value="">Sex </option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
          </select>
        </div>
        <div className="modal-actions">
          <button onClick={handleAddResident} className="confirm-btn">
            Add
          </button>
          <button onClick={closeAddModal} className="cancel-btn">
            Cancel
          </button>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onRequestClose={closeDeleteModal}
        className="modal-content"
      >
        <h2>Confirm Deletion</h2>
        <p>
          Are you sure you want to delete <strong>{residentToDelete?.name}</strong>?
        </p>
        <div className="modal-actions">
          <button onClick={handleDeleteResident} className="delete-confirm-btn">
            Yes
          </button>
          <button onClick={closeDeleteModal} className="cancel-btn">
            Cancel
          </button>
        </div>
      </Modal>

      {/* Modal for CSV File Upload */}
      <Modal isOpen={isCsvModalOpen} onRequestClose={closeCsvModal} contentLabel="Upload CSV File" className="modal" overlayClassName="overlay">
        <h2 style={{ textAlign: "center", color: "rgb(250, 189, 77)", fontFamily: "Century Gothic", marginBottom:"15px" }}>
          <b>CSV File Upload</b>
        </h2>
        
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "15px" }}>
          <input 
            type="file" 
            accept=".csv, .txt" 
            id="file-input"
            onChange={handleFileSelect} 
            style={{ padding: "10px", border: "1px solid #ccc", width: "100%" }}
          />
          <div style={{ display: "flex", gap: "10px" }}>
            <button type='submit' onClick={handleFileUpload} className="upload-btn">Upload</button>
            <button onClick={closeCsvModal} className="cancel-btn">Cancel</button>
          </div>
        </div>          
      </Modal>

      {/* Modal for selecting resident */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Select a Resident</h2>
            <ul className="resident-list">
              {residents.map((resident) => (
                <li
                  key={resident._id} 
                  onClick={() => handleSelectOneResident(resident)} 
                  className="resident-item"
                >
                  {resident.name} 
                </li>
              ))}
            </ul>
            <button className="close-btn" onClick={closeQrModal}>Cancel</button>
          </div>
        </div>
      )}

      <ToastContainer />
    </div>
  );
}

export default Residents;
