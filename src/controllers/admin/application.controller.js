const Application = require('../../schemas/application.js');
const Country = require('../../schemas/country.js');

const multer = require('multer');
const fs = require('fs');
const slugify = require('slugify');
const path = require('path');
const mongoose = require('mongoose');
const logger = require('../../logger.js');

// Set up storage for Multer
const storage = multer.diskStorage({
    destination: function (req, file, callback) {
        const dir = "./src/public/upload/application";

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
        const allowedTypes = /jpg|jpeg|png|gif|pdf/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);

        if (extname && mimetype) {
            // Accept the file if it passes the validation
            callback(null, true);
        } else {
            // Reject the file and provide an error message
            logger.warn(`File upload rejected: Invalid file type (only JPG, JPEG, PNG, GIF, and PDF are allowed)`);
            callback(new Error('Invalid file type. Only JPG, JPEG, PNG, GIF, and PDF files are allowed.'));
        }
    }
}).single('image'); // Handling single file upload (adjust if needed for multiple files)

// Create a new Application 
exports.add = async (req, res) => {
    try {
        // Retrieve user information from cookies (fallback to null if not found)
        const user = req.cookies['user'] || null;

        // Retrieve all countries from the database (catch errors)
        const countries = await Country.find().catch((err) => {
            logger.error(`Error fetching countries: ${err.message || 'Unknown error'}`);
            return []; // Return an empty array if fetching countries fails
        });

        // Fetch flash messages for success, danger, and info
        const success = req.flash('success');
        const danger = req.flash('danger');
        const info = req.flash('info');

        // Render the page with the fetched data
        return res.render('pages/application/add', {
            user,
            success,
            danger,
            info,
            countries, // Even if empty, countries will be passed safely
            page_title: 'Application Add',
            page_url: 'application.add'
        });

    } catch (err) {
        // Log the error for debugging purposes
        logger.error(`Error loading the 'add' page for Application: ${err.message || 'Unknown error'}`);

        // Set a flash message to inform the user of the issue
        req.flash('danger', err.message || 'An error occurred while loading the Application add page.');

        // Redirect to a fallback route or render an error page
        return res.redirect('/application'); // You could also render an error page
    }
};

// Create and Save a new Application
exports.create = (req, res) => {

    try {
        // Create a new Application using multer to handle file uploads
        upload(req, res, async function (err) {
            // Check if there was an error with the upload
            if (err) {
                logger.error(`File upload error: ${err.message || 'Unknown error'}`);
                req.flash('danger', 'Error uploading file. Please try again.');
                return res.redirect('/application/create');
            }

            // Initialize the application object
            const application = {};

            // Validate title
            if (!req.body.title) {
                req.flash('danger', 'Please enter a title.');
                return res.redirect('/application/create');
            }
            application.title = req.body.title;

            // Validate description
            if (!req.body.description) {
                req.flash('danger', 'Please enter a description.');
                return res.redirect('/application/create');
            }
            application.description = req.body.description;

            // Slugify the title or use the provided slug
            application.slug = req.body.slug ? slugify(req.body.slug, { lower: true }) : slugify(req.body.title, { lower: true });

            // Optional fields
            application.except = req.body.except || null;
            application.country = req.body.country || null;
            application.seo_title = req.body.seo_title || null;
            application.seo_keywords = req.body.seo_keywords || null;
            application.seo_description = req.body.seo_description || null;

            // Handle image file if it exists
            if (req.file) {
                application.image = req.file.filename;
            }

            // Save the application to the database
            await Application.create(application);

            // Success message
            req.flash('success', 'Application created successfully!');
            return res.redirect('/application');

        });
    } catch (error) {
        // Log the error and set a flash message for the user
        logger.error(`Error creating application: ${error.message || 'Unknown error'}`);

        // Flash the error message to the user
        req.flash('danger', error.message || 'An error occurred while creating the Application. Please try again.');

        // Redirect back to the create page with an error message
        return res.redirect('/application/create');
    }
};


