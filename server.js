const express = require('express');
const redis = require('redis');
const cors = require('cors');
const bodyParser = require('body-parser');
const multer = require('multer');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
const Papa = require('papaparse');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: "http://localhost:5173",
  credentials: true
}));
app.use(bodyParser.json());
app.use("/uploads", express.static("uploads"));

// Configure multer for file uploads

  const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, "uploads/");
    },
    filename: function (req, file, cb) {
      cb(null, Date.now() + path.extname(file.originalname));
    }
  });  


const upload = multer({ 
  storage: storage, 
  limits: { fileSize: 10 * 1024 * 1024 }, 
 });

module.exports = upload;    


// Connect to Redis
const client = redis.createClient({ url: 'redis://@127.0.0.1:6379' });

client.connect()
  .then(() => console.log('✅ Connected to Redis'))
  .catch(err => console.error('❌ Redis connection error:', err));

const SECRET_KEY = 'password';

// Middleware to verify token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  if (!authHeader) {
    return res.status(401).json({ message: "Access denied. No token provided." });
  }

  const token = authHeader.split(" ")[1];
  if (!token) {
    return res.status(401).json({ message: "Invalid token format." });
  }

  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) {
      return res.status(401).json({ message: err.name === "TokenExpiredError" ? "Session expired. Please log in again." : "Invalid token." });
    }
    req.user = user;
    next();
  });
  
};


// Add a resident (with duplicate check)
const generateUniqueId = async () => {
  return await client.incr('resident:id_counter'); 
};

app.post('/residents', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied: You are not authorized.' });
  }
  const id = req.body.id || await generateUniqueId();
  const {name, age, purok, birthdate, contactNumber, householdNumber, occupation, civilStatus, sex} = req.body;

  if (!id || !name || !age || !purok || !birthdate || !contactNumber || !householdNumber || !occupation || !civilStatus || !sex) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  try {
    const exists = await client.exists(`resident:${id}`);
    if (exists) {
      return res.status(400).json({ message: "Resident ID already exists." });
    }
        
    const pipeline = client.multi(); 

    if (name) pipeline.hSet(`resident:${id}`, 'name', name);
    if (age) pipeline.hSet(`resident:${id}`, 'age', age);
    if (purok) pipeline.hSet(`resident:${id}`, 'purok', purok);
    if (birthdate) pipeline.hSet(`resident:${id}`, 'birthdate', birthdate);
    if (contactNumber) pipeline.hSet(`resident:${id}`, 'contactNumber', contactNumber);
    if (householdNumber) pipeline.hSet(`resident:${id}`, 'householdNumber', householdNumber);
    if (occupation) pipeline.hSet(`resident:${id}`, 'occupation', occupation);
    if (civilStatus) pipeline.hSet(`resident:${id}`, 'civilStatus', civilStatus);
    if (sex) pipeline.hSet(`resident:${id}`, 'sex', sex);
    await pipeline.exec(); 

    res.status(201).json({ message: 'Resident saved successfully!' });
  } catch (error) {
    console.error('Error saving resident:', error);
    res.status(500).json({ message: 'Failed to save resident' });
  }
});

//Get resident by ID
app.get('/residents/:id', async (req, res) => {
  const id = req.params.id;
  const residents = await client.hGetAll(`resident:${id}`);
  
  if (Object.keys(residents).length === 0) {
    return res.status(404).json({ message: 'Resident not found' });
  }
  
  res.json(residents);
});


// Get all residents
app.get('/residents', async (req, res) => {
  try {
    console.log("Fetching residents from Redis...");
    const keys = await client.keys('resident:*');
    console.log("Found keys:", keys);

    if (keys.length === 0) {
      return res.json([]);
    }

    const residents = await Promise.all(keys.map(async (key) => ({
      id: key.split(':')[1],
      ...(await client.hGetAll(key))
    })));

    console.log("Residents Data:", residents);
    res.json(residents);
  } catch (error) {
    console.error('Error fetching residents:', error);
    res.status(500).json({ message: 'Failed to retrieve residents' });
  }
});

