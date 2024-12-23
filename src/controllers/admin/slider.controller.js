const Slider = require('../../schemas/slider.js');

const multer = require('multer');
const fs = require('fs');
const slugify = require('slugify');
const path = require('path');
const mongoose = require('mongoose');
const logger = require('../../logger.js');

// Set up storage for Multer
const storage = multer.diskStorage({
    destination: function (req, file, callback) {
        const dir = "./src/public/upload/slider";

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

// Create a new Slider Page
exports.add = (req, res) => {

    const user = req.cookies['user'];

    const success = req.flash('success');
    const danger = req.flash('danger');
    const info = req.flash('info');

    res.render('pages/slider/add', { user, success, danger, info, page_title: 'Slider Add', page_url: 'slider.add' });
};

// Create and Save a new Slider
exports.create = (req, res) => {

    // Create a Slider
    upload(req, res, function (err) {
        const slider = {};
        if (err) {
            res.redirect('/slider/create');
        }

        if (req.file) {
            slider.image = req.file.filename;
        }

        if (!req.body.title) {
            req.flash('danger', 'Please enter title.');
            res.redirect('/slider/create');
        }
        if (!req.body.description) {
            req.flash('danger', 'Please enter description.');
            res.redirect('/slider/create');
        }

        slider.title = req.body.title;
        slider.slug = req.body.slug ? slugify(req.body.slug, { lower: true }) : slugify(req.body.title, { lower: true });
        slider.except = req.body.except ? req.body.except : '';
        slider.description = req.body.description;
        // Save slider in the database
        Slider.create(slider)
            .then(data => {
                req.flash('success', `Slider created successfully!`);
                res.redirect('/slider');
            })
            .catch(err => {
                req.flash('danger', err.message || 'Some error occurred while creating the Slider.');
                res.redirect('/slider/create');
            });
    })

};

// Retrieve all Slider from the database.
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

    Slider.count(condition).then(count => {
        Slider.find(condition).skip(offset).limit(limit)
            .then(data => {
                res.render('pages/slider/list', {
                    lists: {
                        data: data, current: page, offset: offset,
                        pages: Math.ceil(count / limit)
                    },
                    query: query,
                    user, success, danger, info, page_title: 'Slider List', page_url: 'slider.list', url: req.pathname
                });
            })
            .catch(err => {
                req.flash('danger', err.message || 'Some error occurred while creating the Slider.');
                res.redirect('/slider');
            });
    });
};

// Find a single Slider with an id
exports.findOne = (req, res) => {
    const id = req.params.id;
    Slider.findOne({ _id: id })
        .then(data => {
            if (data) {
                return res.send({ data: data });
            } else {
                return res.status(404).send({
                    message: `Cannot find Slider with id=${id}.`
                });
            }
        })
        .catch(err => {
            return res.status(500).send({
                message: "Error retrieving Slider with id=" + id
            });
        });
};

exports.edit = (req, res) => {
    const user = req.cookies['user'];

    const success = req.flash('success');
    const danger = req.flash('danger');
    const info = req.flash('info');

    const id = req.params.id;
    Slider.findOne({ _id: id })
        .then(data => {
            if (data) {
                res.render('pages/slider/edit', {
                    list: data, user, success, danger, info, page_title: 'Slider Edit', page_url: 'slider.edit'
                });
            } else {
                req.flash('danger', `Cannot find Slider with id=${id}.`);
                res.redirect('/slider');
            }
        })
        .catch(err => {
            req.flash('danger', 'Error updating Slider with id=' + id);
            res.redirect('/slider');
        });
};

// Update a Slider by the id in the request
exports.update = (req, res) => {
    const id = req.params.id;

    upload(req, res, function (err) {
        if (err) {
            res.redirect('/slider/edit/' + id);
        }

        const slider_detail = {};

        slider_detail.title = req.body.title;
        slider_detail.except = req.body.except;
        slider_detail.description = req.body.description;

        if (req.file) {
            slider_detail.image = req.file.filename;
        }

        Slider.updateOne({ _id: id }, { $set: slider_detail }).then(num => {
            if (num.ok == 1) {
                req.flash('success', `Slider updated successfully!`);
                res.redirect('/slider');
            } else {
                req.flash('danger', `Cannot update Slider with id=${id}. Maybe Slider was not found or req.body is empty!`);
                res.redirect('/slider/edit/' + id);
            }
        })
            .catch(err => {
                req.flash('danger', 'Error updating Slider with id=' + id);
                res.redirect('/slider/edit/' + id);
            });

    })
};

// Delete a Slider with the specified id in the request
exports.delete = (req, res) => {
    try {
        const id = req.params.id;

        // Validate the Slider ID
        if (!id || !mongoose.Types.ObjectId.isValid(id)) {
            req.flash('danger', 'Invalid Slider ID.');
            logger.warn(`Attempt to delete with invalid ID: ${id}`);
            return res.redirect('/slider');
        }

        // Proceed to delete the slider
        Slider.deleteOne({ _id: id })
            .then(result => {
                if (result.deletedCount === 1) {
                    // Successful deletion
                    req.flash('success', `Slider deleted successfully!`);
                    res.redirect('/slider');
                } else {
                    // No document was deleted (Slider not found)
                    req.flash('danger', `Cannot delete Slider with id=${id}. Maybe the Slider was not found!`);
                    logger.warn(`Slider with ID ${id} not found for deletion.`);
                    res.redirect('/slider');
                }
            })
            .catch(err => {
                // Log and handle errors from the database
                logger.error(`Error occurred while deleting Slider with ID ${id} - ${err.message || 'Unknown error'}`);
                req.flash('danger', `Could not delete Slider with id=${id}. Please try again later.`);
                res.redirect('/slider');
            });
    } catch (err) {
        // Catch unexpected errors and log them
        logger.error(`Unexpected error during delete operation for Slider with ID ${req.params.id} - ${err.message || 'Unknown error'}`);
        req.flash('danger', 'An unexpected error occurred while attempting to delete the Slider.');
        res.redirect('/slider');
    }
};

// Delete all Slider from the database.
exports.deleteAll = (req, res) => {
    try {
        // Validate the ID array
        if (!req.body.id || !Array.isArray(req.body.id) || req.body.id.length === 0) {
            req.flash('danger', 'No slider IDs provided for deletion.');
            logger.warn('No slider IDs provided for deletion.');
            return res.redirect('/slider');
        }

        // Validate each ID in the array
        const invalidIds = req.body.id.filter(id => !mongoose.Types.ObjectId.isValid(id));
        if (invalidIds.length > 0) {
            req.flash('danger', `Invalid slider IDs: ${invalidIds.join(', ')}`);
            logger.warn(`Invalid slider IDs: ${invalidIds.join(', ')}`);
            return res.redirect('/slider');
        }

        // Proceed with deletion
        Slider.deleteMany({ _id: { $in: req.body.id } })
            .then(nums => {
                if (nums.deletedCount > 0) {
                    req.flash('success', `${nums.deletedCount} Slider(s) were deleted successfully!`);
                    logger.info(`${nums.deletedCount} Slider(s) deleted successfully.`);
                } else {
                    req.flash('danger', 'No Sliders were deleted. Please check if the careers exist.');
                    logger.warn('No Sliders were deleted, either due to non-existence or invalid IDs.');
                }
                res.redirect('/slider');
            })
            .catch(err => {
                // Log the error and provide a user-friendly message
                logger.error(`Error deleting careers: ${err.message || 'Unknown error'}`);
                req.flash('danger', err.message || 'Some error occurred while deleting the Sliders.');
                res.redirect('/slider');
            });

    } catch (err) {
        // Catch any unexpected errors
        logger.error(`Unexpected error occurred while deleting careers: ${err.message || 'Unknown error'}`);
        req.flash('danger', err.message || 'An unexpected error occurred while deleting the Sliders.');
        res.redirect('/slider');
    }
};