// Retrieve all Applications from the database.
exports.findAll = async (req, res) => {
    try {
        // Parse query parameters with default values
        const limit = parseInt(req.query.limit) || 10;
        const page = parseInt(req.query.page) || 1;
        const offset = (page - 1) * limit;
        const user = req.cookies['user'];
        const query = req.query;

        // Flash messages for notifications
        const success = req.flash('success');
        const danger = req.flash('danger');
        const info = req.flash('info');

        // Search condition
        const search = req.query.search;
        const condition = search ? { title: { $regex: search, $options: 'i' } } : {};

        // Validate limit and page parameters
        if (isNaN(limit) || limit <= 0 || limit > 1000) {
            req.flash('danger', 'Invalid limit value. Please provide a limit between 1 and 1000.');
            logger.warn(`Invalid limit value: ${limit}`);
            return res.redirect('/application');
        }

        if (isNaN(page) || page <= 0) {
            req.flash('danger', 'Invalid page number. Please provide a positive page number.');
            logger.warn(`Invalid page value: ${page}`);
            return res.redirect('/application');
        }

        // Count the total applications matching the search condition
        const count = await Application.count(condition);

        // Retrieve the applications with pagination
        const data = await Application.find(condition).skip(offset).limit(limit);

        // Prepare the response data for rendering
        const lists = {
            data: data,
            current: page,
            offset: offset,
            pages: Math.ceil(count / limit)
        };

        // Render the response with the applications list
        return res.render('pages/application/list', {
            lists: lists,
            query: query,
            user,
            success,
            danger,
            info,
            page_title: 'Application List',
            page_url: 'application.list',
            url: req.pathname
        });

    } catch (err) {
        // Log the error for debugging
        logger.error(`Error fetching applications: ${err.message || 'Unknown error'}`);

        // Flash the error message
        req.flash('danger', err.message || 'Some error occurred while retrieving the application list.');

        // Respond with a proper error message and status code
        res.status(500).redirect('/application'); // Internal Server Error
    }
};


// Find a single Application with an id
exports.findOne = async (req, res) => {
    try {
        const id = req.params.id;

        // Validate if the id is a valid ObjectId (assuming you're using MongoDB and Mongoose)
        if (!mongoose.Types.ObjectId.isValid(id)) {
            logger.warn(`Invalid ID format: ${id}.`);
            return res.status(400).send({
                message: `Invalid ID format: ${id}. Please provide a valid ObjectId.`
            });
        }

        // Attempt to find the Application by the given id
        const application = await Application.findById(id);

        if (application) {
            // Application found, log the success
            logger.info(`Application found with id=${id}`);
            return res.send({ data: application });
        } else {
            // Application not found, log the 404
            logger.warn(`Application not found with id=${id}`);
            return res.status(404).send({
                message: `Cannot find Application with id=${id}.`
            });
        }

    } catch (err) {
        // Log the error for debugging
        logger.error(`Error retrieving Application with id=${req.params.id}: ${err.message || 'Unknown error'}`);

        // Return a 500 Internal Server Error for any unexpected issues
        return res.status(500).send({
            message: `Error retrieving Application with id=${req.params.id}. ${err.message || ''}`
        });
    }
};

exports.edit = async (req, res) => {
    try {
        const user = req.cookies['user'];
        const id = req.params.id;

        if (!id || !mongoose.Types.ObjectId.isValid(id)) {
            req.flash('danger', 'Invalid application ID.');
            return res.redirect('/application');
        }

        // Fetch countries asynchronously
        const countries = await Country.find();

        // Flash messages for notifications
        const success = req.flash('success');
        const danger = req.flash('danger');
        const info = req.flash('info');

        // Find the application by its ID
        const application = await Application.findOne({ _id: id });

        if (application) {
            // If application is found, render the edit application
            return res.render('pages/application/edit', {
                list: application,
                user,
                success,
                danger,
                info,
                countries,
                page_title: 'Application Edit',
                page_url: 'application.edit'
            });
        } else {
            // If application is not found, flash an error and redirect
            const errorMessage = `Cannot find Application with id=${id}.`;
            logger.warn(errorMessage); // Log the warning
            req.flash('danger', errorMessage);
            return res.redirect('/application');
        }

    } catch (err) {
        // Log the error for debugging purposes
        logger.error(`Error retrieving Application with id=${id}: ${err.message || 'Unknown error'}`);

        // Flash an error message to the user
        req.flash('danger', `Error updating Application with id=${id}. ${err.message || 'Unknown error'}`);

        // Redirect to the applications list page
        return res.redirect('/application');
    }
};


