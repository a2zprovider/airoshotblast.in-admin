const Faq = require('../../schemas/faq.js');
const Product = require('../../schemas/product.js');

const multer = require('multer');
const fs = require('fs');
const slugify = require('slugify');
const path = require('path');
const mongoose = require('mongoose');
const logger = require('../../logger.js');

// Set up storage for Multer
const storage = multer.diskStorage({
    destination: function (req, file, callback) {
        const dir = "./src/public/upload/faq";

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

// Create a new Faq Page
exports.add = async (req, res) => {

    const user = req.cookies['user'];

    const products = await Product.find();
    const success = req.flash('success');
    const danger = req.flash('danger');
    const info = req.flash('info');

    res.render('pages/faq/add', { user, success, danger, info, products, page_title: 'Faq Add', page_url: 'faq.add' });
};

// Create and Save a new Faq
exports.create = (req, res) => {

    // Create a Faq
    upload(req, res, function (err) {
        const faq = {};
        if (err) {
            res.redirect('/faq/create');
        }
        if (!req.body.title) {
            req.flash('danger', 'Please enter title.');
            res.redirect('/faq/create');
        }
        if (!req.body.description) {
            req.flash('danger', 'Please enter description.');
            res.redirect('/faq/create');
        }

        faq.title = req.body.title;
        faq.description = req.body.description;

        // Save Faq in the database
        Faq.create(faq)
            .then(data => {
                req.flash('success', `Faq created successfully!`);
                res.redirect('/faq');
            })
            .catch(err => {
                req.flash('danger', err.message || 'Some error occurred while creating the faq.');
                res.redirect('/faq/create');
            });
    })

};

// Retrieve all Faq from the database.
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

    Faq.count(condition).then(count => {
        Faq.find(condition).skip(offset).limit(limit)
            .then(data => {
                res.render('pages/faq/list', {
                    lists: {
                        data: data, current: page, offset: offset,
                        pages: Math.ceil(count / limit)
                    },
                    query: query,
                    user, success, danger, info, page_title: 'Faq List', page_url: 'faq.list', url: req.pathname
                });
            })
            .catch(err => {
                req.flash('danger', err.message || 'Some error occurred while creating the Faq.');
                res.redirect('/faq');
            });
    });
};

// Find a single Faq with an id
exports.findOne = (req, res) => {
    const id = req.params.id;
    Faq.findOne({ _id: id })
        .then(data => {
            if (data) {
                return res.send({ data: data });
            } else {
                return res.status(404).send({
                    message: `Cannot find Faq with id=${id}.`
                });
            }
        })
        .catch(err => {
            return res.status(500).send({
                message: "Error retrieving Faq with id=" + id
            });
        });
};

exports.edit = async (req, res) => {
    const user = req.cookies['user'];

    const success = req.flash('success');
    const danger = req.flash('danger');
    const info = req.flash('info');

    const id = req.params.id;
    Faq.findOne({ _id: id })
        .then(data => {
            if (data) {
                res.render('pages/faq/edit', {
                    list: data, user, success, danger, info, page_title: 'Faq Edit', page_url: 'faq.edit'
                });
            } else {
                req.flash('danger', `Cannot find Faq with id=${id}.`);
                res.redirect('/faq');
            }
        })
        .catch(err => {
            req.flash('danger', 'Error updating Faq with id=' + id);
            res.redirect('/faq');
        });
};

// Update a Faq by the id in the request
exports.update = async (req, res) => {
    const id = req.params.id;

    const data = await Faq.findOne({ _id: id });
    upload(req, res, function (err) {
        if (err) {
            res.redirect('/faq/edit/' + id);
        }

        const faq_detail = {};

        faq_detail.title = req.body.title;
        faq_detail.description = req.body.description;

        Faq.updateOne({ _id: id }, { $set: faq_detail }).then(num => {
            if (num.ok == 1) {
                req.flash('success', `Faq updated successfully!`);
                res.redirect('/faq');
            } else {
                req.flash('danger', `Cannot update Faq with id=${id}. Maybe Faq was not found or req.body is empty!`);
                res.redirect('/faq/edit/' + id);
            }
        })
            .catch(err => {
                req.flash('danger', 'Error updating Faq with id=' + id);
                res.redirect('/faq/edit/' + id);
            });
    })
};

// Delete a Faq with the specified id in the request
exports.delete = (req, res) => {
    try {
        const id = req.params.id;

        // Validate the Faq ID
        if (!id || !mongoose.Types.ObjectId.isValid(id)) {
            req.flash('danger', 'Invalid Faq ID.');
            logger.warn(`Attempt to delete with invalid ID: ${id}`);
            return res.redirect('/faq');
        }

        // Proceed to delete the faq
        Faq.deleteOne({ _id: id })
            .then(result => {
                if (result.deletedCount === 1) {
                    // Successful deletion
                    req.flash('success', `Faq deleted successfully!`);
                    res.redirect('/faq');
                } else {
                    // No document was deleted (Faq not found)
                    req.flash('danger', `Cannot delete Faq with id=${id}. Maybe the Faq was not found!`);
                    logger.warn(`Faq with ID ${id} not found for deletion.`);
                    res.redirect('/faq');
                }
            })
            .catch(err => {
                // Log and handle errors from the database
                logger.error(`Error occurred while deleting Faq with ID ${id} - ${err.message || 'Unknown error'}`);
                req.flash('danger', `Could not delete Faq with id=${id}. Please try again later.`);
                res.redirect('/faq');
            });
    } catch (err) {
        // Catch unexpected errors and log them
        logger.error(`Unexpected error during delete operation for Faq with ID ${req.params.id} - ${err.message || 'Unknown error'}`);
        req.flash('danger', 'An unexpected error occurred while attempting to delete the Faq.');
        res.redirect('/faq');
    }
};

// Delete all Faq from the database.
exports.deleteAll = (req, res) => {
    try {
        // Validate the ID array
        if (!req.body.id || !Array.isArray(req.body.id) || req.body.id.length === 0) {
            req.flash('danger', 'No faq IDs provided for deletion.');
            logger.warn('No faq IDs provided for deletion.');
            return res.redirect('/faq');
        }

        // Validate each ID in the array
        const invalidIds = req.body.id.filter(id => !mongoose.Types.ObjectId.isValid(id));
        if (invalidIds.length > 0) {
            req.flash('danger', `Invalid faq IDs: ${invalidIds.join(', ')}`);
            logger.warn(`Invalid faq IDs: ${invalidIds.join(', ')}`);
            return res.redirect('/faq');
        }

        // Proceed with deletion
        Faq.deleteMany({ _id: { $in: req.body.id } })
            .then(nums => {
                if (nums.deletedCount > 0) {
                    req.flash('success', `${nums.deletedCount} Faq(s) were deleted successfully!`);
                    logger.info(`${nums.deletedCount} Faq(s) deleted successfully.`);
                } else {
                    req.flash('danger', 'No Faqs were deleted. Please check if the faqs exist.');
                    logger.warn('No Faqs were deleted, either due to non-existence or invalid IDs.');
                }
                res.redirect('/faq');
            })
            .catch(err => {
                // Log the error and provide a user-friendly message
                logger.error(`Error deleting faqs: ${err.message || 'Unknown error'}`);
                req.flash('danger', err.message || 'Some error occurred while deleting the Faqs.');
                res.redirect('/faq');
            });

    } catch (err) {
        // Catch any unexpected errors
        logger.error(`Unexpected error occurred while deleting faqs: ${err.message || 'Unknown error'}`);
        req.flash('danger', err.message || 'An unexpected error occurred while deleting the Faqs.');
        res.redirect('/faq');
    }
};