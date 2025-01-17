const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const moment = require('moment');

const User = require('../../schemas/user.js');
const Enquiry = require('../../schemas/enquiry.js');
const Product = require('../../schemas/product.js');
const Category = require('../../schemas/category.js');
const Blog = require('../../schemas/blog.js');
const Blogcategory = require('../../schemas/blogcategory.js');
const Tag = require('../../schemas/tags.js');
const Faq = require('../../schemas/faq.js');
const Application = require('../../schemas/application.js');
const Setting = require('../../schemas/settings.js');
const Role = require('../../schemas/role.js');
const mongoose = require('mongoose');
const logger = require('../../logger.js');

const multer = require('multer');
const fs = require('fs');
const slugify = require('slugify');
const path = require('path');

// Login
exports.login = async (req, res) => {
    const success = req.flash('success');
    const danger = req.flash('danger');
    const info = req.flash('info');

    return res.status(200).render('pages/login', { success, danger, info });
};

// Dashboard
exports.dashboard = async (req, res) => {
    const user = req.cookies['user'];

    const success = req.flash('success');
    const danger = req.flash('danger');
    const info = req.flash('info');

    const enquiry = {};
    var current_date = moment(new Date()).format('YYYY-MM-DD HH:m:s');

    var week_date = moment().subtract(1, 'weeks').startOf('isoWeek').format('YYYY-MM-DD HH:m:s');
    var month_date = moment().subtract(1, 'months').startOf('isoMonth').format('YYYY-MM-DD HH:m:s');
    var year_date = moment().subtract(1, 'years').startOf('isoYear').format('YYYY-MM-DD HH:m:s');

    const todayStart = new Date().setUTCHours(0, 0, 0, 0);
    const todayEnd = new Date().setUTCHours(23, 59, 59, 999);

    const today = await Enquiry.count({ createdAt: { $gte: todayStart, $lte: todayEnd } });
    const week = await Enquiry.count({ createdAt: { $gte: week_date, $lt: current_date } });
    const month = await Enquiry.count({ createdAt: { $gte: month_date, $lt: current_date } });
    const year = await Enquiry.count({ createdAt: { $gte: year_date, $lt: current_date } });

    enquiry.today = today;
    enquiry.week = week;
    enquiry.month = month;
    enquiry.year = year;

    const counts = {};
    const enquiry_count = await Enquiry.count();
    const product_count = await Product.count();
    const category_count = await Category.count();
    const blog_count = await Blog.count();
    const blogcategory_count = await Blogcategory.count();
    const tag_count = await Tag.count();
    const faq_count = await Faq.count();
    const application_count = await Application.count();

    counts.product = product_count;
    counts.category = category_count;
    counts.blog = blog_count;
    counts.blogcategory = blogcategory_count;
    counts.tag = tag_count;
    counts.faq = faq_count;
    counts.application = application_count;
    counts.enquiry = enquiry_count;

    Setting.count().then(count => {
        if (count < 1) {
            const s = {};
            s.title = 'Admin Panel';
            const p = Setting.create(s);
        }
    });

    return res.status(200).render('pages/dashboard', { success, danger, info, user, page_title: 'Dashboard', enquiry: enquiry, counts: counts, page_url: 'dashboard' });
}

// Logout
exports.logout = (req, res) => {
    res.clearCookie("jwt");
    res.clearCookie("user");

    req.flash('success', 'You are successfully logged out');
    return res.status(200).redirect('/login');
};

// User Login
exports.user_login = async (req, res) => {

    res.clearCookie("jwt");
    res.clearCookie("user");
    // Get user input
    const { email, password } = req.body;

    // Validate user    
    if (!(email && password)) {
        req.flash('danger', 'All input is required');
        res.redirect('/login');
    }

    const user = await User.findOne({ email });
    if (user && (await bcrypt.compare(password, user.password))) {
        // Create token
        const token = jwt.sign(
            { user_id: user.id, email },
            'ADMIN',
            {
                expiresIn: "10h",
            }
        );

        // user token
        user.token = token;

        // user
        res.cookie('jwt', token);
        res.cookie('user', user);

        req.flash('success', 'You are successfully logged in');
        res.redirect('/admin');
    } else {
        req.flash('danger', 'Invalid Credentials');
        res.redirect('/login');
    }
};

