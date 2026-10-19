const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static(__dirname));

// --- LOGIN ENDPOINT ---
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;

    fs.readFile('user.txt', 'utf8', (err, data) => {
        if (err) {
            console.error("Error reading file:", err);
            return res.status(500).json({ success: false, message: "Server error" });
        }

        const lines = data.split('\n');
        let userFound = false;
        let displayName = username; // Default fallback

        for (let line of lines) {
            if (!line.trim()) continue; 
            const parts = line.split(';');
            
            if (parts.length >= 2) {
                const fileUsername = parts[0].trim();
                const filePassword = parts[1].trim(); 

                // Compare usernames in lowercase, but keep passwords exact
                if (fileUsername.toLowerCase() === username.toLowerCase() && filePassword === password) {
                    userFound = true;
                    // Grab the display name (5th item) if it exists
                    if (parts[4] && parts[4].trim()) {
                        displayName = parts[4].trim();
                    }
                    break; 
                }
            }
        }

        if (userFound) {
            // Send the display name back to the frontend!
            res.json({ success: true, message: "Login successful!", displayName: displayName });
        } else {
            res.status(401).json({ success: false, message: "Invalid username or password" });
        }
    });
});

// --- REGISTER ENDPOINT ---
app.post('/api/register', (req, res) => {
    const { email, username, password, dob } = req.body;

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
            
            if (parts.length >= 1 && parts[0].trim().toLowerCase() === username.toLowerCase()) {
                userExists = true;
                break;
            }
        }

        if (userExists) {
            return res.status(400).json({ success: false, message: "Username already exists" });
        }

        // Format: Username;Password;Email;DOB;DisplayName
        const newUserLine = `${username};${password};${email};${dob};${username};1\n`;

        fs.appendFile('user.txt', newUserLine, (err) => {
            if (err) {
                console.error("Error writing to file:", err);
                return res.status(500).json({ success: false, message: "Server error saving user" });
            }
            // Grab the theme (6th item). Default to '1' if it doesn't exist yet.
            let userTheme = '1'; 
            for (let line of lines) {
                const parts = line.split(';');
                if (parts[0].trim().toLowerCase() === username.toLowerCase()) {
                    if (parts[5] && parts[5].trim()) userTheme = parts[5].trim();
                    break;
                }
            }
            res.json({ success: true, message: "Login successful!", displayName: displayName, theme: userTheme });
        });
    });
});

// --- DELETE ACCOUNT ENDPOINT ---
app.post('/api/delete-account', (req, res) => {
    const { username } = req.body;

    fs.readFile('user.txt', 'utf8', (err, data) => {
        if (err) {
            console.error("Error reading file:", err);
            return res.status(500).json({ success: false, message: "Server error" });
        }

        const lines = data.split('\n');
        const remainingLines = lines.filter(line => {
            if (!line.trim()) return false; 
            const fileUsername = line.split(';')[0].trim();
            return fileUsername.toLowerCase() !== username.toLowerCase();
        });

        const updatedData = remainingLines.join('\n') + '\n'; 

        fs.writeFile('user.txt', updatedData, 'utf8', (err) => {
            if (err) {
                console.error("Error writing to file:", err);
                return res.status(500).json({ success: false, message: "Server error saving file" });
            }
            res.json({ success: true, message: "Account deleted successfully" });
        });
    });
});

// --- UPDATE PROFILE ENDPOINT ---
app.post('/api/update-profile', (req, res) => {
    const { currentUsername, newUsername, newDisplayName, newDob, newPassword } = req.body;

    fs.readFile('user.txt', 'utf8', (err, data) => {
        if (err) return res.status(500).json({ success: false, message: "Server error" });

        const lines = data.split('\n');
        let userFound = false;

        const updatedLines = lines.map(line => {
            if (!line.trim()) return line; 
            const parts = line.split(';');
            
            if (parts[0].trim().toLowerCase() === currentUsername.toLowerCase()) {
                userFound = true;
                // Keep old values if the user left the input blank
                const finalUsername = newUsername.trim() ? newUsername.trim() : parts[0].trim();
                const finalPassword = newPassword.trim() ? newPassword.trim() : parts[1].trim();
                const finalEmail = parts[2].trim();
                const finalDob = newDob.trim() ? newDob.trim() : parts[3].trim();
                const finalDisplayName = newDisplayName.trim() ? newDisplayName.trim() : parts[4]?.trim() || finalUsername;

                // Rebuild the line
                return `${finalUsername};${finalPassword};${finalEmail};${finalDob};${finalDisplayName}`;
            }
            return line;
        });

        if (!userFound) return res.status(404).json({ success: false, message: "User not found" });

        fs.writeFile('user.txt', updatedLines.join('\n'), 'utf8', (err) => {
            if (err) return res.status(500).json({ success: false, message: "Error saving file" });
            res.json({ success: true, message: "Profile updated successfully" });
        });
    });
});

// --- UPDATE THEME ENDPOINT ---
app.post('/api/update-theme', (req, res) => {
    const { username, theme } = req.body; // theme will be '1' (dark) or '0' (light)

    fs.readFile('user.txt', 'utf8', (err, data) => {
        if (err) return res.status(500).json({ success: false, message: "Server error" });

        const lines = data.split('\n');
        let userFound = false;

        const updatedLines = lines.map(line => {
            if (!line.trim()) return line; 
            const parts = line.split(';');
            
            if (parts[0].trim().toLowerCase() === username.toLowerCase()) {
                userFound = true;
                // Ensure we have 6 parts to work with
                while (parts.length < 6) { parts.push('1'); } 
                parts[5] = theme; // Set the 6th item (index 5) to the new theme
                return parts.join(';');
            }
            return line;
        });

        if (!userFound) return res.status(404).json({ success: false, message: "User not found" });

        fs.writeFile('user.txt', updatedLines.join('\n'), 'utf8', (err) => {
            if (err) return res.status(500).json({ success: false, message: "Error saving file" });
            res.json({ success: true, message: "Theme updated" });
        });
    });
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});