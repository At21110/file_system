const express = require("express");
const multer = require("multer");
const path = require("path");
const cors = require("cors");
const fs = require('fs');
const { promises: fsPromises } = fs;
const connectDB = require("./public/db.js");
const File = require("./dbfile.js");
const User=require("./dbreg.js")
const app = express();
const port = 8000;

connectDB();

const storage = multer.diskStorage({
  // destination:  (req, file, cb) => {
  //   cb(null, "./public/temp");
  // }, 
  destination: (req, file, cb) => {
    const tempDir = path.join(__dirname, "public", "temp");
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir);
    }
    cb(null, tempDir);
  },
filename: (req, file, cb) => {
    cb(null, `${file.originalname}`); // Use the original file name
  }, options: {
    mode: 0o644, // Set file permissions to rw-r--
  },
  // "./public/temp", // Multer handles directory creation  // ,options: {
  //   mode: 0o644, // Set file permissions to rw-r--
  // },
});

const upload = multer({ storage,
  limits: {
    fileSize: 1024 * 1024 * 5, // 5 MB
  },});
app.use(cors());
app.use(express.json());


//app.use("/temp", express.static(path.join(__dirname, "public/temp")));
app.use(
  "/temp",
  express.static(path.join(__dirname, "public/temp"), {
  setHeaders: (res, path) => {
  res.setHeader("Cache-Control", "public, max-age=31536000");
  },
  })
  );
 
app.post("/upload", upload.array("files"), async (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ error: "No files uploaded" });
  }

  const fileDetails = req.files.map((file) => ({
    name: file.originalname,
    path: `/temp/${file.filename}`,
  
  }));

  try {
    const savedFiles = await File.insertMany(fileDetails);
    res.status(200).json({
      message: "Files uploaded successfully",
      files: savedFiles,
    });
  } catch (err) {
    console.error("Error saving file details:", err);
    res.status(500).json({ error: "Failed to save file details to database" });
  }
});


app.get('/getfiles', async (req, res) => {
  try {
    const files = await File.find({})
    if (!files || files.length === 0) {
      return res.status(404).send({
        success: false,
        message: 'No files found',
      });
    }
    res.status(200).send({
      success: true,
      countTotal: files.length,
      message: 'All files fetched successfully',
      files,
    });
  } catch (error) {
    console.error('Error fetching files:', error.message);
    res.status(500).send({
      success: false,
      message: 'Error in getting files',
      error: error.message,
    });
  }
})

app.delete("/deletefile/:fileName", async (req, res) => {
  const fileName = req.params.fileName;

  try {
    // Delete the file from the database
    const deletedFile = await File.findOneAndDelete({ name: fileName });

    if (!deletedFile) {
      return res.status(404).json({ error: "File not found" });
    }

    // Delete the file from the file system
    const filePath = `./public/temp/${fileName}`;
    try {
      await fsPromises.unlink(filePath);
      res.status(200).json({ message: "File deleted successfully" });
    } catch (err) {
      console.error(`Error deleting file from server: ${err.message}`);
      console.error(`File path: ${filePath}`);
      if (err.code === "ENOENT") {
        console.error("File not found");
      } else {
        res.status(500).json({ error: "Failed to delete file" });
      }
    }
  } catch (err) {
    console.error(`Error deleting file from database: ${err.message}`);
    res.status(500).json({ error: "Failed to delete file" });
  }
});
app.get("/", (req, res) => {
  res.send("Hello, World!");
});
app.post('/register', async (req, res) => {
  try {
    const { name, email, password, phoneNumber } = req.body;
    //const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ name, email, password, phoneNumber });
    await user.save();
    res.send({ message: 'User registered successfully' });
  } catch (error) {
    res.status(500).send({ message: 'Error registering user' });
    res.status(500).send(error.message);
  }
});
app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).send({ message: 'Invalid email or password' });
    }
    if (user.password !== password) {
      return res.status(401).send({ message: 'Invalid email or password' });
    }
    const token = 'some-token'; // Replace with actual token generation logic
    res.send({ message: 'Login successful', token });
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: 'Error logging in user' });
  }
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