// Update a Application by the id in the request
exports.update = (req, res) => {
    try {
        const id = req.params.id;

        // Validate the Application ID
        if (!id || !mongoose.Types.ObjectId.isValid(id)) {
            req.flash('danger', 'Invalid Application ID.');
            logger.warn(`Invalid Application ID provided: ${id}`); // Log the invalid ID warning
            return res.redirect('/application');
        }

        upload(req, res, function (err) {
            if (err) {
                // Log the file upload error
                req.flash('danger', `File upload error: ${err.message || 'Unknown error'}`);
                logger.error(`File upload error for Application ID: ${id} - ${err.message || 'Unknown error'}`); // Log the file upload error
                return res.redirect(`/application/edit/${id}`);
            }

            const application_detail = {
                title: req.body.title,
                slug: req.body.slug ? slugify(req.body.slug, { lower: true }) : slugify(req.body.title, { lower: true }),
                except: req.body.except,
                description: req.body.description,
                country: req.body.country || null,
                seo_title: req.body.seo_title,
                seo_keywords: req.body.seo_keywords,
                seo_description: req.body.seo_description,
            };

            if (req.file) {
                application_detail.image = req.file.filename;
            }

            // Attempt to update the application in the database
            Application.updateOne({ _id: id }, { $set: application_detail }).then(result => {
                if (result.nModified === 0) {
                    req.flash('danger', `Cannot update Application with id=${id}. Maybe Application was not found or req.body is empty!`);
                    logger.warn(`No changes made to Application ID: ${id}. Either not found or no data to update.`);
                    return res.redirect(`/application/edit/${id}`);
                }
                req.flash('success', 'Application updated successfully!');
                res.redirect('/application');
            }).catch(err => {
                // Log the database update error
                logger.error(`Database update error for Application ID: ${id} - ${err.message || 'Unknown error'}`);
                req.flash('danger', `Error updating Application with id=${id}: ${err.message || 'Unknown error'}`);
                res.redirect(`/application/edit/${id}`);
            });
        });
    } catch (err) {
        // General error handling (e.g., invalid data, unknown errors)
        logger.error(`General error while updating Application ID: ${req.params.id} - ${err.message || 'Unknown error'}`);
        req.flash('danger', err.message || 'Some error occurred while updating the Application.');
        res.redirect(`/application/edit/${req.params.id}`);
    }
};

// Delete a Application with the specified id in the request
exports.delete = (req, res) => {
    try {
        const id = req.params.id;

        // Validate the Application ID
        if (!id || !mongoose.Types.ObjectId.isValid(id)) {
            req.flash('danger', 'Invalid Application ID.');
            logger.warn(`Attempt to delete with invalid ID: ${id}`);
            return res.redirect('/application');
        }

        // Proceed to delete the application
        Application.deleteOne({ _id: id })
            .then(result => {
                if (result.deletedCount === 1) {
                    // Successful deletion
                    req.flash('success', `Application deleted successfully!`);
                    res.redirect('/application');
                } else {
                    // No document was deleted (Application not found)
                    req.flash('danger', `Cannot delete Application with id=${id}. Maybe the Application was not found!`);
                    logger.warn(`Application with ID ${id} not found for deletion.`);
                    res.redirect('/application');
                }
            })
            .catch(err => {
                // Log and handle errors from the database
                logger.error(`Error occurred while deleting Application with ID ${id} - ${err.message || 'Unknown error'}`);
                req.flash('danger', `Could not delete Application with id=${id}. Please try again later.`);
                res.redirect('/application');
            });
    } catch (err) {
        // Catch unexpected errors and log them
        logger.error(`Unexpected error during delete operation for Application with ID ${req.params.id} - ${err.message || 'Unknown error'}`);
        req.flash('danger', 'An unexpected error occurred while attempting to delete the Application.');
        res.redirect('/application');
    }
};

// Delete all Application from the database.
exports.deleteAll = (req, res) => {
    try {
        // Validate the ID array
        if (!req.body.id || !Array.isArray(req.body.id) || req.body.id.length === 0) {
            req.flash('danger', 'No application IDs provided for deletion.');
            logger.warn('No application IDs provided for deletion.');
            return res.redirect('/application');
        }

        // Validate each ID in the array
        const invalidIds = req.body.id.filter(id => !mongoose.Types.ObjectId.isValid(id));
        if (invalidIds.length > 0) {
            req.flash('danger', `Invalid application IDs: ${invalidIds.join(', ')}`);
            logger.warn(`Invalid application IDs: ${invalidIds.join(', ')}`);
            return res.redirect('/application');
        }

        // Proceed with deletion
        Application.deleteMany({ _id: { $in: req.body.id } })
            .then(nums => {
                if (nums.deletedCount > 0) {
                    req.flash('success', `${nums.deletedCount} Application(s) were deleted successfully!`);
                    logger.info(`${nums.deletedCount} Application(s) deleted successfully.`);
                } else {
                    req.flash('danger', 'No Applications were deleted. Please check if the applications exist.');
                    logger.warn('No Applications were deleted, either due to non-existence or invalid IDs.');
                }
                res.redirect('/application');
            })
            .catch(err => {
                // Log the error and provide a user-friendly message
                logger.error(`Error deleting applications: ${err.message || 'Unknown error'}`);
                req.flash('danger', err.message || 'Some error occurred while deleting the Applications.');
                res.redirect('/application');
            });

    } catch (err) {
        // Catch any unexpected errors
        logger.error(`Unexpected error occurred while deleting applications: ${err.message || 'Unknown error'}`);
        req.flash('danger', err.message || 'An unexpected error occurred while deleting the Applications.');
        res.redirect('/application');
    }
};