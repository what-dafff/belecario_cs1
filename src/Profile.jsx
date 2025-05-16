import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./App.css"; 
import { BsArrowLeftCircle, BsPencilSquare } from "react-icons/bs";

const API_URL = "http://localhost:5000/residents"; 

function ResidentProfile() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [resident, setResident] = useState({
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
    religion: "",
    profilePhoto: "",
  });

  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isEditing, setIsEditing] = useState(false); 

  useEffect(() => {
    if (!isEditing) {
      fetchResident();
    }
  }, [isEditing]);

  const fetchResident = async () => {
    
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${API_URL}/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = response.data;

      if (data.birthdate) {
        const birthDateObj = new Date(data.birthdate);
        data.birthdate = birthDateObj.toISOString().split("T")[0]; 
      }

      setResident(response.data);
      if (response.data.profilePhoto) {
        setPreviewUrl(`http://localhost:5000${response.data.profilePhoto}`);
      } 
      else {
        setPreviewUrl(null);
      }
          } catch (error) {
      console.error("Error fetching resident:", error);
      toast.error("Failed to load resident details!");
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
  
    if (name === "birthdate") {
      const birthDate = new Date(value);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
  
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
  
      setResident({ ...resident, birthdate: value, age: age.toString() });
    } else {
      setResident({ ...resident, [name]: value });
    }
  };
  

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setSelectedFile(file);

    if (file) {
      const reader = new FileReader();
      reader.onload = () => setPreviewUrl(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleSaveChanges = async () => {
    try {
      const token = localStorage.getItem("token");
      let updatedResident = { ...resident };
      let photoUpdated = false;
  
      if (selectedFile) {
        const formData = new FormData();
        formData.append("profilePhoto", selectedFile);
  
        const uploadResponse = await axios.post(
          `${API_URL}/${id}/uploadPhoto`, formData,
          { headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" } }
        );
  
        if (uploadResponse.data.profilePhoto) {
          updatedResident.profilePhoto = uploadResponse.data.profilePhoto;
          setPreviewUrl(uploadResponse.data.profilePhoto);
          photoUpdated = true;
        toast.success("Profile photo uploaded successfully!");
        } else {
          toast.error("Failed to upload profile photo!");
        }
      }

  
      // Avoid sending update request if no changes were made
      const originalResident = await axios.get(`${API_URL}/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
  
    // Check if any changes were made
    const hasChanges = JSON.stringify(originalResident.data) !== JSON.stringify(updatedResident);

    if (hasChanges || photoUpdated) {  
      await axios.put(`${API_URL}/${id}`, updatedResident, {
        headers: { Authorization: `Bearer ${token}` },
      });
  
        toast.success("Resident updated successfully!");
      } else {
        toast.info("No changes made.");
      }
  
      setIsEditing(false);
      fetchResident();
    } catch (error) {
      console.error("Error updating resident:", error);
      toast.error("Failed to update resident!");
    }
  };
  

  return (
    <div className="main-container">
      <button onClick={() => navigate(-1)} className="icon back-btn">
        <BsArrowLeftCircle />
      </button>
      <h2 style={{marginTop: "10px", color: "white"}}>RESIDENT PROFILE</h2>
            {!isEditing ? (
              <button onClick={() => setIsEditing(true)} className="edit-btn" style={{marginRight: "10px"}}>
                <BsPencilSquare className="icon" /> Edit Profile 
              </button>
            ) : (
              <>
                <button onClick={() => setIsEditing(false)} className="cancel-save-btn">
                  Cancel
                </button>
                <button onClick={handleSaveChanges} className="save-btn">
                  Save Changes
                </button>
              </>
            )}

        <div className="profile-photo">
        <img src={previewUrl || (resident.profilePhoto ? `http://localhost:5000${resident.profilePhoto}` : "/default-profile.png")} 
          alt="Profile" 
          className="profile-img" />
            {isEditing && <input type="file" accept="image/*" onChange={handleFileChange} />}
        </div>

        <div className="profile-section">
          <div className="profile-details">
            <label>Name:</label>
            <input type="text" name="name" value={resident.name} onChange={handleInputChange} disabled={!isEditing} />

            <label>Age:</label>
            <input type="number" name="age" value={resident.age} onChange={handleInputChange} disabled={!isEditing} />

            <label>Purok:</label>
            <select name="purok" value={resident.purok} onChange={handleInputChange} disabled={!isEditing}>
              <option value="">Purok</option>
              <option value="1">1</option>
              <option value="2">2</option>
              <option value="3">3</option>
              <option value="4">4</option>
              <option value="5">5</option>
            </select>

            <label>Birthdate:</label>
            <input type="date" name="birthdate" value={resident.birthdate || ""} onChange={handleInputChange} disabled={!isEditing} />

            <label>Contact Number:</label>
            <input type="text" name="contactNumber" value={resident.contactNumber} onChange={handleInputChange} disabled={!isEditing} />

            <label>Household Number:</label>
            <input type="text" name="householdNumber" value={resident.householdNumber} onChange={handleInputChange} disabled={!isEditing} />

            <label>Occupation:</label>
            <input type="text" name="occupation" value={resident.occupation} onChange={handleInputChange} disabled={!isEditing} />

            <label>Civil Status:</label>
            <select name="civilStatus" value={resident.civilStatus} onChange={handleInputChange} disabled={!isEditing}>
              <option value="">Select</option>
              <option value="Single">Single</option>
              <option value="Married">Married</option>
              <option value="Widowed">Widowed</option>
              <option value="Divorced">Divorced</option>
            </select>

            <label>Sex:</label>
            <select name="sex" value={resident.sex} onChange={handleInputChange} disabled={!isEditing}>
              <option value="">Select</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>

            <label>Religion:</label>
            <select name="religion" value={resident.religion} onChange={handleInputChange} disabled={!isEditing}>
              <option value="">Select</option>
              <option value="Christianity">Christianity</option>
              <option value="Islam">Islam</option>
            </select>

          </div>
        </div>
      <ToastContainer />
    </div>
  );
}

export default ResidentProfile;