// User Register
exports.register = async (req, res) => {

    const name = 'admin';
    const email = 'admin@gmail.com';
    const password = '$2a$10$d9DMfXRaTN00lU9Gt5BENu1SWp9YO3zLwTrZIt.ErCE78OtqE3P9C';

    const oldUser = await User.findOne({ email });

    if (oldUser) {
        return res.status(409).send({ message: "User Already Exist. Please Login" });
    }

    // Create user in our database
    const user_detail = {};
    user_detail.name = name;
    user_detail.email = email.toLowerCase(); // sanitize: convert email to lowercase
    user_detail.password = password;

    User.create(user_detail)
        .then(data => {
            res.redirect('/login');
        })
        .catch(err => {
            return res.status(500).send({
                message:
                    err.message || "Some error occurred while creating the Product."
            });
        });

};

// User
exports.user = (req, res) => {
    const user = req.cookies['user'];
    const success = req.flash('success');
    const danger = req.flash('danger');
    const info = req.flash('info');

    return res.status(200).render('pages/user', { user, success, danger, info, page_title: 'User', page_url: 'user' });
};

// Password Update
exports.passwordUpdate = async (req, res) => {

    const { new_password, confirm_password } = req.body;
    const user = req.cookies['user'];

    // Validate Input    
    if (!(new_password && confirm_password)) {
        req.flash('danger', 'All input is required.');
        res.redirect('/user');
    }

    if (!(new_password == confirm_password)) {
        req.flash('danger', 'Confirm password not match.');
        res.redirect('/user');
    }

    //Encrypt user password
    const encryptedPassword = await bcrypt.hash(new_password, 10);
    // Create user in our database
    const user_detail = {};
    user_detail.name = user.name;
    user_detail.email = user.email;
    user_detail.password = encryptedPassword;

    User.updateOne({ _id: user._id }, { $set: user_detail }).then(async (num) => {
        if (num.ok == 1) {
            const update_user = await User.findOne({ _id: user._id });
            // Create token
            const token = jwt.sign(
                { user_id: update_user.id, email: update_user.email },
                'ADMIN',
                {
                    expiresIn: "2h",
                }
            );

            // user token
            update_user.token = token;

            // user
            res.cookie('jwt', token);
            res.cookie('user', update_user);

            req.flash('success', 'Password updated successfully.');
            return res.redirect('/user');
        } else {
            req.flash('danger', `Cannot update password.`);
            res.redirect('/user');
        }
    })
        .catch(err => {
            req.flash('danger', err.message || "Some error occurred.");
            return res.status(500).redirect('/user');
        });

};

// Set up storage for Multer
const storage = multer.diskStorage({
    destination: function (req, file, callback) {
        const dir = "./src/public/upload/user";

        try {
            // Check if the directory exists, and if not, create it
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true }); // Ensure the parent directories are created
            }

            // Proceed to store the file in the directory
            callback(null, dir);
        } catch (err) {
            // Log the error and send it back to the callback
            logger.error(`Error creating upload directory: ${err.message}`);
            callback(new Error('Error creating upload directory.'));
        }
    },
    filename: function (req, file, callback) {
        try {
            // Generate a unique filename based on the fieldname, timestamp, and file extension
            const filename = file.fieldname + '-' + Date.now() + path.extname(file.originalname);
            callback(null, filename); // Pass the filename to the callback
        } catch (err) {
            // Log the error and send it back to the callback
            logger.error(`Error generating filename: ${err.message}`);
            callback(new Error('Error generating filename.'));
        }
    }
});

// Multer upload configuration with additional error handling
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024 // Limit the file size to 10MB
    },
    fileFilter: function (req, file, callback) {
        // Allow only images (jpg, jpeg, png, gif) and PDFs
        const allowedTypes = /jpg|jpeg|png|gif|webp|pdf/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);

        if (extname && mimetype) {
            // Accept the file if it passes the validation
            callback(null, true);
        } else {
            // Reject the file and provide an error message
            logger.warn(`File upload rejected: Invalid file type (only JPG, JPEG, PNG, GIF, and PDF are allowed)`);
            callback(new Error('Invalid file type. Only JPG, JPEG, PNG, GIF, WEBP, and PDF files are allowed.'));
        }
    }
}).single('image'); // Handling single file upload (adjust if needed for multiple files)


