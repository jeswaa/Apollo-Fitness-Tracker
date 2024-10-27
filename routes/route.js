import express from 'express';
import multer from 'multer';
import path from 'path';
import User from '../models/User.js';
import Workout from '../models/Workout.js';
import UserWorkout from '../models/Workout-duration.js';
import Food from '../models/Food.js';
import Meal from '../models/Meal.js';
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
//binura yung sa user-dashboard pinalitan basta yung may mga user


// Dashboard route
router.get('/user-dashboard', (req, res) => {
    // Check if user is authenticated
    if (req.session.user) {
        // User is authenticated
        res.render('user-dashboard', { user: req.session.user }); // Pass user data to the view
    } else {
        // User is not authenticated
        res.redirect('/login'); // Redirect to login page
    }
});
//user nnutrition route
router.get('/user-nutrition', (req, res) => {
    // Check if user is authenticated
    if (req.session.user) {
        // User is authenticated
        res.render('user-nutrition', { user: req.session.user }); // Pass user data to the view
    } else {
        // User is not authenticated
        res.redirect('/login'); // Redirect to login page
    }
});
//user workout route
router.get('/user-workout', (req, res) => {
    // Check if user is authenticated
    if (req.session.user) {
        // User is authenticated
        res.render('user-workout', { user: req.session.user }); // Pass user data to the view
    } else {
        // User is not authenticated
        res.redirect('/login'); // Redirect to login page
    }
});
//user profile route
router.get('/user-profile', (req, res) => {
    // Check if user is authenticated
    if (req.session.user) {
        // User is authenticated
        res.render('user-profile', { user: req.session.user }); // Pass user data to the view
    } else {
        // User is not authenticated
        res.redirect('/login'); // Redirect to login page
    }
});

router.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Error logging out:', err);
            req.flash('error_msg', 'Error logging out.');
            return res.redirect('/'); // Or admin dashboard if needed
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


        // Render the view with counts passed as variables
        renderWithFlash(res, 'adminDashboard', req, { userCount, workoutCount,FoodCount });
    } catch (error) {
        console.error('Error fetching counts:', error);
        req.flash('error_msg', 'Error loading dashboard.');
        res.redirect('/'); // Redirect to home on error
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
        const workouts = await Workout.find(); // Fetch workouts from the database
        res.render('user-workout', { workouts }); // Pass the workouts to the EJS template
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

        req.flash('success_msg', 'Workout updated successfully!');
        res.redirect('/add-workout');
    } catch (error) {
        console.error('Error updating workout:', error);
        req.flash('error_msg', 'Error updating workout: ' + error.message);
        res.redirect(`/workouts/${req.params.id}`);
    }
});

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

// Add New Food
router.post('/add-food', upload.single('image'), async (req, res) => {
    const { name, description, calories, carbs, protein , fats } = req.body;
    const imagePath = req.file ? `/uploads/${req.file.filename}` : '';

    try {
        const newFood = new Food({ name, description, image: imagePath, calories, carbs, protein , fats });
        await newFood.save();

        req.flash('success_msg', 'Food added successfully!');
        res.redirect('/add-food');
    } catch (error) {
        console.error('Error adding food:', error);
        req.flash('error_msg', 'Error adding food: ' + error.message);
        res.redirect('/add-food');
    }
});

// Fetch, Update, and Delete Foods
router.get('/foods', async (req, res) => {
    try {
        const foods = await Food.find();
        res.json(foods);
    } catch (error) {
        console.error('Error fetching foods:', error);
        res.status(500).json({ error: 'Failed to fetch foods' });
    }
});

router.get('/foods/:id', async (req, res) => {
    try {
        const food = await Food.findById(req.params.id);
        if (!food) return res.status(404).json({ error: 'Food not found' });

        res.json(food);
    } catch (error) {
        console.error('Error fetching food:', error);
        res.status(500).json({ error: 'Failed to fetch food' });
    }
});

router.put('/foods/:id', upload.single('image'), async (req, res) => {
    const { name, description, calories, nutrients } = req.body;
    const imagePath = req.file ? `/uploads/${req.file.filename}` : undefined;

    try {
        const updatedFood = await Food.findByIdAndUpdate(
            req.params.id,
            { name, description, calories, nutrients, ...(imagePath && { image: imagePath }) },
            { new: true, runValidators: true }
        );

        if (!updatedFood) return res.status(404).json({ error: 'Food not found' });

        req.flash('success_msg', 'Food updated successfully!');
        res.redirect('/add-food');
    } catch (error) {
        console.error('Error updating food:', error);
        req.flash('error_msg', 'Error updating food: ' + error.message);
        res.redirect(`/foods/${req.params.id}`);
    }
});

