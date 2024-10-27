import express from 'express';
import multer from 'multer';
import path from 'path';
import User from '../models/User.js';
import Workout from '../models/Workout.js';
import UserWorkout from '../models/Workout-duration.js';
import Food from '../models/Food.js';
import bcrypt from 'bcrypt'; 
import flash from 'connect-flash'; 
import session from 'express-session'; 

const router = express.Router();

// Multer Storage Setup
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'public/uploads/'),
    filename: (req, file, cb) => {
        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`;
        cb(null, `${file.fieldname}-${uniqueSuffix}`);
    }
});

const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png/;
    const isValidType = allowedTypes.test(file.mimetype) && allowedTypes.test(path.extname(file.originalname).toLowerCase());

    if (isValidType) cb(null, true);
    else cb('Error: Only images are allowed (jpeg, jpg, png)');
};

const upload = multer({ storage, fileFilter });

// Session & Flash Middleware Setup
router.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: true
}));
router.use(flash());

// Helper to Render Views with Flash Messages
const renderWithFlash = (res, view, req, data = {}) => {
    const successMessage = req.flash('success_msg');
    const errorMessage = req.flash('error_msg');
    res.render(view, { successMessage, errorMessage, ...data });
};

// Routes
router.get('/', (req, res) => renderWithFlash(res, 'index', req));
router.get('/login', (req, res) => res.render('login'));
router.get('/signup', (req, res) => res.render('signup'));
router.get('/add-workout', (req, res) => res.render('adminWorkout'));
router.get('/workout-user', (req, res) => res.render('adminWorkout-duration'));
router.get('/add-food', (req, res) => res.render('adminNutrition'));
router.get('/admin-usertbl', (req, res) => res.render('adminUser'));
router.get('/admin-review', (req, res) => res.render('adminReview'));
router.get('/', (req, res) => res.render('index'));

// Dashboard route
router.get('/user-dashboard', async (req, res) => {
    try {
        const username = req.session.username; // Assuming you store the username in the session
        
        if (!username) {
            return res.status(400).send('No username found in session');
        }

        console.log('Searching for user with username:', username); // Debugging log

        const user = await User.findOne({ username });

        if (!user) {
            console.log('User not found for username:', username);
            return res.status(404).send('User not found');
        }

        res.render('user-dashboard', { user });
    } catch (error) {
        console.error('Error fetching user:', error);
        res.status(500).send('Internal Server Error');
    }
});

router.get('/user-nutrition', (req, res) => {
    if (req.session.user) {
        res.render('user-nutrition', { user: req.session.user });
    } else {
        res.redirect('/login');
    }
});

// User workout route
router.get('/user-workout', (req, res) => {
    if (req.session.user) {
        res.render('user-workout', { user: req.session.user });
    } else {
        res.redirect('/login');
    }
});

// User profile route
router.get('/user-profile', (req, res) => {
    // Check if the user is authenticated
    if (req.session.user) {
        // Render the user profile page with the user's data
        res.render('user-profile', { user: req.session.user });
    } else {
        // If not authenticated, redirect to the login page
        req.flash('error_msg', 'Please log in to access your profile.'); // Optional: use flash messages
        res.redirect('/login');
    }
});


router.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Error logging out:', err);
            req.flash('error_msg', 'Error logging out.');
            return res.redirect('/'); 
        }
        req.flash('success_msg', 'You have successfully logged out.');
        res.redirect('/login');
    });
});

// New search route for foods
router.get('/foods', async (req, res) => {
    const searchQuery = req.query.search || '';
    try {
        const foods = await Food.find({
            $or: [
                { name: { $regex: searchQuery, $options: 'i' } },
                { description: { $regex: searchQuery, $options: 'i' } }
            ]
        });
        res.json(foods);
    } catch (error) {
        console.error('Error fetching foods:', error);
        res.status(500).json({ error: 'Failed to fetch foods' });
    }
});

// Fetch Recent Activities
router.get('/activities', async (req, res) => {
    try {
        const recentUsers = await User.find().sort({ createdAt: -1 }).limit(5);
        const recentWorkouts = await Workout.find().sort({ createdAt: -1 }).limit(5);
        const recentFoods = await Food.find().sort({ createdAt: -1 }).limit(5);

        const activities = [
            ...recentUsers.map(user => ({
                activity: `New user registered: ${user.username}`,
                createdAt: user.createdAt,
            })),
            ...recentWorkouts.map(workout => ({
                activity: `New workout added: ${workout.name}`,
                createdAt: workout.createdAt,
            })),
            ...recentFoods.map(food => ({
                activity: `New food added: ${food.name}`,
                createdAt: food.createdAt,
            }))
        ];

        res.json(activities);
    } catch (error) {
        console.error('Error fetching activities:', error);
        res.status(500).json({ error: 'Failed to fetch activities' });
    }
});

// Fetch All Users
router.get('/users', async (req, res) => {
    try {
        const users = await User.find();
        res.json(users);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

// Admin Dashboard - Fetching User and Workout Counts
router.get('/admin-dashboard', async (req, res) => {
    try {
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
        const userCount = await User.countDocuments({
            isAdmin: { $ne: true },
            lastActive: { $gte: fiveMinutesAgo }
        });
        const workoutCount = await Workout.countDocuments(); 
        const FoodCount = await Food.countDocuments(); 

        renderWithFlash(res, 'adminDashboard', req, { userCount, workoutCount, FoodCount });
    } catch (error) {
        console.error('Error fetching counts:', error);
        req.flash('error_msg', 'Error loading dashboard.');
        res.redirect('/'); 
    }
});

// Add New Workout
router.post('/add-workout', upload.single('image'), async (req, res) => {
    const { name, description, intensity } = req.body;
    const imagePath = req.file ? `/uploads/${req.file.filename}` : '';

    try {
        const newWorkout = new Workout({ name, description, image: imagePath, intensity });
        await newWorkout.save();

        req.flash('success_msg', 'Workout added successfully!');
        res.redirect('/add-workout');
    } catch (error) {
        console.error('Error adding workout:', error);
        req.flash('error_msg', 'Error adding workout: ' + error.message);
        res.redirect('/add-workout');
    }
});

// Fetch, Update, and Delete Workouts
router.get('/workouts', async (req, res) => {
    try {
        const workouts = await Workout.find();
        res.json(workouts);
    } catch (error) {
        console.error('Error fetching workouts:', error);
        res.status(500).json({ error: 'Failed to fetch workouts' });
    }
});

router.get('/user-workout', async (req, res) => {
    try {
        const workouts = await Workout.find();
        res.render('user-workout', { workouts });
    } catch (error) {
        console.error('Error fetching workouts:', error);
        res.status(500).send('Server Error');
    }
});

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

router.put('/workouts/:id', upload.single('image'), async (req, res) => {
    const { name, description, intensity } = req.body;
    const imagePath = req.file ? `/uploads/${req.file.filename}` : undefined;

    try {
        const updatedWorkout = await Workout.findByIdAndUpdate(
            req.params.id,
            { name, description, intensity, ...(imagePath && { image: imagePath }) },
            { new: true, runValidators: true }
        );

        if (!updatedWorkout) return res.status(404).json({ error: 'Workout not found' });
        
        res.json(updatedWorkout);
    } catch (error) {
        console.error('Error updating workout:', error);
        res.status(500).json({ error: 'Failed to update workout' });
    }
});

router.delete('/workouts/:id', async (req, res) => {
    try {
        const deletedWorkout = await Workout.findByIdAndDelete(req.params.id);
        if (!deletedWorkout) return res.status(404).json({ error: 'Workout not found' });

        res.json({ message: 'Workout deleted successfully' });
    } catch (error) {
        console.error('Error deleting workout:', error);
        res.status(500).json({ error: 'Failed to delete workout' });
    }
});

// Add New Food
router.post('/add-food', upload.single('image'), async (req, res) => {
    const { name, description, calories, protein, fats, carbs } = req.body; // Extract all necessary fields
    const imagePath = req.file ? `/uploads/${req.file.filename}` : '';

    try {
        const newFood = new Food({
            name,
            description,
            image: imagePath,
            calories,
            protein,
            fats,   
            carbs 
        });
        await newFood.save();

        req.flash('success_msg', 'Food added successfully!');
        res.redirect('/add-food');
    } catch (error) {
        console.error('Error adding food:', error);
        req.flash('error_msg', 'Error adding food: ' + error.message);
        res.redirect('/add-food');
    }
});

// Fetch All Foods
router.get('/foods', async (req, res) => {
    try {
        const foods = await Food.find();
        res.json(foods);
    } catch (error) {
        console.error('Error fetching foods:', error);
        res.status(500).json({ error: 'Failed to fetch foods' });
    }
});

// Add New User Workout
router.post('/add-users-workout', async (req, res) => {
    const { workoutId } = req.body; // Assuming the workout ID is sent in the request body
    const usernameOrEmail = req.session.user.username || req.session.user.email; // Get user's username or email from session

    try {
        // Fetch the user using the username or email stored in the session
        const user = await User.findOne({
            $or: [
                { username: usernameOrEmail }, // Check by username
                { email: usernameOrEmail }      // Check by email
            ]
        });

        if (!user) {
            req.flash('error_msg', 'User not found');
            return res.redirect('/user-workout'); // Redirect or handle the error appropriately
        }

        // Create a new UserWorkout entry
        const newUserWorkout = new UserWorkout({
            userId: user._id, // Use the user's ID
            workoutId,        // The workout ID passed in the request
            createdAt: new Date() // Optionally add a timestamp
        });

        await newUserWorkout.save();
        req.flash('success_msg', 'Workout added successfully to your log!');
        res.redirect('/user-workout'); // Redirect after successful addition
    } catch (error) {
        console.error('Error adding user workout:', error);
        req.flash('error_msg', 'Error adding workout: ' + error.message);
        res.redirect('/user-workout'); // Redirect or handle the error appropriately
    }
});

// User Signup
router.post('/signup', async (req, res) => {
    const { fullname, email, username, password } = req.body;

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ fullname, email, username, password: hashedPassword });
        await newUser.save();

        req.flash('success_msg', 'Successfully registered! You can now log in.');
        res.redirect('/login');
    } catch (error) {
        console.error('Error registering user:', error);
        if (error.code === 11000) return res.status(409).send('User already exists.');

        req.flash('error_msg', 'Error registering user: ' + error.message);
        res.redirect('/signup');
    }
});
  
// Login User
router.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        const user = await User.findOne({ username });
        if (!user) {
            req.flash('error_msg', 'Invalid username or password');
            return res.redirect('/login');
        }

        const match = await bcrypt.compare(password, user.password);
        if (!match) {
            req.flash('error_msg', 'Invalid username or password');
            return res.redirect('/login');
        }

        req.session.username = user.username; // Store username in session
        req.session.user = user; // Store user details in session

        req.flash('success_msg', 'Login successful');
        res.redirect('/user-dashboard');
    } catch (error) {
        console.error('Error logging in:', error);
        req.flash('error_msg', 'Error logging in: ' + error.message);
        res.redirect('/login');
    }
});

export default router;
