import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import connection from './database/db.js';  // Import your database connection function
import routes from './routes/route.js';      // Import your routes
import dotenv from 'dotenv';                 // For loading environment variables

// Load environment variables
dotenv.config();

// Deriving __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

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
app.use('/uploads', express.static(join(__dirname, 'public/uploads')));

// Set up EJS as the templating engine
app.set('view engine', 'ejs');
app.set('views', join(__dirname, 'views')); // Set the views directory

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
