// server.js
import express from 'express';
import connection from './database/db.js';  // Import your database connection function
import routes from './routes/route.js';      // Import your routes
import dotenv from 'dotenv';                 // For loading environment variables
import path from 'path';                      // For handling file and directory paths

// Load environment variables
dotenv.config();

const app = express();

// Use environment variable for the port or default to 3000
const port = process.env.PORT || 3000;

// Middleware to parse JSON and URL-encoded data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Connect to MongoDB
connection(); // Assuming this connects to your MongoDB instance

// Serve static files from the 'public' directory
app.use(express.static('public'));

// Set up EJS as the templating engine
app.set('view engine', 'ejs');
app.set('views', path.join(path.resolve(), 'views')); // Set the views directory

// Define routes
app.use('/', routes);

// Handle 404 errors
app.use((req, res, next) => {
    res.status(404).send("404 FILE NOT FOUND");
});

// Start the server
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
