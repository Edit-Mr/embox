/** @format */

const express = require("express");
const bodyParser = require("body-parser");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "box/");
    },
    filename: function (req, file, cb) {
        cb(null, Buffer.from(file.originalname, "latin1").toString("utf8"));
    },
});

const upload = multer({ storage: storage }).array("file");

app.get("/box", (req, res) => {
    var file = req.query.file;
    if (file === undefined || file === "") {
        res.redirect("/");
        return;
    }
    const normalizedFilePath = path.resolve(__dirname, "box", file);
    const boxDirectory = path.resolve(__dirname, "box");
    if (!normalizedFilePath.startsWith(boxDirectory)) {
        res.status(403).send("What are you trying to do?");
        return;
    }
    //check if file exist
    if (!fs.existsSync(normalizedFilePath)) {
        res.status(404).send("File not found.");
        return;
    }
    var password = require("./password.json")[file.split("/").pop()];
    if (password === undefined || req.query.password === password) {
        res.sendFile(normalizedFilePath);
    } else {
        res.sendFile(path.resolve(__dirname, "public", "download.html"));
    }
});

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public/index.html"));
});

app.get("/list", (req, res) => {
    fs.readdir("box", (err, files) => {
        if (err) {
            return res.status(500).send("Unable to read directory contents.");
        }
        let reply = files.map(file => ({
            extension: getFileExtension(file),
            file: file,
            size: getFileSize(file),
            uploadDate: new Date(
                fs.statSync(path.join("box", file)).mtime
            ).toUTCString(),
        }));
        res.send(reply);
    });
});

// Handle file upload
app.post("/upload", (req, res) => {
    upload(req, res, function (err) {
        if (err) return res.status(500).send("Error uploading file.");
        let password = req.body.password;
        if (password !== "") {
            var passwordFile = require("./password.json");
            req.files.forEach(file => {
                passwordFile[file.originalname] = password;
            });
            fs.writeFileSync(
                "password.json",
                JSON.stringify(passwordFile, null, 4),
                "utf8"
            );
        }
        res.redirect("/");
    });
});

// Function to get file extension
function getFileExtension(filename) {
    return filename.split(".").pop();
}

function getFileSize(filename) {
    const stats = fs.statSync(path.join("box", filename));
    // Convert file size to KB
    var size = stats.size / 1024;
    if (size < 1024) {
        return size.toFixed(2) + " KB";
    }
    // Convert file size to MB
    size = size / 1024;
    return size.toFixed(2) + " MB";
}

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
