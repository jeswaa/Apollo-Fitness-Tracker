// routes/route.js
import express from 'express';
const router = express.Router();

// Route to render the index.ejs file
router.get('/', (req, res) => {
  res.render('index');  // This renders 'views/index.ejs'
});

router.get('/login', (req, res) => {
  res.render('login');  // This renders 'views/login.ejs'
});

router.get('/signup', (req, res) => {
  res.render('signup');  // This renders 'views/signup.ejs'
});
<<<<<<< HEAD
=======

router.get('/guest', (req, res) => {
  res.render('guest');  // This renders 'views/geust-page.ejs'
});

//buratburat

>>>>>>> 2eeb7e5b7e911f0989b8cb1a66790012f92bd237
export default router;
