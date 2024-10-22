import express from 'express';
import multer from 'multer';
import path from 'path';
import User from '../models/User.js';
import Workout from '../models/Workout.js';
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
router.get('/add-food', (req, res) => res.render('adminNutrition'));
router.get('/admin-usertbl', (req, res) => res.render('adminUser'));
router.get('/user-dashboard', (req, res) => res.render('user-dashboard'));

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
        console.error('Error logging in:', error);
        req.flash('error_msg', 'Error logging in: ' + error.message);
        res.redirect('/login');
    }
});

export default router;
