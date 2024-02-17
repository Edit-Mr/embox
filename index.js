/** @format */

const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

// Set up multer for file upload
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "box/");
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname);
    },
});
const upload = multer({ storage: storage });

// Serve files in the 'box' folder
app.use("/files", express.static("box"));

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public/index.html"));
});

// List all files in the 'box' folder
app.get("/list", (req, res) => {
    fs.readdir("box", (err, files) => {
        if (err) {
            return res.status(500).send("Unable to read directory contents.");
        }
        // Render HTML with file details
        let reply = files.map(file => ({
            extension: getFileExtension(file),
            file: file,
        }));
        console.log(reply.toString());
        res.send(reply);
    });
});

// Handle file upload
app.post("/upload", upload.single("file"), (req, res) => {
    res.redirect("/");
});

// Function to get file extension
function getFileExtension(filename) {
    return filename.split(".").pop();
}

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