// Get dashboard data
app.get('/dashboard', authenticateToken, async (req, res) => {
  try {
    const keys = await client.keys('resident:*');

    const residents = await Promise.all(keys.map(async (key) => ({
      id: key.split(':')[1],
      ...(await client.hGetAll(key))
    })));

    const totalResidents = residents.length;
    let totalMales = 0, totalFemales = 0;
    let totalChristians = 0, totalIslams = 0;

    // Initialize purok count
    const purokCounts = {
      "1": 0,
      "2": 0,
      "3": 0,
      "4": 0,
      "5": 0
    };

    // Count genders 
    residents.forEach(resident => {
      if (resident.sex) {
        const sex = resident.sex.toLowerCase();
        if (sex === 'male') totalMales++;
        if (sex === 'female') totalFemales++;
      }

    // Count religions
      if (resident.religion) {
        const religion = resident.religion.toLowerCase().trim();
        if (religion === 'christianity') totalChristians++;
        if (religion === 'islam') totalIslams++;
      }

      // Ensure purok exists before processing
      if (resident.purok) {
        const purokNum = resident.purok.trim();
        
        if (purokCounts.hasOwnProperty(purokNum)) {
          purokCounts[purokNum]++;
        } else {
          console.warn(`Unexpected purok value: "${resident.purok}"`);
        }
      }
    });

    // Convert purokCounts object to an array for frontend
    const purokData = Object.keys(purokCounts).map(purok => ({
      purok: `Purok ${purok}`, 
      residents: purokCounts[purok]
    }));

    res.json({
      totalResidents,
      totalMales, 
      totalFemales,
      totalChristians, 
      totalIslams,    
      purokData, 
    });

  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    res.status(500).json({ message: 'Failed to retrieve dashboard data' });
  }
});


//Upload CSV 
app.post('/upload-file', authenticateToken, upload.single('file'), async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: "Access denied: You are not authorized." });
  }

  if (!req.file) {
    return res.status(400).json({ message: "No file uploaded." });
  }

  try {
    const fileContent = fs.readFileSync(req.file.path, "utf8");
    const fileData = Papa.parse(fileContent, { header: true, skipEmptyLines: true });

    if (fileData.errors.length > 0) {
      console.error("CSV Parsing errors:", fileData.errors);
      return res.status(400).json({ message: "Error parsing CSV file", errors: fileData.errors });
    }
    
    for (let resident of fileData.data) {
      const { id, name, age, purok, birthdate, contactNumber, householdNumber, occupation, civilStatus, sex } = resident;
    
      if (!id) continue;  
    
      const exists = await client.exists(`resident:${id}`); 
    
      if (exists) {
        return res.status(400).json({ message: "Resident ID already exists." });
      }   
      const pipeline = client.multi(); 
      if (name) pipeline.hSet(`resident:${id}`, 'name', name);
      if (age) pipeline.hSet(`resident:${id}`, 'age', age);
      if (purok) pipeline.hSet(`resident:${id}`, 'purok', purok);
      if (birthdate) pipeline.hSet(`resident:${id}`, 'birthdate', birthdate);
      if (contactNumber) pipeline.hSet(`resident:${id}`, 'contactNumber', contactNumber);
      if (householdNumber) pipeline.hSet(`resident:${id}`, 'householdNumber', householdNumber);
      if (occupation) pipeline.hSet(`resident:${id}`, 'occupation', occupation);
      if (civilStatus) pipeline.hSet(`resident:${id}`, 'civilStatus', civilStatus);
      if (sex) pipeline.hSet(`resident:${id}`, 'sex', sex);
        
      await pipeline.exec(); 
      }    

    res.status(200).json({ message: "File uploaded and data added successfully." });

  } catch (error) {
    console.error("Error uploading file:", error);
    res.status(500).json({ message: "Error uploading file!" });
  }
});


// Upload profile photo
app.post("/residents/:id/uploadPhoto", authenticateToken, upload.single("profilePhoto"), async (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Access denied: You are not authorized." });
  }

  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded." });
    }

    const filePath = `/uploads/${req.file.filename}`; 
    await client.hSet(`resident:${req.params.id}`, "profilePhoto", filePath);

    res.status(200).json({ message: "Photo uploaded successfully!", profilePhoto: filePath });

  } catch (error) {
    console.error("Error uploading photo:", error);
    res.status(500).json({ message: "Failed to upload photo" });
  }
});