// Create a new User Page
exports.add = async (req, res) => {

    const user = req.cookies['user'];
    const roles = await Role.find().select(['name', '_id']);

    const success = req.flash('success');
    const danger = req.flash('danger');
    const info = req.flash('info');

    res.render('pages/user/add', { user, success, danger, info, roles, page_title: 'User Add', page_url: 'user.add' });
};

// Create and Save a new User
exports.create = (req, res) => {

    // Create a User
    upload(req, res, async function (err) {
        const user = {};
        if (err) {
            res.redirect('/user/create');
        }

        if (!req.body.name) {
            req.flash('danger', 'Please enter name.');
            res.redirect('/user/create');
        }
        if (!req.body.email) {
            req.flash('danger', 'Please enter email.');
            res.redirect('/user/create');
        }
        if (!req.body.password) {
            req.flash('danger', 'Please enter password.');
            res.redirect('/user/create');
        }

        user.name = req.body.name;
        user.role = req.body.role;
        user.email = req.body.email.toLowerCase();
        const password = await bcrypt.hash(req.body.password, 10);
        user.password = password;
        // Save user in the database
        User.create(user)
            .then(data => {
                req.flash('success', `User created successfully!`);
                res.redirect('/user');
            })
            .catch(err => {
                req.flash('danger', err.message || 'Some error occurred while creating the User.');
                res.redirect('/user/create');
            });
    })

};


// Retrieve all User from the database.
exports.findAll = (req, res) => {
    const limit = parseInt(req.query.limit) || 10;
    const page = parseInt(req.query.page) || 1;
    const offset = ((page - 1) * limit);
    const user = req.cookies['user'];
    const query = req.query;

    const success = req.flash('success');
    const danger = req.flash('danger');
    const info = req.flash('info');

    const search = req.query.search;
    const condition = search ? { title: { $regex: search, $options: 'i' } } : {};

    User.count(condition).then(count => {
        User.find(condition).skip(offset).limit(limit)
            .then(data => {
                res.render('pages/user/list', {
                    lists: {
                        data: data, current: page, offset: offset,
                        pages: Math.ceil(count / limit)
                    },
                    query: query,
                    user, success, danger, info, page_title: 'User List', page_url: 'user.list', url: req.pathname
                });
            })
            .catch(err => {
                req.flash('danger', err.message || 'Some error occurred while creating the User.');
                res.redirect('/user');
            });
    });
};

// Find a single User with an id
exports.findOne = (req, res) => {
    const id = req.params.id;
    User.findOne({ _id: id })
        .then(data => {
            if (data) {
                return res.send({ data: data });
            } else {
                return res.status(404).send({
                    message: `Cannot find User with id=${id}.`
                });
            }
        })
        .catch(err => {
            return res.status(500).send({
                message: "Error retrieving User with id=" + id
            });
        });
};

exports.edit = async (req, res) => {
    const user = req.cookies['user'];
    const roles = await Role.find().select(['name', '_id']);

    const success = req.flash('success');
    const danger = req.flash('danger');
    const info = req.flash('info');

    const id = req.params.id;
    User.findOne({ _id: id })
        .then(data => {
            if (data) {
                res.render('pages/user/edit', {
                    list: data, user, success, danger, info, roles, page_title: 'User Edit', page_url: 'user.edit'
                });
            } else {
                req.flash('danger', `Cannot find User with id=${id}.`);
                res.redirect('/user');
            }
        })
        .catch(err => {
            req.flash('danger', 'Error updating User with id=' + id);
            res.redirect('/user');
        });
};


