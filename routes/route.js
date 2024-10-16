import express from 'express';
import User from '../models/User.js';
import bcrypt from 'bcrypt'; 
import flash from 'connect-flash'; 
import session from 'express-session'; 

const router = express.Router();

// Set up session and flash middleware
router.use(session({ secret: 'your-secret-key', resave: false, saveUninitialized: true }));
router.use(flash());

// Route to render the index.ejs file
router.get('/', (req, res) => {
    res.render('index'); 
});

// Route to render the login page
router.get('/login', (req, res) => {
    const successMessage = req.flash('success_msg');
    res.render('login', { successMessage }); 
});

// Route to render the signup page
router.get('/signup', (req, res) => {
    res.render('signup'); 
});


// Admin-Side

// Route to render the dashboard page
router.get('/admin-dashboard', (req, res) => {
  res.render('adminDashboard');
});

// Route to render the add workout page
router.get('/add-workout', (req, res) => {
    res.render('adminWorkout'); 
});

// Route to render the add workout page
router.get('/add-food', (req, res) => {
    res.render('adminNutrition'); 
});

// POST route to handle signup form submission
router.post('/signup', async (req, res) => {
    const { fullname, email, username, password } = req.body;

    try {
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        const newUser = new User({
            fullname,
            email,
            username,
            password: hashedPassword
        });

        await newUser.save();

        // Set flash message
        req.flash('success_msg', 'Successfully registered! You can now log in.');

        // Redirect to login page
        res.redirect('/login');
    } catch (error) {
        console.error('Error registering user:', error);

        if (error.code === 11000) { // Duplicate key error
            return res.status(409).send('User already exists with this email or username.');
        }

        res.status(500).send('Error registering user: ' + error.message);
    }
});

// POST route to handle login form submission
router.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        // Find the user by username
        const user = await User.findOne({ username });

        // Check if the user exists and if the password matches
        if (user && (await bcrypt.compare(password, user.password))) {
            // Set flash message for successful login
            req.flash('success_msg', 'Successfully logged in.');

            // Redirect to dashboard
            res.redirect('/dashboard');
        } else {
            // Handle invalid login attempt
            req.flash('error_msg', 'Invalid username or password.');
            res.redirect('/login');
        }
    } catch (error) {
        console.error('Error logging in user:', error);
        res.status(500).send('Error logging in user: ' + error.message);
    }
});

export default router;
