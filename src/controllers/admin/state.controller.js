const State = require('../../schemas/state.js');
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
        const dir = "./src/public/upload/state";

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


// Create a new State Page
exports.add = async (req, res) => {

    const user = req.cookies['user'];
    const countries = await Country.find();

    const success = req.flash('success');
    const danger = req.flash('danger');
    const info = req.flash('info');

    res.render('pages/state/add', { user, success, danger, info, countries, page_title: 'State Add', page_url: 'state.add' });
};

// Create and Save a new State
exports.create = (req, res) => {

    // Create a State
    upload(req, res, function (err) {


        const state = {};
        if (err) {
            res.redirect('/state/create');
        }

        if (req.file) {
            state.image = req.file.filename;
        }

        if (!req.body.title) {
            req.flash('danger', 'Please enter title.');
            res.redirect('/state/create');
        }

        state.title = req.body.title;
        state.code = req.body.code;
        state.country = req.body.country;

        // Save State in the database
        State.create(state)
            .then(data => {
                req.flash('success', `State created successfully!`);
                res.redirect('/state');
            })
            .catch(err => {
                req.flash('danger', err.message || 'Some error occurred while creating the State.');
                res.redirect('/state/create');
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

    State.count(condition).then(count => {
        State.find(condition).skip(offset).limit(limit).populate('country')
            .then(data => {
                res.render('pages/state/list', {
                    lists: {
                        data: data, current: page, offset: offset,
                        pages: Math.ceil(count / limit)
                    },
                    query: query,
                    user, success, danger, info, page_title: 'State List', page_url: 'state.list', url: req.pathname
                });
            })
            .catch(err => {
                req.flash('danger', err.message || 'Some error occurred while creating the State.');
                res.redirect('/state');
            });

    });
};

// Find a single State with an id
exports.findOne = (req, res) => {
    const id = req.params.id;
    State.findOne({ _id: id })
        .then(data => {
            if (data) {
                return res.send({ data: data });
            } else {
                return res.status(404).send({
                    message: `Cannot find State with id=${id}.`
                });
            }
        })
        .catch(err => {
            return res.status(500).send({
                message: "Error retrieving State with id=" + id
            });
        });
};

exports.edit = async (req, res) => {
    const user = req.cookies['user'];

    const success = req.flash('success');
    const danger = req.flash('danger');
    const info = req.flash('info');

    const id = req.params.id;

    const countries = await Country.find({ _id: { $ne: id } });

    State.findOne({ _id: id })
        .then(data => {
            if (data) {
                res.render('pages/state/edit', {
                    list: data, user, success, danger, info, countries, page_title: 'State Edit', page_url: 'state.edit'
                });
            } else {
                req.flash('danger', `Cannot find State with id=${id}.`);
                res.redirect('/state');
            }
        })
        .catch(err => {
            req.flash('danger', 'Error updating State with id=' + id);
            res.redirect('/state');
        });
};

// Update a State by the id in the request
exports.update = (req, res) => {
    const id = req.params.id;

    upload(req, res, function (err) {
        if (err) {
            res.redirect('/state/edit/' + id);
        }

        const state_detail = {};

        state_detail.title = req.body.title;
        state_detail.code = req.body.code;
        state_detail.country = req.body.country;

        State.updateOne({ _id: id }, { $set: state_detail }).then(num => {
            if (num.ok == 1) {
                req.flash('success', `State updated successfully!`);
                res.redirect('/state');
            } else {
                req.flash('danger', `Cannot update State with id=${id}. Maybe State was not found or req.body is empty!`);
                res.redirect('/state/edit/' + id);
            }
        })
            .catch(err => {
                req.flash('danger', 'Error updating State with id=' + id);
                res.redirect('/state/edit/' + id);
            });

    })
};

// Delete a State with the specified id in the request
exports.delete = (req, res) => {
    try {
        const id = req.params.id;

        // Validate the State ID
        if (!id || !mongoose.Types.ObjectId.isValid(id)) {
            req.flash('danger', 'Invalid State ID.');
            logger.warn(`Attempt to delete with invalid ID: ${id}`);
            return res.redirect('/state');
        }

        // Proceed to delete the state
        State.deleteOne({ _id: id })
            .then(result => {
                if (result.deletedCount === 1) {
                    // Successful deletion
                    req.flash('success', `State deleted successfully!`);
                    res.redirect('/state');
                } else {
                    // No document was deleted (State not found)
                    req.flash('danger', `Cannot delete State with id=${id}. Maybe the State was not found!`);
                    logger.warn(`State with ID ${id} not found for deletion.`);
                    res.redirect('/state');
                }
            })
            .catch(err => {
                // Log and handle errors from the database
                logger.error(`Error occurred while deleting State with ID ${id} - ${err.message || 'Unknown error'}`);
                req.flash('danger', `Could not delete State with id=${id}. Please try again later.`);
                res.redirect('/state');
            });
    } catch (err) {
        // Catch unexpected errors and log them
        logger.error(`Unexpected error during delete operation for State with ID ${req.params.id} - ${err.message || 'Unknown error'}`);
        req.flash('danger', 'An unexpected error occurred while attempting to delete the State.');
        res.redirect('/state');
    }
};

// Delete all State from the database.
exports.deleteAll = (req, res) => {
    try {
        // Validate the ID array
        if (!req.body.id || !Array.isArray(req.body.id) || req.body.id.length === 0) {
            req.flash('danger', 'No state IDs provided for deletion.');
            logger.warn('No state IDs provided for deletion.');
            return res.redirect('/state');
        }

        // Validate each ID in the array
        const invalidIds = req.body.id.filter(id => !mongoose.Types.ObjectId.isValid(id));
        if (invalidIds.length > 0) {
            req.flash('danger', `Invalid state IDs: ${invalidIds.join(', ')}`);
            logger.warn(`Invalid state IDs: ${invalidIds.join(', ')}`);
            return res.redirect('/state');
        }

        // Proceed with deletion
        State.deleteMany({ _id: { $in: req.body.id } })
            .then(nums => {
                if (nums.deletedCount > 0) {
                    req.flash('success', `${nums.deletedCount} State(s) were deleted successfully!`);
                    logger.info(`${nums.deletedCount} State(s) deleted successfully.`);
                } else {
                    req.flash('danger', 'No States were deleted. Please check if the states exist.');
                    logger.warn('No States were deleted, either due to non-existence or invalid IDs.');
                }
                res.redirect('/state');
            })
            .catch(err => {
                // Log the error and provide a user-friendly message
                logger.error(`Error deleting states: ${err.message || 'Unknown error'}`);
                req.flash('danger', err.message || 'Some error occurred while deleting the States.');
                res.redirect('/state');
            });

    } catch (err) {
        // Catch any unexpected errors
        logger.error(`Unexpected error occurred while deleting states: ${err.message || 'Unknown error'}`);
        req.flash('danger', err.message || 'An unexpected error occurred while deleting the States.');
        res.redirect('/state');
    }
};