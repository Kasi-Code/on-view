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
        if (err) return res.status(500).json({ success: false, message: "Server error" });

        const lines = data.split('\n');
        let userFound = false;
        let displayName = username; 
        let userTheme = '1'; 
        let userExperience = "[]"; 
        let userBio = ""; // NEW

        for (let line of lines) {
            if (!line.trim()) continue; 
            const parts = line.split(';');
            
            if (parts.length >= 2) {
                const fileUsername = parts[0].trim();
                const filePassword = parts[1].trim(); 

                if (fileUsername.toLowerCase() === username.toLowerCase() && filePassword === password) {
                    userFound = true;
                    if (parts[4] && parts[4].trim()) displayName = parts[4].trim();
                    if (parts[5] && parts[5].trim()) userTheme = parts[5].trim();
                    if (parts[6] && parts[6].trim()) userExperience = parts[6].trim();
                    if (parts[7] && parts[7].trim()) userBio = parts[7].trim(); // NEW
                    break; 
                }
            }
        }

        if (userFound) {
            res.json({ success: true, message: "Login successful!", displayName, theme: userTheme, experience: userExperience, bio: userBio });
        } else {
            res.status(401).json({ success: false, message: "Invalid username or password" });
        }
    });
});

// --- REGISTER ENDPOINT ---
app.post('/api/register', (req, res) => {
    const { email, username, password, dob } = req.body;

    fs.readFile('user.txt', 'utf8', (err, data) => {
        if (err && err.code !== 'ENOENT') return res.status(500).json({ success: false, message: "Server error" });

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

        if (userExists) return res.status(400).json({ success: false, message: "Username already exists" });

        // Format: Username;Password;Email;DOB;DisplayName;Theme;Experience;Bio
        const newUserLine = `${username};${password};${email};${dob};${username};1;[];\n`;

        fs.appendFile('user.txt', newUserLine, (err) => {
            if (err) return res.status(500).json({ success: false, message: "Server error saving user" });
            res.json({ success: true, message: "Registration successful!" });
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
                const finalUsername = newUsername.trim() ? newUsername.trim() : parts[0].trim();
                const finalPassword = newPassword.trim() ? newPassword.trim() : parts[1].trim();
                const finalEmail = parts[2].trim();
                const finalDob = newDob.trim() ? newDob.trim() : parts[3].trim();
                const finalDisplayName = newDisplayName.trim() ? newDisplayName.trim() : parts[4]?.trim() || finalUsername;
                
                const finalTheme = parts[5] || '1';
                const finalExp = parts[6] || '[]';
                const finalBio = parts[7] || ''; // NEW

                return `${finalUsername};${finalPassword};${finalEmail};${finalDob};${finalDisplayName};${finalTheme};${finalExp};${finalBio}`;
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
    const { username, theme } = req.body;

    fs.readFile('user.txt', 'utf8', (err, data) => {
        if (err) return res.status(500).json({ success: false, message: "Server error" });

        const lines = data.split('\n');
        let userFound = false;

        const updatedLines = lines.map(line => {
            if (!line.trim()) return line; 
            const parts = line.split(';');
            
            if (parts[0].trim().toLowerCase() === username.toLowerCase()) {
                userFound = true;
                while (parts.length < 8) { parts.push(''); } 
                parts[5] = theme; 
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

// --- UPDATE EXPERIENCE ENDPOINT ---
app.post('/api/update-experience', (req, res) => {
    const { username, experiences } = req.body; 

    fs.readFile('user.txt', 'utf8', (err, data) => {
        if (err) return res.status(500).json({ success: false, message: "Server error" });

        const lines = data.split('\n');
        let userFound = false;

        const updatedLines = lines.map(line => {
            if (!line.trim()) return line; 
            const parts = line.split(';');
            
            if (parts[0].trim().toLowerCase() === username.toLowerCase()) {
                userFound = true;
                while (parts.length < 8) { parts.push(''); } 
                parts[6] = JSON.stringify(experiences); 
                return parts.join(';');
            }
            return line;
        });

        if (!userFound) return res.status(404).json({ success: false, message: "User not found" });

        fs.writeFile('user.txt', updatedLines.join('\n'), 'utf8', (err) => {
            if (err) return res.status(500).json({ success: false, message: "Error saving file" });
            res.json({ success: true, message: "Experience updated" });
        });
    });
});

// --- NEW: UPDATE BIO ENDPOINT ---
app.post('/api/update-bio', (req, res) => {
    const { username, bio } = req.body; 

    fs.readFile('user.txt', 'utf8', (err, data) => {
        if (err) return res.status(500).json({ success: false, message: "Server error" });

        const lines = data.split('\n');
        let userFound = false;

        const updatedLines = lines.map(line => {
            if (!line.trim()) return line; 
            const parts = line.split(';');
            
            if (parts[0].trim().toLowerCase() === username.toLowerCase()) {
                userFound = true;
                while (parts.length < 8) { parts.push(''); } 
                parts[7] = bio.replace(/\n/g, '\\n'); // Save line breaks as \n so they don't break the txt file
                return parts.join(';');
            }
            return line;
        });

        if (!userFound) return res.status(404).json({ success: false, message: "User not found" });

        fs.writeFile('user.txt', updatedLines.join('\n'), 'utf8', (err) => {
            if (err) return res.status(500).json({ success: false, message: "Error saving file" });
            res.json({ success: true, message: "Bio updated" });
        });
    });
});

// --- LAST: DELETE ACCOUNT ENDPOINT ---
app.post('/api/delete-account', (req, res) => {
    const { username } = req.body;

    fs.readFile('user.txt', 'utf8', (err, data) => {
        if (err) return res.status(500).json({ success: false, message: "Server error" });

        const lines = data.split('\n');
        const remainingLines = lines.filter(line => {
            if (!line.trim()) return false; 
            const fileUsername = line.split(';')[0].trim();
            return fileUsername.toLowerCase() !== username.toLowerCase();
        });

        fs.writeFile('user.txt', remainingLines.join('\n') + '\n', 'utf8', (err) => {
            if (err) return res.status(500).json({ success: false, message: "Server error saving file" });
            res.json({ success: true, message: "Account deleted successfully" });
        });
    });
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});