// Update a User by the id in the request
exports.update = async (req, res) => {
    const id = req.params.id;

    upload(req, res, async function (err) {
        if (err) {
            res.redirect('/user/edit/' + id);
        }

        const user_detail = {};

        user_detail.name = req.body.name;
        user_detail.email = req.body.email.toLowerCase();
        if (req.body.password) {
            const password = await bcrypt.hash(req.body.password, 10);
            user_detail.password = password;
        }
        user_detail.role = req.body.role;

        User.updateOne({ _id: id }, { $set: user_detail }).then(num => {
            if (num.ok == 1) {
                req.flash('success', `User updated successfully!`);
                res.redirect('/user');
            } else {
                req.flash('danger', `Cannot update User with id=${id}. Maybe User was not found or req.body is empty!`);
                res.redirect('/user/edit/' + id);
            }
        })
            .catch(err => {
                req.flash('danger', 'Error updating User with id=' + id);
                res.redirect('/user/edit/' + id);
            });

    })
};

// Delete a User with the specified id in the request
exports.delete = (req, res) => {
    try {
        const id = req.params.id;

        // Validate the User ID
        if (!id || !mongoose.Types.ObjectId.isValid(id)) {
            req.flash('danger', 'Invalid User ID.');
            logger.warn(`Attempt to delete with invalid ID: ${id}`);
            return res.redirect('/user');
        }

        // Proceed to delete the user
        User.deleteOne({ _id: id })
            .then(result => {
                if (result.deletedCount === 1) {
                    // Successful deletion
                    req.flash('success', `User deleted successfully!`);
                    res.redirect('/user');
                } else {
                    // No document was deleted (User not found)
                    req.flash('danger', `Cannot delete User with id=${id}. Maybe the User was not found!`);
                    logger.warn(`User with ID ${id} not found for deletion.`);
                    res.redirect('/user');
                }
            })
            .catch(err => {
                // Log and handle errors from the database
                logger.error(`Error occurred while deleting User with ID ${id} - ${err.message || 'Unknown error'}`);
                req.flash('danger', `Could not delete User with id=${id}. Please try again later.`);
                res.redirect('/user');
            });
    } catch (err) {
        // Catch unexpected errors and log them
        logger.error(`Unexpected error during delete operation for User with ID ${req.params.id} - ${err.message || 'Unknown error'}`);
        req.flash('danger', 'An unexpected error occurred while attempting to delete the User.');
        res.redirect('/user');
    }
};

// Delete all User from the database.
exports.deleteAll = (req, res) => {
    try {
        // Validate the ID array
        if (!req.body.id || !Array.isArray(req.body.id) || req.body.id.length === 0) {
            req.flash('danger', 'No user IDs provided for deletion.');
            logger.warn('No user IDs provided for deletion.');
            return res.redirect('/user');
        }

        // Validate each ID in the array
        const invalidIds = req.body.id.filter(id => !mongoose.Types.ObjectId.isValid(id));
        if (invalidIds.length > 0) {
            req.flash('danger', `Invalid user IDs: ${invalidIds.join(', ')}`);
            logger.warn(`Invalid user IDs: ${invalidIds.join(', ')}`);
            return res.redirect('/user');
        }

        // Proceed with deletion
        User.deleteMany({ _id: { $in: req.body.id } })
            .then(nums => {
                if (nums.deletedCount > 0) {
                    req.flash('success', `${nums.deletedCount} User(s) were deleted successfully!`);
                    logger.info(`${nums.deletedCount} User(s) deleted successfully.`);
                } else {
                    req.flash('danger', 'No Users were deleted. Please check if the users exist.');
                    logger.warn('No Users were deleted, either due to non-existence or invalid IDs.');
                }
                res.redirect('/user');
            })
            .catch(err => {
                // Log the error and provide a user-friendly message
                logger.error(`Error deleting users: ${err.message || 'Unknown error'}`);
                req.flash('danger', err.message || 'Some error occurred while deleting the Users.');
                res.redirect('/user');
            });

    } catch (err) {
        // Catch any unexpected errors
        logger.error(`Unexpected error occurred while deleting users: ${err.message || 'Unknown error'}`);
        req.flash('danger', err.message || 'An unexpected error occurred while deleting the Users.');
        res.redirect('/user');
    }
};