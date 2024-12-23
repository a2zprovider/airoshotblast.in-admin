const Country = require('../../schemas/country.js');

const multer = require('multer');
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const logger = require('../../logger.js');

// Set up storage for Multer
const storage = multer.diskStorage({
    destination: function (req, file, callback) {
        const dir = "./src/public/upload/country";

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

// Create a new Country Page
exports.add = async (req, res) => {

    const user = req.cookies['user'];
    const categories = await Country.find();

    const success = req.flash('success');
    const danger = req.flash('danger');
    const info = req.flash('info');

    res.render('pages/country/add', { user, success, danger, info, categories, page_title: 'Country Add', page_url: 'country.add' });
};

// Create a new Country Page
exports.add = async (req, res) => {

    const user = req.cookies['user'];

    const success = req.flash('success');
    const danger = req.flash('danger');
    const info = req.flash('info');

    res.render('pages/country/add', { user, success, danger, info, page_title: 'Country Add', page_url: 'country.add' });
};

// Create and Save a new Country
exports.create = (req, res) => {

    // Create a Country
    upload(req, res, function (err) {
        const country = {};

        if (err) {
            res.redirect('/country/create');
        }

        if (!req.body.title) {
            req.flash('danger', 'Please enter title.');
            res.redirect('/country/create');
        }

        country.title = req.body.title;
        country.code = req.body.code;

        // Save Country in the database
        Country.create(country)
            .then(data => {
                req.flash('success', `Country created successfully!`);
                res.redirect('/country');
            })
            .catch(err => {
                req.flash('danger', err.message || 'Some error occurred while creating the Country.');
                res.redirect('/country/create');
            });
    })

};

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

    Country.count(condition).then(count => {
        Country.find(condition).skip(offset).limit(limit)
            .then(data => {
                res.render('pages/country/list', {
                    lists: {
                        data: data, current: page, offset: offset,
                        pages: Math.ceil(count / limit)
                    },
                    query: query,
                    user, success, danger, info, page_title: 'Country List', page_url: 'country.list', url: req.pathname
                });
            })
            .catch(err => {
                req.flash('danger', err.message || 'Some error occurred while creating the Country.');
                res.redirect('/country');
            });

    });
};

// Find a single Country with an id
exports.findOne = (req, res) => {
    const id = req.params.id;
    Country.findOne({ _id: id })
        .then(data => {
            if (data) {
                return res.send({ data: data });
            } else {
                return res.status(404).send({
                    message: `Cannot find Country with id=${id}.`
                });
            }
        })
        .catch(err => {
            return res.status(500).send({
                message: "Error retrieving Country with id=" + id
            });
        });
};

exports.edit = async (req, res) => {
    const user = req.cookies['user'];

    const success = req.flash('success');
    const danger = req.flash('danger');
    const info = req.flash('info');

    const id = req.params.id;

    Country.findOne({ _id: id })
        .then(data => {
            if (data) {
                res.render('pages/country/edit', {
                    list: data, user, success, danger, info, page_title: 'Country Edit', page_url: 'country.edit'
                });
            } else {
                req.flash('danger', `Cannot find Country with id=${id}.`);
                res.redirect('/country');
            }
        })
        .catch(err => {
            req.flash('danger', 'Error updating Country with id=' + id);
            res.redirect('/country');
        });
};

// Update a Country by the id in the request
exports.update = (req, res) => {
    const id = req.params.id;

    upload(req, res, function (err) {
        if (err) {
            res.redirect('/country/edit/' + id);
        }

        const country_detail = {};

        country_detail.title = req.body.title;
        country_detail.code = req.body.code;

        if (req.file) {
            country_detail.image = req.file.filename;
        }

        Country.updateOne({ _id: id }, { $set: country_detail }).then(num => {
            if (num.ok == 1) {
                req.flash('success', `Country updated successfully!`);
                res.redirect('/country');
            } else {
                req.flash('danger', `Cannot update Country with id=${id}. Maybe Country was not found or req.body is empty!`);
                res.redirect('/country/edit/' + id);
            }
        })
            .catch(err => {
                req.flash('danger', 'Error updating Country with id=' + id);
                res.redirect('/country/edit/' + id);
            });
    });
};

// Delete a Country with the specified id in the request
exports.delete = (req, res) => {
    try {
        const id = req.params.id;

        // Validate the Country ID
        if (!id || !mongoose.Types.ObjectId.isValid(id)) {
            req.flash('danger', 'Invalid Country ID.');
            logger.warn(`Attempt to delete with invalid ID: ${id}`);
            return res.redirect('/country');
        }

        // Proceed to delete the country
        Country.deleteOne({ _id: id })
            .then(result => {
                if (result.deletedCount === 1) {
                    // Successful deletion
                    req.flash('success', `Country deleted successfully!`);
                    res.redirect('/country');
                } else {
                    // No document was deleted (Country not found)
                    req.flash('danger', `Cannot delete Country with id=${id}. Maybe the Country was not found!`);
                    logger.warn(`Country with ID ${id} not found for deletion.`);
                    res.redirect('/country');
                }
            })
            .catch(err => {
                // Log and handle errors from the database
                logger.error(`Error occurred while deleting Country with ID ${id} - ${err.message || 'Unknown error'}`);
                req.flash('danger', `Could not delete Country with id=${id}. Please try again later.`);
                res.redirect('/country');
            });
    } catch (err) {
        // Catch unexpected errors and log them
        logger.error(`Unexpected error during delete operation for Country with ID ${req.params.id} - ${err.message || 'Unknown error'}`);
        req.flash('danger', 'An unexpected error occurred while attempting to delete the Country.');
        res.redirect('/country');
    }
};

// Delete all Country from the database.
exports.deleteAll = (req, res) => {
    try {
        // Validate the ID array
        if (!req.body.id || !Array.isArray(req.body.id) || req.body.id.length === 0) {
            req.flash('danger', 'No country IDs provided for deletion.');
            logger.warn('No country IDs provided for deletion.');
            return res.redirect('/country');
        }

        // Validate each ID in the array
        const invalidIds = req.body.id.filter(id => !mongoose.Types.ObjectId.isValid(id));
        if (invalidIds.length > 0) {
            req.flash('danger', `Invalid country IDs: ${invalidIds.join(', ')}`);
            logger.warn(`Invalid country IDs: ${invalidIds.join(', ')}`);
            return res.redirect('/country');
        }

        // Proceed with deletion
        Country.deleteMany({ _id: { $in: req.body.id } })
            .then(nums => {
                if (nums.deletedCount > 0) {
                    req.flash('success', `${nums.deletedCount} Country(s) were deleted successfully!`);
                    logger.info(`${nums.deletedCount} Country(s) deleted successfully.`);
                } else {
                    req.flash('danger', 'No Countrys were deleted. Please check if the countrys exist.');
                    logger.warn('No Countrys were deleted, either due to non-existence or invalid IDs.');
                }
                res.redirect('/country');
            })
            .catch(err => {
                // Log the error and provide a user-friendly message
                logger.error(`Error deleting countrys: ${err.message || 'Unknown error'}`);
                req.flash('danger', err.message || 'Some error occurred while deleting the Countrys.');
                res.redirect('/country');
            });

    } catch (err) {
        // Catch any unexpected errors
        logger.error(`Unexpected error occurred while deleting countrys: ${err.message || 'Unknown error'}`);
        req.flash('danger', err.message || 'An unexpected error occurred while deleting the Countrys.');
        res.redirect('/country');
    }
};