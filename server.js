const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static(__dirname));

// --- EXISTING LOGIN ENDPOINT ---
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;

    fs.readFile('user.txt', 'utf8', (err, data) => {
        if (err) {
            console.error("Error reading file:", err);
            return res.status(500).json({ success: false, message: "Server error" });
        }

        const lines = data.split('\n');
        let userFound = false;

        for (let line of lines) {
            if (!line.trim()) continue; 
            const parts = line.split(';');
            
            if (parts.length >= 2) {
                const fileUsername = parts[0].trim();
                const filePassword = parts[1].trim(); 

                if (fileUsername === username && filePassword === password) {
                    userFound = true;
                    break; 
                }
            }
        }

        if (userFound) {
            res.json({ success: true, message: "Login successful!" });
        } else {
            res.status(401).json({ success: false, message: "Invalid username or password" });
        }
    });
});

// --- NEW REGISTER ENDPOINT ---
app.post('/api/register', (req, res) => {
    const { email, username, password, dob } = req.body;

    // Check if the user already exists by reading the file first
    fs.readFile('user.txt', 'utf8', (err, data) => {
        if (err && err.code !== 'ENOENT') {
            console.error("Error reading file:", err);
            return res.status(500).json({ success: false, message: "Server error" });
        }

        const lines = data ? data.split('\n') : [];
        let userExists = false;

        for (let line of lines) {
            if (!line.trim()) continue; 
            const parts = line.split(';');
            // Check if the username is already taken
            if (parts[0].trim() === username) {
                userExists = true;
                break;
            }
        }

        if (userExists) {
            return res.status(400).json({ success: false, message: "Username already exists" });
        }

        // If not, create the new line. Format: Username;Password;Email;DOB
        const newUserLine = `${username};${password};${email};${dob}\n`;

        // Append to the text file
        fs.appendFile('user.txt', newUserLine, (err) => {
            if (err) {
                console.error("Error writing to file:", err);
                return res.status(500).json({ success: false, message: "Server error saving user" });
            }
            res.json({ success: true, message: "Registration successful!" });
        });
    });
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});