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

router.get('/guest', (req, res) => {
  res.render('guest');  // This renders 'views/geust-page.ejs'
});

//buratburat

export default router;
