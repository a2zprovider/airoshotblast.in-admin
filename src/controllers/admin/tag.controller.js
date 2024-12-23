const Tag = require('../../schemas/tags.js');

const multer = require('multer');
const fs = require('fs');
const slugify = require('slugify');
const path = require('path');
const mongoose = require('mongoose');
const logger = require('../../logger.js');

// Set up storage for Multer
const storage = multer.diskStorage({
    destination: function (req, file, callback) {
        const dir = "./src/public/upload/tag";

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


// Create a new Tag Page
exports.add = (req, res) => {

    const user = req.cookies['user'];

    const success = req.flash('success');
    const danger = req.flash('danger');
    const info = req.flash('info');

    res.render('pages/tag/add', { user, success, danger, info, page_title: 'Tag Add', page_url: 'tag.add' });
};

// Create and Save a new Tag
exports.create = (req, res) => {

    // Create a Tag
    upload(req, res, function (err) {
        const tag = {};
        if (err) {
            res.redirect('/tag/create');
        }

        if (req.file) {
            tag.image = req.file.filename;
        }

        if (!req.body.title) {
            req.flash('danger', 'Please enter title.');
            res.redirect('/tag/create');
        }
        if (!req.body.description) {
            req.flash('danger', 'Please enter description.');
            res.redirect('/tag/create');
        }

        tag.title = req.body.title;
        tag.slug = req.body.slug ? slugify(req.body.slug, { lower: true }) : slugify(req.body.title, { lower: true });
        tag.except = req.body.except;
        tag.description = req.body.description;

        tag.seo_title = req.body.seo_title;
        tag.seo_keywords = req.body.seo_keywords;
        tag.seo_description = req.body.seo_description;

        // Save Tag in the database
        Tag.create(tag)
            .then(data => {
                req.flash('success', `Tag created successfully!`);
                res.redirect('/tag');
            })
            .catch(err => {
                req.flash('danger', err.message || 'Some error occurred while creating the Tag.');
                res.redirect('/tag/create');
            });
    })

};

// Retrieve all Tag from the database.
exports.findAll = async (req, res) => {
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

    Tag.count(condition).then(count => {
        Tag.find(condition).skip(offset).limit(limit)
            .then(data => {
                res.render('pages/tag/list', {
                    lists: {
                        data: data, current: page, offset: offset,
                        pages: Math.ceil(count / limit)
                    },
                    query: query,
                    user, success, danger, info, page_title: 'Tag List', page_url: 'tag.list', url: req.pathname
                });
            })
            .catch(err => {
                req.flash('danger', err.message || 'Some error occurred while creating the Tag.');
                res.redirect('/tag');
            });
    });
};

// Find a single Tag with an id
exports.findOne = (req, res) => {
    const id = req.params.id;
    Tag.findOne({ _id: id })
        .then(data => {
            if (data) {
                return res.send({ data: data });
            } else {
                return res.status(404).send({
                    message: `Cannot find Tag with id=${id}.`
                });
            }
        })
        .catch(err => {
            return res.status(500).send({
                message: "Error retrieving Tag with id=" + id
            });
        });
};

exports.edit = (req, res) => {
    const user = req.cookies['user'];

    const success = req.flash('success');
    const danger = req.flash('danger');
    const info = req.flash('info');

    const id = req.params.id;
    Tag.findOne({ _id: id })
        .then(data => {
            if (data) {
                res.render('pages/tag/edit', {
                    list: data, user, success, danger, info, page_title: 'Tag Edit', page_url: 'tag.edit'
                });
            } else {
                req.flash('danger', `Cannot find Tag with id=${id}.`);
                res.redirect('/tag');
            }
        })
        .catch(err => {
            req.flash('danger', 'Error updating Tag with id=' + id);
            res.redirect('/tag');
        });
};

// Update a Tag by the id in the request
exports.update = (req, res) => {
    const id = req.params.id;

    upload(req, res, function (err) {
        if (err) {
            res.redirect('/tag/edit/' + id);
        }

        const tag_detail = {};
        tag_detail.title = req.body.title;
        tag_detail.slug = req.body.slug ? slugify(req.body.slug, { lower: true }) : slugify(req.body.title, { lower: true });
        tag_detail.except = req.body.except;
        tag_detail.description = req.body.description;

        tag_detail.field = req.body.field && req.body.field != 'undefined' ? req.body.field : null;

        tag_detail.seo_title = req.body.seo_title;
        tag_detail.seo_keywords = req.body.seo_keywords;
        tag_detail.seo_description = req.body.seo_description;

        if (req.file) {
            tag_detail.image = req.file.filename;
        }
        Tag.updateOne({ _id: id }, { $set: tag_detail }).then(num => {
            if (num.ok == 1) {
                req.flash('success', `Tag updated successfully!`);
                res.redirect('/tag');
            } else {
                req.flash('danger', `Cannot update Tag with id=${id}. Maybe Tag was not found or req.body is empty!`);
                res.redirect('/tag/edit/' + id);
            }
        })
            .catch(err => {
                req.flash('danger', 'Error updating Tag with id=' + id);
                res.redirect('/tag/edit/' + id);
            });

    })
};

// Delete a Tag with the specified id in the request
exports.delete = (req, res) => {
    try {
        const id = req.params.id;

        // Validate the Tag ID
        if (!id || !mongoose.Types.ObjectId.isValid(id)) {
            req.flash('danger', 'Invalid Tag ID.');
            logger.warn(`Attempt to delete with invalid ID: ${id}`);
            return res.redirect('/tag');
        }

        // Proceed to delete the tag
        Tag.deleteOne({ _id: id })
            .then(result => {
                if (result.deletedCount === 1) {
                    // Successful deletion
                    req.flash('success', `Tag deleted successfully!`);
                    res.redirect('/tag');
                } else {
                    // No document was deleted (Tag not found)
                    req.flash('danger', `Cannot delete Tag with id=${id}. Maybe the Tag was not found!`);
                    logger.warn(`Tag with ID ${id} not found for deletion.`);
                    res.redirect('/tag');
                }
            })
            .catch(err => {
                // Log and handle errors from the database
                logger.error(`Error occurred while deleting Tag with ID ${id} - ${err.message || 'Unknown error'}`);
                req.flash('danger', `Could not delete Tag with id=${id}. Please try again later.`);
                res.redirect('/tag');
            });
    } catch (err) {
        // Catch unexpected errors and log them
        logger.error(`Unexpected error during delete operation for Tag with ID ${req.params.id} - ${err.message || 'Unknown error'}`);
        req.flash('danger', 'An unexpected error occurred while attempting to delete the Tag.');
        res.redirect('/tag');
    }
};

// Delete all Tag from the database.
exports.deleteAll = (req, res) => {
    try {
        // Validate the ID array
        if (!req.body.id || !Array.isArray(req.body.id) || req.body.id.length === 0) {
            req.flash('danger', 'No tag IDs provided for deletion.');
            logger.warn('No tag IDs provided for deletion.');
            return res.redirect('/tag');
        }

        // Validate each ID in the array
        const invalidIds = req.body.id.filter(id => !mongoose.Types.ObjectId.isValid(id));
        if (invalidIds.length > 0) {
            req.flash('danger', `Invalid tag IDs: ${invalidIds.join(', ')}`);
            logger.warn(`Invalid tag IDs: ${invalidIds.join(', ')}`);
            return res.redirect('/tag');
        }

        // Proceed with deletion
        Tag.deleteMany({ _id: { $in: req.body.id } })
            .then(nums => {
                if (nums.deletedCount > 0) {
                    req.flash('success', `${nums.deletedCount} Tag(s) were deleted successfully!`);
                    logger.info(`${nums.deletedCount} Tag(s) deleted successfully.`);
                } else {
                    req.flash('danger', 'No Tags were deleted. Please check if the tags exist.');
                    logger.warn('No Tags were deleted, either due to non-existence or invalid IDs.');
                }
                res.redirect('/tag');
            })
            .catch(err => {
                // Log the error and provide a user-friendly message
                logger.error(`Error deleting tags: ${err.message || 'Unknown error'}`);
                req.flash('danger', err.message || 'Some error occurred while deleting the Tags.');
                res.redirect('/tag');
            });

    } catch (err) {
        // Catch any unexpected errors
        logger.error(`Unexpected error occurred while deleting tags: ${err.message || 'Unknown error'}`);
        req.flash('danger', err.message || 'An unexpected error occurred while deleting the Tags.');
        res.redirect('/tag');
    }
};