import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import session from 'express-session'; // Import session middleware
import flash from 'connect-flash';     // Import flash middleware
import connection from './database/db.js';  // Import your database connection function
import routes from './routes/route.js';      // Import your routes
import dotenv from 'dotenv';                 // For loading environment variables

// Load environment variables
dotenv.config();

// Derive __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

// Use environment variable for the port or default to 3000
const port = process.env.PORT || 3000;

// Middleware to parse JSON and URL-encoded data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Connect to MongoDB
connection(); // Connects to your MongoDB instance

// Set up session middleware
app.use(
    session({
        secret: process.env.SESSION_SECRET || 'your-secret-key', // Use an environment variable for security
        resave: false,
        saveUninitialized: true,
    })
);

// Set up flash middleware
app.use(flash());

// Middleware to make flash messages available to views
app.use((req, res, next) => {
    res.locals.successMessage = req.flash('success_msg');
    res.locals.errorMessage = req.flash('error_msg');
    next();
});

// Serve static files from the 'public' directory
app.use(express.static('public'));
app.use('/uploads', express.static(join(__dirname, 'public/uploads')));

// Set up EJS as the templating engine
app.set('view engine', 'ejs');
app.set('views', join(__dirname, 'views')); // Set the views directory

// Define routes
app.use('/', routes); // Make sure your routes are defined after session and flash setup

// Handle 404 errors
app.use((req, res, next) => {
    res.status(404).send('404 FILE NOT FOUND');
});

// Start the server
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
