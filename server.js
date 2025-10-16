const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const session = require('express-session');

const app = express();
const PORT = 3000;

// Body parser
app.use(bodyParser.urlencoded({ extended: true }));

// Express session
app.use(session({
    secret: 'agriconnect_secret_key',
    resave: false,
    saveUninitialized: true,
}));

// Serve static files from public folder
app.use(express.static(path.join(__dirname, 'public')));

// Redirect root to home page
app.get('/', (req, res) => {
    res.redirect('/project1.html');
});

// Signup route
app.post('/signup', (req, res) => {
    const { username, password } = req.body;
    const usersFile = path.join(__dirname, 'users.json');

    let users = [];
    if (fs.existsSync(usersFile)) {
        const data = fs.readFileSync(usersFile, 'utf-8');
        users = data ? JSON.parse(data) : [];
    }

    if (users.find(u => u.username === username)) {
        return res.redirect('/signup.html?error=Username%20already%20exists');
    }

    users.push({ username, password });
    fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));

    // Set session and redirect to categorypage
    req.session.user = username;
    res.redirect('/categorypage.html');
});

// Login route
app.post('/login', (req, res) => {
    const { username, password } = req.body;
    const usersFile = path.join(__dirname, 'users.json');

    let users = [];
    if (fs.existsSync(usersFile)) {
        const data = fs.readFileSync(usersFile, 'utf-8');
        users = data ? JSON.parse(data) : [];
    }

    const userExists = users.find(u => u.username === username && u.password === password);

    if (userExists) {
        req.session.user = username; // set session
        res.redirect('/categorypage.html');
    } else {
        // redirect back to login with error
        res.redirect('/login.html?error=Invalid%20credentials');
    }
});

// Logout route
app.get('/logout', (req, res) => {
    req.session.destroy(err => {
        if(err) return res.send('Error logging out');
        res.redirect('/project1.html'); // home page
    });
});

// Middleware to protect categorypage.html
app.get('/categorypage.html', (req, res, next) => {
    if (req.session.user) {
        next(); // allow access
    } else {
        res.redirect('/login.html'); // redirect if not logged in
    }
});

// Admin route (view all users)
app.get('/admin', (req, res) => {
    const usersFile = path.join(__dirname, 'users.json');
    let users = [];
    if (fs.existsSync(usersFile)) {
        const data = fs.readFileSync(usersFile, 'utf-8');
        users = data ? JSON.parse(data) : [];
    }

    let tableRows = users.map((u, i) =>
        `<tr>
            <td>${i + 1}</td>
            <td>${u.username}</td>
            <td>${u.password}</td>
        </tr>`).join('');

    let html = `
    <!DOCTYPE html>
    <html>
    <head>
        <title>Admin - Users Table</title>
        <style>
            body { font-family: 'Poppins', sans-serif; background: #f2f2f2; padding: 50px; }
            h2 { text-align: center; }
            table { border-collapse: collapse; width: 60%; margin: 30px auto; background: #fff; }
            th, td { border: 1px solid #333; padding: 10px; text-align: center; }
            th { background-color: #007bff; color: white; }
            tr:nth-child(even) { background-color: #f9f9f9; }
        </style>
    </head>
    <body>
        <h2>All Registered Users</h2>
        <table>
            <tr>
                <th>#</th>
                <th>Username</th>
                <th>Password</th>
            </tr>
            ${tableRows}
        </table>
    </body>
    </html>
    `;
    res.send(html);
});

// Catch-all 404 route
app.use((req, res) => {
    res.status(404).send('Page not found. <a href="login.html">Go to Login</a>');
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