router.delete('/foods/:id', async (req, res) => {
    try {
        const deletedFood = await Food.findByIdAndDelete(req.params.id);
        if (!deletedFood) return res.status(404).send('Food not found');

        res.sendStatus(204); // No content
    } catch (error) {
        console.error('Error deleting food:', error);
        res.status(500).json({ error: 'Failed to delete food' });
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

// User/Admin Login
router.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        if (username === 'admin' && password === 'admin12345') {
            req.session.user = { username: 'Admin', fullname: 'Admin Name', email: 'admin@example.com' }; // Store admin info
            req.flash('success_msg', 'Welcome, Admin!');
            return res.redirect('/admin-dashboard');
        }

        const user = await User.findOne({ username });
        if (user && await bcrypt.compare(password, user.password)) {
            req.session.user = { username: user.username, fullname: user.fullname, email: user.email }; // Store user info
            req.flash('success_msg', 'Successfully logged in.');
            res.redirect('/user-dashboard');
        } else {
            req.flash('error_msg', 'Invalid username or password.');
            res.redirect('/login');
        }
    } catch (error) {
        console.error('Error logging in:', error);
        req.flash('error_msg', 'Error logging in: ' + error.message);
        res.redirect('/login');
    }
});

// Add New User Workout
router.post('/add-users-workout', async (req, res) => {
    const { workoutId, duration } = req.body; // Include duration here
    const usernameOrEmail = req.session.user?.username || req.session.user?.email;

    console.log(`Received workoutId: ${workoutId}`);
    console.log(`Received duration: ${duration}`);
    console.log(`Session data - Username/Email: ${usernameOrEmail}`);

    try {
        // Fetch the user
        const user = await User.findOne({
            $or: [{ username: usernameOrEmail }, { email: usernameOrEmail }]
        });

        if (!user) {
            console.error('User not found.');
            req.flash('error_msg', 'User not found');
            return res.redirect('/user-workout');
        }

        console.log(`User found: ${user._id}`);

        // Fetch the workout details
        const workout = await Workout.findById(workoutId);
        if (!workout) {
            console.error('Workout not found.');
            req.flash('error_msg', 'Workout not found');
            return res.redirect('/user-workout');
        }

        console.log(`Workout found: ${workout.name}`);

        // Create a new UserWorkout entry
        const newUserWorkout = new UserWorkout({
            userId: user._id,
            name: workout.name,
            description: workout.description,
            intensity: workout.intensity,
            image: workout.image,
            duration: duration, // Use the duration from the request body
            createdAt: new Date()
        });

        await newUserWorkout.save();
        console.log('New UserWorkout added:', newUserWorkout);

        req.flash('success_msg', 'Workout added successfully to your log!');
        res.redirect('/user-workout');
    } catch (error) {
        console.error('Error adding user workout:', error);
        req.flash('error_msg', 'Error adding workout: ' + error.message);
        res.redirect('/user-workout');
    }
});

router.get('/workouts-user', async (req, res) => {
    console.log('Fetching workouts...');
    try {
        const workouts = await UserWorkout.find().populate('userId'); // Assuming userId is the reference to the User table
        console.log('Workouts fetched:', workouts);
        res.json(workouts);
    } catch (error) {
        console.error('Error fetching workouts:', error);
        res.status(500).json({ error: 'Failed to fetch workouts', details: error.message });
    }
});




// POST endpoint to add meal to the tracker basta sa save db in meal to
router.post('/meal-tracker', async (req, res) => {
    const { userId, food } = req.body;

    // Validate input
    if (!userId || !food) {
        return res.status(400).json({ message: 'User ID and food information are required' });
    }

    try {
        const newMeal = new Meal({
            userId: userId,
            name: food.name,
            description: food.description,
            calories: food.calories,
            carbs: food.carbs,
            protein: food.protein,
            fats: food.fats,
            date: new Date() // Store the current date
        });

        await newMeal.save();
        res.status(201).json(newMeal); // Respond with the created meal
    } catch (error) {
        console.error('Error saving meal:', error.message); // Log error message
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Route to get meals for a specific user
router.get('/api/meal-tracker', async (req, res) => {
    const { userId } = req.query; // Get user ID from query parameters

    try {
        const meals = await Meal.find({ userId }); // Find meals for the user
        res.json(meals);
    } catch (error) {
        console.error('Error fetching meals:', error);
        res.status(500).json({ message: 'Error fetching meals' });
    }
});
// In your router file

import Review from '../models/Reviews.js'; // Import the Review model

// Add a new review
router.post('/reviews', async (req, res) => {
    const { rating, comment } = req.body;

    // Check for missing fields
    if (!rating || !comment) {
        console.error('Validation Error: Missing fields', req.body);
        return res.status(400).json({ message: 'Rating and comment are required' });
    }

    try {
        const newReview = new Review({
            rating,
            comment,
        });

        await newReview.save();
        req.flash('success_msg', 'Review added successfully!');
        res.status(201).json(newReview);
    } catch (error) {
        console.error('Error adding review:', error);
        req.flash('error_msg', 'Error adding review: ' + error.message);
        res.status(500).json({ message: 'Failed to add review', error: error.message });
    }
});

// Get all reviews
router.get('/reviews', async (req, res) => {
    try {
        const reviews = await Review.find(); // Fetch all reviews
        res.json(reviews);
    } catch (error) {
        console.error('Error fetching reviews:', error);
        res.status(500).json({ message: 'Failed to fetch reviews' });
    }
});

// Delete a review
router.delete('/reviews/:id', async (req, res) => {
    try {
        const deletedReview = await Review.findByIdAndDelete(req.params.id);
        if (!deletedReview) return res.status(404).json({ message: 'Review not found' });

        res.sendStatus(204); // No content
    } catch (error) {
        console.error('Error deleting review:', error);
        res.status(500).json({ message: 'Failed to delete review' });
    }
});


export default router;