// Get reports and analytics
app.get("/reports", async (req, res) => {
  try {
    const keys = (await client.keys('resident:*')) || [];
    const residents = await Promise.all(keys.map(async (key) => ({
      id: key.split(':')[1],
      ...(await client.hGetAll(key))
    })));

    const parsedResidents = typeof residents === "string" ? JSON.parse(residents) : residents || [];

    // Compute report data
    const totalResidents = parsedResidents.length;

    // Gender distribution
    const genderCount = parsedResidents.reduce((acc, resident) => {
      const gender = resident.sex || "Unknown"; 
      acc[gender] = (acc[gender] || 0) + 1;
      return acc;
    }, {});

    const genderData = Object.entries(genderCount).map(([gender, count]) => ({ name: gender, value: count }));

    // Age group distribution
    const ageGroups = { "0-18": 0, "19-35": 0, "36-60": 0, "60+": 0 };
    parsedResidents.forEach(({ age }) => {
      const ageNum = parseInt(age, 10);
      if (!isNaN(ageNum)) {
         if (ageNum <= 18) ageGroups["0-18"]++;
         else if (ageNum <= 35) ageGroups["19-35"]++;
         else if (ageNum <= 60) ageGroups["36-60"]++;
         else ageGroups["60+"]++;
      }
    });

    const ageGroupData = Object.entries(ageGroups).map(([group, count]) => ({ name: group, value: count }));

    // Residents by Purok
    const purokCount = parsedResidents.reduce((acc, { purok }) => {
      if (purok) {
        acc[purok] = (acc[purok] || 0) + 1;
      }
      return acc;
    }, {});
    const purokData = Object.entries(purokCount).map(([purok, count]) => ({ name: purok, residents: count }));

    // Send structured report data
    res.json({ 
      totalResidents, 
      genderData, 
      ageGroupData, 
      purokData });

  } catch (error) {
    console.error("Error generating reports:", error.message, error.stack);
    res.status(500).json({ message: "Failed to fetch reports" });
  }
});


// Update a resident
app.put('/residents/:id', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied: You are not authorized.' });
  }

  const { id } = req.params;
  const { name, age, purok, birthdate, contactNumber, householdNumber, occupation, civilStatus, sex, religion, profilePhoto } = req.body;

  try {
    const exists = await client.exists(`resident:${id}`);
    if (!exists) {
      return res.status(404).json({ message: 'Resident not found' });
    }

    const pipeline = client.multi();
    if (name) pipeline.hSet(`resident:${id}`, 'name', name);
    if (age) pipeline.hSet(`resident:${id}`, 'age', age);
    if (purok) pipeline.hSet(`resident:${id}`, 'purok', purok);
    if (birthdate) pipeline.hSet(`resident:${id}`, 'birthdate', birthdate);
    if (contactNumber) pipeline.hSet(`resident:${id}`, 'contactNumber', contactNumber);
    if (householdNumber) pipeline.hSet(`resident:${id}`, 'householdNumber', householdNumber);
    if (occupation) pipeline.hSet(`resident:${id}`, 'occupation', occupation);
    if (civilStatus) pipeline.hSet(`resident:${id}`, 'civilStatus', civilStatus);
    if (sex) pipeline.hSet(`resident:${id}`, 'sex', sex);
    if (religion) pipeline.hSet(`resident:${id}`, 'religion', religion);
    if (profilePhoto) pipeline.hSet(`resident:${id}`, 'profilePhoto', profilePhoto);

    await pipeline.exec();
    res.json({ message: 'Resident updated successfully!' });
  } catch (error) {
    console.error('Error updating resident:', error);
    res.status(500).json({ message: 'Failed to update resident.' });
  }
});


// Delete a resident
app.delete('/residents/:id', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied: You are not authorized.' });
  }

  const { id } = req.params;
  await client.del(`resident:${id}`);
  res.status(200).json({ message: 'Resident deleted successfully!' });

});


// Login route
app.post("/login", async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: "Username and password are required!" });
  }

  if (username !== "admin" || password !== "adminpw") {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const token = jwt.sign({ username, role: "admin" }, SECRET_KEY, { expiresIn: "1h" });

  res.json({ token });
});

// Start server
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
