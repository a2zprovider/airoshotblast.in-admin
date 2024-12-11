// middleware/checkPermission.js
const User = require('../schemas/user.js');
const Role = require('../schemas/role.js');

const checkPermission = (resource, action) => {
    return async (req, res, next) => {
        try {
            const user_detail = req.cookies['user'];

            if (!user_detail || !user_detail._id) {
                // If the user information is missing from the cookies, respond with a 401 Unauthorized error.
                req.flash('danger', 'You are not logged in.');
                return res.redirect('/login'); // Or any other appropriate redirect for unauthenticated users
            }

            const userId = user_detail._id; // Assuming user ID is stored in cookies
            const user1 = await User.findById(userId).populate({
                path: 'role',
                populate: {
                    path: 'permissions',
                },
            });

            if (!user1) {
                // If the user is not found in the database, handle it
                req.flash('danger', 'User not found.');
                return res.redirect('/login'); // Redirect to login or another appropriate page
            }

            if (!user1.role) {
                // If the role is not found for the user, handle it
                req.flash('danger', 'User role not found.');
                return res.redirect('/login');
            }

            // Check if the user is an admin or has the required permission
            if (user1.role.name !== 'Admin') {
                const hasPermission = user1.role.permissions.some(
                    (perm) => perm.resource === resource && perm.action === action
                );

                if (!hasPermission) {
                    // If the user doesn't have permission, render an "unauthorized" page
                    const user = req.cookies['user'];
                    const success = req.flash('success');
                    const danger = req.flash('danger');
                    const info = req.flash('info');

                    return res.status(403).render('pages/unauthorise', {
                        user,
                        success,
                        danger,
                        info,
                        page_title: 'Unauthorized',
                        page_url: 'unauthorise',
                    });
                }
            }

            // Proceed to the next middleware or route handler if permission is granted
            next();

        } catch (error) {
            console.error("Error during permission check:", error);
            // Handle any unexpected errors that may occur during the permission check
            res.status(500).json({ message: 'Internal Server Error. Please try again later.' });
        }
    };
};

module.exports = checkPermission;