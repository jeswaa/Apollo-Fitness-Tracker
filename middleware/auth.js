// middleware/auth.js
export const isAuthenticated = (req, res, next) => {
    if (req.session.userId) { // Check if user is logged in
        res.locals.isAuthenticated = true; // Set variable for EJS
        return next(); // User is authenticated, proceed to the next middleware/route
    }
    res.locals.isAuthenticated = false; // Not authenticated
    req.flash('error_msg', 'You must be logged in to access this page.'); // Flash message
    return res.redirect('/login'); // Redirect to login page if not authenticated
};
