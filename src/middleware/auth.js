const cookieParser = require("cookie-parser");
const jwt = require("jsonwebtoken");

const config = process.env;

// Auth Middleware for Admin Users
const auth = [
    cookieParser(),
    async (req, res, next) => {
        try {
            // Ensure JWT exists in cookies
            const token = req.cookies['jwt'];
            if (!token) {
                req.flash('danger', 'No token found. Please login.');
                return res.redirect('/login');
            }

            // Verify the token asynchronously
            const decoded = await jwt.verify(token, 'ADMIN');

            // Attach decoded data to the request object if necessary
            req.authUserId = decoded.sub; // Assuming 'sub' is the user ID in the token
            
            return next(); // Proceed to the next middleware or route handler
        } catch (err) {
            // Clear cookies if there's an error (expired token, invalid token, etc.)
            res.clearCookie("jwt");
            res.clearCookie("user");
            
            // Handle different types of JWT errors
            if (err.name === 'TokenExpiredError') {
                req.flash('danger', 'Token expired. Please login again.');
            } else {
                req.flash('danger', 'Invalid token. Please login again.');
            }
            
            return res.redirect('/login'); // Redirect to login if the token is invalid or expired
        }
    }
];

// Auth Middleware for API Users (Authorization with custom header)
const auth1 = [
    cookieParser(),
    async (req, res, next) => {
        try {
            // Ensure JWT exists in headers
            const token = req.headers._token;
            if (!token) {
                return res.status(401).send({ message: 'Authorization token missing.' });
            }

            // Verify the token asynchronously
            const decoded = await jwt.verify(token, 'API');
            
            // Attach decoded data to the request object if necessary
            req.authUserId = decoded.sub; // Assuming 'sub' is the user ID in the token

            return next(); // Proceed to the next middleware or route handler
        } catch (err) {
            // Handle errors related to the token
            return res.status(401).send({ message: 'Unauthorized: Invalid token.' });
        }
    }
];

// Guest Middleware (Redirect logged-in users)
const guest = [
    cookieParser(),
    async (req, res, next) => {
        try {
            // Check if the user is already logged in (has a valid token)
            const token = req.cookies['jwt'];
            if (token) {
                // If the token is valid, the user is already logged in
                const decoded = await jwt.verify(token, 'ADMIN');
                req.flash('success', 'You are already logged in.');
                return res.redirect('/'); // Redirect to home if logged in
            }
            return next(); // Proceed to next middleware or route handler
        } catch (err) {
            // If there's an error with the JWT, proceed as if the user is not logged in
            return next();
        }
    }
];

module.exports = { auth, guest, auth1 };
