const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const moment = require('moment');

const User = require('../../schemas/user.js');
const Enquiry = require('../../schemas/enquiry.js');
const multer = require('multer');
const fs = require('fs');
const slugify = require('slugify');
const path = require('path');
const mongoose = require('mongoose');
const logger = require('../../logger.js');

// Set up storage for Multer
const storage = multer.diskStorage({
    destination: function (req, file, callback) {
        const dir = "./src/public/upload/enquiry";

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


// Create a new Enquiry Page
exports.add = (req, res) => {

    const user = req.cookies['user'];

    const success = req.flash('success');
    const danger = req.flash('danger');
    const info = req.flash('info');

    res.render('pages/enquiry/add', { user, success, danger, info, page_title: 'Enquiry Add', page_url: 'enquiry.add' });
};

// Create and Save a new Enquiry
exports.create = (req, res) => {

    // Create a Enquiry
    upload(req, res, function (err) {
        const enquiry = {};
        if (err) {
            res.redirect('/enquiry/create');
        }

        if (req.file) {
            enquiry.image = req.file.filename;
        }

        if (!req.body.name) {
            req.flash('danger', 'Please enter name.');
            res.redirect('/enquiry/create');
        }
        if (!req.body.description) {
            req.flash('danger', 'Please enter description.');
            res.redirect('/enquiry/create');
        }

        enquiry.name = req.body.name;
        enquiry.slug = req.body.slug ? slugify(req.body.slug, { lower: true }) : slugify(req.body.name);
        enquiry.except = req.body.except;
        enquiry.description = req.body.description;

        enquiry.seo_title = req.body.seo_title;
        enquiry.seo_keywords = req.body.seo_keywords;
        enquiry.seo_description = req.body.seo_description;

        // Save enquiry in the database
        Enquiry.create(enquiry)
            .then(data => {
                req.flash('success', `Enquiry created successfully!`);
                res.redirect('/enquiry');
            })
            .catch(err => {
                req.flash('danger', err.message || 'Some error occurred while creating the Enquiry.');
                res.redirect('/enquiry/create');
            });
    })

};

// Retrieve all Enquiry from the database.
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

    Enquiry.count(condition).then(count => {
        Enquiry.find(condition).skip(offset).limit(limit)
            .then(data => {
                res.render('pages/enquiry/list', {
                    lists: {
                        data: data, current: page, offset: offset,
                        pages: Math.ceil(count / limit)
                    },
                    query: query,
                    user, success, danger, info, page_title: 'Enquiry List', page_url: 'enquiry.list', url: req.pathname
                });
            })
            .catch(err => {
                req.flash('danger', err.message || 'Some error occurred while creating the Enquiry.');
                res.redirect('/enquiry');
            });
    });
};

// Find a single Enquiry with an id
exports.findOne = (req, res) => {
    const id = req.params.id;
    Enquiry.findOne({ _id: id })
        .then(data => {
            if (data) {
                return res.send({ data: data });
            } else {
                return res.status(404).send({
                    message: `Cannot find Enquiry with id=${id}.`
                });
            }
        })
        .catch(err => {
            return res.status(500).send({
                message: "Error retrieving Enquiry with id=" + id
            });
        });
};

exports.edit = (req, res) => {
    const user = req.cookies['user'];

    const success = req.flash('success');
    const danger = req.flash('danger');
    const info = req.flash('info');

    const id = req.params.id;
    Enquiry.findByPk(id)
        .then(data => {
            if (data) {
                res.render('pages/enquiry/edit', {
                    list: data, user, success, danger, info, page_title: 'Enquiry Edit', page_url: 'enquiry.edit'
                });
            } else {
                req.flash('danger', `Cannot find Enquiry with id=${id}.`);
                res.redirect('/enquiry');
            }
        })
        .catch(err => {
            req.flash('danger', 'Error updating Enquiry with id=' + id);
            res.redirect('/enquiry');
        });
};

// Delete a Enquiry with the specified id in the request
exports.delete = (req, res) => {
    try {
        const id = req.params.id;

        // Validate the Enquiry ID
        if (!id || !mongoose.Types.ObjectId.isValid(id)) {
            req.flash('danger', 'Invalid Enquiry ID.');
            logger.warn(`Attempt to delete with invalid ID: ${id}`);
            return res.redirect('/enquiry');
        }

        // Proceed to delete the enquiry
        Enquiry.deleteOne({ _id: id })
            .then(result => {
                if (result.deletedCount === 1) {
                    // Successful deletion
                    req.flash('success', `Enquiry deleted successfully!`);
                    res.redirect('/enquiry');
                } else {
                    // No document was deleted (Enquiry not found)
                    req.flash('danger', `Cannot delete Enquiry with id=${id}. Maybe the Enquiry was not found!`);
                    logger.warn(`Enquiry with ID ${id} not found for deletion.`);
                    res.redirect('/enquiry');
                }
            })
            .catch(err => {
                // Log and handle errors from the database
                logger.error(`Error occurred while deleting Enquiry with ID ${id} - ${err.message || 'Unknown error'}`);
                req.flash('danger', `Could not delete Enquiry with id=${id}. Please try again later.`);
                res.redirect('/enquiry');
            });
    } catch (err) {
        // Catch unexpected errors and log them
        logger.error(`Unexpected error during delete operation for Enquiry with ID ${req.params.id} - ${err.message || 'Unknown error'}`);
        req.flash('danger', 'An unexpected error occurred while attempting to delete the Enquiry.');
        res.redirect('/enquiry');
    }
};

// Delete all Enquiry from the database.
exports.deleteAll = (req, res) => {
    try {
        // Validate the ID array
        if (!req.body.id || !Array.isArray(req.body.id) || req.body.id.length === 0) {
            req.flash('danger', 'No enquiry IDs provided for deletion.');
            logger.warn('No enquiry IDs provided for deletion.');
            return res.redirect('/enquiry');
        }

        // Validate each ID in the array
        const invalidIds = req.body.id.filter(id => !mongoose.Types.ObjectId.isValid(id));
        if (invalidIds.length > 0) {
            req.flash('danger', `Invalid enquiry IDs: ${invalidIds.join(', ')}`);
            logger.warn(`Invalid enquiry IDs: ${invalidIds.join(', ')}`);
            return res.redirect('/enquiry');
        }

        // Proceed with deletion
        Enquiry.deleteMany({ _id: { $in: req.body.id } })
            .then(nums => {
                if (nums.deletedCount > 0) {
                    req.flash('success', `${nums.deletedCount} Enquiry(s) were deleted successfully!`);
                    logger.info(`${nums.deletedCount} Enquiry(s) deleted successfully.`);
                } else {
                    req.flash('danger', 'No Enquirys were deleted. Please check if the enquirys exist.');
                    logger.warn('No Enquirys were deleted, either due to non-existence or invalid IDs.');
                }
                res.redirect('/enquiry');
            })
            .catch(err => {
                // Log the error and provide a user-friendly message
                logger.error(`Error deleting enquirys: ${err.message || 'Unknown error'}`);
                req.flash('danger', err.message || 'Some error occurred while deleting the Enquirys.');
                res.redirect('/enquiry');
            });

    } catch (err) {
        // Catch any unexpected errors
        logger.error(`Unexpected error occurred while deleting enquirys: ${err.message || 'Unknown error'}`);
        req.flash('danger', err.message || 'An unexpected error occurred while deleting the Enquirys.');
        res.redirect('/enquiry');
    }
};