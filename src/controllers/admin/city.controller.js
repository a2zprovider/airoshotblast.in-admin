const City = require('../../schemas/city.js');
const State = require('../../schemas/state.js');

const multer = require('multer');
const fs = require('fs');
const slugify = require('slugify');
const path = require('path');
const mongoose = require('mongoose');
const logger = require('../../logger.js');

// Set up storage for Multer
const storage = multer.diskStorage({
    destination: function (req, file, callback) {
        const dir = "./src/public/upload/city";

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

// Create a new City Page
exports.add = async (req, res) => {

    const user = req.cookies['user'];
    const states = await State.find();

    const success = req.flash('success');
    const danger = req.flash('danger');
    const info = req.flash('info');

    res.render('pages/city/add', { user, success, danger, info, states, page_title: 'City Add', page_url: 'city.add' });
};

// Create and Save a new City
exports.create = (req, res) => {

    // Create a City
    upload(req, res, function (err) {
        const city = {};
        if (err) {
            res.redirect('/city/create');
        }

        if (req.file) {
            city.image = req.file.filename;
        }

        if (!req.body.title) {
            req.flash('danger', 'Please enter title.');
            res.redirect('/city/create');
        }

        city.title = req.body.title;
        city.code = req.body.code;
        city.state = req.body.state;

        // Save City in the database
        City.create(city)
            .then(data => {
                req.flash('success', `City created successfully!`);
                res.redirect('/city');
            })
            .catch(err => {
                req.flash('danger', err.message || 'Some error occurred while creating the City.');
                res.redirect('/city/create');
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

    City.count(condition).then(count => {
        City.find(condition).skip(offset).limit(limit).populate('state')
            .then(data => {
                res.render('pages/city/list', {
                    lists: {
                        data: data, current: page, offset: offset,
                        pages: Math.ceil(count / limit)
                    },
                    query: query,
                    user, success, danger, info, page_title: 'City List', page_url: 'city.list', url: req.pathname
                });
            })
            .catch(err => {
                req.flash('danger', err.message || 'Some error occurred while creating the City.');
                res.redirect('/city');
            });

    });
};

// Find a single City with an id
exports.findOne = (req, res) => {
    const id = req.params.id;
    City.findOne({ _id: id })
        .then(data => {
            if (data) {
                return res.send({ data: data });
            } else {
                return res.status(404).send({
                    message: `Cannot find City with id=${id}.`
                });
            }
        })
        .catch(err => {
            return res.status(500).send({
                message: "Error retrieving City with id=" + id
            });
        });
};

exports.edit = async (req, res) => {
    const user = req.cookies['user'];

    const success = req.flash('success');
    const danger = req.flash('danger');
    const info = req.flash('info');

    const id = req.params.id;

    const states = await State.find({ _id: { $ne: id } });

    City.findOne({ _id: id })
        .then(data => {
            if (data) {
                res.render('pages/city/edit', {
                    list: data, user, success, danger, info, states, page_title: 'City Edit', page_url: 'city.edit'
                });
            } else {
                req.flash('danger', `Cannot find City with id=${id}.`);
                res.redirect('/city');
            }
        })
        .catch(err => {
            req.flash('danger', 'Error updating City with id=' + id);
            res.redirect('/city');
        });
};

// Update a City by the id in the request
exports.update = (req, res) => {
    const id = req.params.id;

    upload(req, res, function (err) {
        if (err) {
            res.redirect('/city/edit/' + id);
        }

        const city_detail = {};

        city_detail.title = req.body.title;
        city_detail.slug = req.body.slug ? slugify(req.body.slug, { lower: true }) : slugify(req.body.title, { lower: true });
        city_detail.except = req.body.except;
        city_detail.description = req.body.description;
        city_detail.parent = req.body.parent;

        city_detail.seo_title = req.body.seo_title;
        city_detail.seo_keywords = req.body.seo_keywords;
        city_detail.seo_description = req.body.seo_description;

        if (req.file) {
            city_detail.image = req.file.filename;
        }

        City.updateOne({ _id: id }, { $set: city_detail }).then(num => {
            if (num.ok == 1) {
                req.flash('success', `City updated successfully!`);
                res.redirect('/city');
            } else {
                req.flash('danger', `Cannot update City with id=${id}. Maybe City was not found or req.body is empty!`);
                res.redirect('/city/edit/' + id);
            }
        })
            .catch(err => {
                req.flash('danger', 'Error updating City with id=' + id);
                res.redirect('/city/edit/' + id);
            });

    })
};

// Delete a City with the specified id in the request
exports.delete = (req, res) => {
    try {
        const id = req.params.id;

        // Validate the City ID
        if (!id || !mongoose.Types.ObjectId.isValid(id)) {
            req.flash('danger', 'Invalid City ID.');
            logger.warn(`Attempt to delete with invalid ID: ${id}`);
            return res.redirect('/city');
        }

        // Proceed to delete the city
        City.deleteOne({ _id: id })
            .then(result => {
                if (result.deletedCount === 1) {
                    // Successful deletion
                    req.flash('success', `City deleted successfully!`);
                    res.redirect('/city');
                } else {
                    // No document was deleted (City not found)
                    req.flash('danger', `Cannot delete City with id=${id}. Maybe the City was not found!`);
                    logger.warn(`City with ID ${id} not found for deletion.`);
                    res.redirect('/city');
                }
            })
            .catch(err => {
                // Log and handle errors from the database
                logger.error(`Error occurred while deleting City with ID ${id} - ${err.message || 'Unknown error'}`);
                req.flash('danger', `Could not delete City with id=${id}. Please try again later.`);
                res.redirect('/city');
            });
    } catch (err) {
        // Catch unexpected errors and log them
        logger.error(`Unexpected error during delete operation for City with ID ${req.params.id} - ${err.message || 'Unknown error'}`);
        req.flash('danger', 'An unexpected error occurred while attempting to delete the City.');
        res.redirect('/city');
    }
};

// Delete all City from the database.
exports.deleteAll = (req, res) => {
    try {
        // Validate the ID array
        if (!req.body.id || !Array.isArray(req.body.id) || req.body.id.length === 0) {
            req.flash('danger', 'No city IDs provided for deletion.');
            logger.warn('No city IDs provided for deletion.');
            return res.redirect('/city');
        }

        // Validate each ID in the array
        const invalidIds = req.body.id.filter(id => !mongoose.Types.ObjectId.isValid(id));
        if (invalidIds.length > 0) {
            req.flash('danger', `Invalid city IDs: ${invalidIds.join(', ')}`);
            logger.warn(`Invalid city IDs: ${invalidIds.join(', ')}`);
            return res.redirect('/city');
        }

        // Proceed with deletion
        City.deleteMany({ _id: { $in: req.body.id } })
            .then(nums => {
                if (nums.deletedCount > 0) {
                    req.flash('success', `${nums.deletedCount} City(s) were deleted successfully!`);
                    logger.info(`${nums.deletedCount} City(s) deleted successfully.`);
                } else {
                    req.flash('danger', 'No Citys were deleted. Please check if the citys exist.');
                    logger.warn('No Citys were deleted, either due to non-existence or invalid IDs.');
                }
                res.redirect('/city');
            })
            .catch(err => {
                // Log the error and provide a user-friendly message
                logger.error(`Error deleting citys: ${err.message || 'Unknown error'}`);
                req.flash('danger', err.message || 'Some error occurred while deleting the Citys.');
                res.redirect('/city');
            });

    } catch (err) {
        // Catch any unexpected errors
        logger.error(`Unexpected error occurred while deleting citys: ${err.message || 'Unknown error'}`);
        req.flash('danger', err.message || 'An unexpected error occurred while deleting the Citys.');
        res.redirect('/city');
    }
};