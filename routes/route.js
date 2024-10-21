import express from 'express';
import multer from 'multer';
import path from 'path';
import User from '../models/User.js';
import Workout from '../models/Workout.js';
import bcrypt from 'bcrypt'; 
import flash from 'connect-flash'; 
import session from 'express-session'; 

const router = express.Router();

// Setup for Multer storage and file filtering
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/uploads/'); // Directory where files will be stored
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`);
    }
});



const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
        return cb(null, true);
    } else {
        cb('Error: Only images are allowed (jpeg, jpg, png)');
    }
};

const upload = multer({ storage, fileFilter });

// Set up session and flash middleware
router.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: true
}));
router.use(flash());

// Helper function to handle rendering with flash messages
const renderWithFlash = (res, view, req) => {
    const successMessage = req.flash('success_msg');
    const errorMessage = req.flash('error_msg');
    res.render(view, { successMessage, errorMessage });
};

// Route to render the home page
router.get('/', (req, res) => {
    renderWithFlash(res, 'index', req);
});
//Login Page
router.get('/login', (req, res) => {
    res.render('login');
});
// Signup Page
router.get('/signup', (req, res) => {
    res.render('signup');
});
// Admin Dashboard
router.get('/admin-dashboard', (req, res) => {
    renderWithFlash(res, 'adminDashboard', req);
});

// Admin: Add Workout
router.get('/add-workout', (req, res) => {
    res.render('adminWorkout');
});

router.post('/add-workout', upload.single('image'), async (req, res) => {
    const { name, description, intensity } = req.body;
    const imagePath = req.file ? `/uploads/${req.file.filename}` : '';

    try {
        const newWorkout = new Workout({
            name,
            description,
            image: imagePath,
            intensity
        });

        await newWorkout.save();
        req.flash('success_msg', 'Workout added successfully!');
        res.redirect('/admin-dashboard');
    } catch (error) {
        console.error('Error adding workout:', error);
        req.flash('error_msg', 'Error adding workout: ' + error.message);
        res.redirect('/add-workout'); // Redirect back to the add workout page on error
    }
});

// Get a specific workout by ID
router.get('/workouts/:id', async (req, res) => {
    try {
        const workout = await Workout.findById(req.params.id);
        if (!workout) return res.status(404).json({ error: 'Workout not found' });
        res.json(workout);
    } catch (error) {
        console.error('Error fetching workout:', error);
        res.status(500).json({ error: 'Failed to fetch workout' });
    }
});

// Update a workout
router.put('/workouts/:id', upload.single('image'), async (req, res) => {
    const { name, description, intensity } = req.body;
    const imagePath = req.file ? `/uploads/${req.file.filename}` : undefined;

    try {
        const updatedWorkout = await Workout.findByIdAndUpdate(
            req.params.id,
            {
                name,
                description,
                intensity,
                ...(imagePath && { image: imagePath }) // Update image only if provided
            },
            { new: true, runValidators: true } // Ensures validations are checked during update
        );

        if (!updatedWorkout) {
            return res.status(404).json({ error: 'Workout not found' });
        }
        req.flash('success_msg', 'Workout updated successfully!');
        res.redirect('/admin-dashboard');
    } catch (error) {
        console.error('Error updating workout:', error);
        req.flash('error_msg', 'Error updating workout: ' + error.message);
        res.redirect(`/workouts/${req.params.id}`); // Redirect back to the workout edit page on error
    }
});

// Delete a workout
router.delete('/workouts/:id', async (req, res) => {
    try {
        const deletedWorkout = await Workout.findByIdAndDelete(req.params.id);
        if (!deletedWorkout) return res.status(404).send('Workout not found');
        res.sendStatus(204); // No content
    } catch (error) {
        console.error('Error deleting workout:', error);
        res.status(500).json({ error: 'Failed to delete workout' });
    }
});

// Route to fetch all workouts
router.get('/workouts', async (req, res) => {
    try {
        const workouts = await Workout.find(); // Fetch all workouts from the database
        res.json(workouts); // Send data as JSON
    } catch (error) {
        console.error('Error fetching workouts:', error);
        res.status(500).json({ error: 'Failed to fetch workouts' });
    }
});

// Admin: Add Food
router.get('/add-food', (req, res) => {
    res.render('adminNutrition');
});

// User Signup
router.post('/signup', async (req, res) => {
    const { fullname, email, username, password } = req.body;

    try {
        const hashedPassword = await bcrypt.hash(password, 10); // Hash password
        const newUser = new User({ fullname, email, username, password: hashedPassword });
        await newUser.save();

        req.flash('success_msg', 'Successfully registered! You can now log in.');
        res.redirect('/login');
    } catch (error) {
        console.error('Error registering user:', error);
        if (error.code === 11000) {
            return res.status(409).send('User already exists with this email or username.');
        }
        req.flash('error_msg', 'Error registering user: ' + error.message);
        res.redirect('/signup'); // Redirect back to signup on error
    }
});

// User/Admin Login
router.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        if (username === 'admin' && password === 'admin12345') {
            req.flash('success_msg', 'Welcome, Admin!');
            return res.redirect('/admin-dashboard');
        }

        const user = await User.findOne({ username });
        if (user && await bcrypt.compare(password, user.password)) {
            req.flash('success_msg', 'Successfully logged in.');
            res.redirect('/user-dashboard');
        } else {
            req.flash('error_msg', 'Invalid username or password.');
            res.redirect('/login');
        }
    } catch (error) {
        console.error('Error logging in user:', error);
        req.flash('error_msg', 'Error logging in user: ' + error.message);
        res.redirect('/login'); // Redirect back to login on error
    }
});

// USER DASHBOARD
router.get('/user-dashboard', (req, res) => {
    res.render('user-dashboard');
});


export default router;
