const Career = require('../../schemas/career.js');
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
        const dir = "./src/public/upload/career";

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

// Create a new Career 
exports.add = async (req, res) => {

    const user = req.cookies['user'];

    const success = req.flash('success');
    const danger = req.flash('danger');
    const info = req.flash('info');

    return res.render('pages/career/add', { user, success, danger, info, page_title: 'Career Add', page_url: 'career.add' });
};

// Create and Save a new Career
exports.create = (req, res) => {

    // Create a Career
    upload(req, res, function (err) {
        const career = {};
        if (err) {
            return res.redirect('/career/create');
        }

        if (req.file) {
            career.image = req.file.filename;
        }

        if (!req.body.title) {
            req.flash('danger', 'Please enter title.');
            return res.redirect('/career/create');
        }
        if (!req.body.description) {
            req.flash('danger', 'Please enter description.');
            return res.redirect('/career/create');
        }

        career.title = req.body.title;
        career.slug = req.body.slug ? slugify(req.body.slug, { lower: true }) : slugify(req.body.title, { lower: true });
        career.except = req.body.except;
        career.description = req.body.description;
        career.vacancy = req.body.vacancy;
        career.address = req.body.address;

        career.seo_title = req.body.seo_title;
        career.seo_keywords = req.body.seo_keywords;
        career.seo_description = req.body.seo_description;

        // Save career in the database
        Career.create(career)
            .then(data => {
                req.flash('success', `Career created successfully!`);
                return res.redirect('/career');
            })
            .catch(err => {
                req.flash('danger', err.message || 'Some error occurred while creating the Career.');
                return res.redirect('/career/create');
            });
    })

};

// Retrieve all Career from the database.
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

    Career.count(condition).then(count => {
        Career.find(condition).skip(offset).limit(limit)
            .then(data => {
                const lists = {
                    data: data, current: page, offset: offset,
                    pages: Math.ceil(count / limit)
                };
                return res.render('pages/career/list', {
                    lists: {
                        data: data, current: page, offset: offset,
                        pages: Math.ceil(count / limit)
                    },
                    query: query,
                    user, success, danger, info, page_title: 'Career List', page_url: 'career.list', url: req.pathname
                });
            })
            .catch(err => {
                req.flash('danger', err.message || 'Some error occurred while creating the Career.');
                return res.redirect('/career');
            });
    });
};

// Find a single Career with an id
exports.findOne = (req, res) => {
    const id = req.params.id;
    Career.findOne({ _id: id })
        .then(data => {
            if (data) {
                return res.send({ data: data });
            } else {
                return res.status(404).send({
                    message: `Cannot find Career with id=${id}.`
                });
            }
        })
        .catch(err => {
            return res.status(500).send({
                message: "Error retrieving Career with id=" + id
            });
        });
};

exports.edit = async (req, res) => {
    const user = req.cookies['user'];

    const success = req.flash('success');
    const danger = req.flash('danger');
    const info = req.flash('info');

    const id = req.params.id;
    Career.findOne({ _id: id })
        .then(data => {
            if (data) {
                return res.render('pages/career/edit', {
                    list: data, user, success, danger, info, page_title: 'Career Edit', page_url: 'career.edit'
                });
            } else {
                req.flash('danger', `Cannot find Career with id=${id}.`);
                return res.redirect('/career');
            }
        })
        .catch(err => {
            req.flash('danger', 'Error updating Career with id=' + id);
            return res.redirect('/career');
        });
};

// Update a Career by the id in the request
exports.update = (req, res) => {
    const id = req.params.id;

    upload(req, res, function (err) {
        if (err) {
            return res.redirect('/career/edit/' + id);
        }

        const career_detail = {};

        career_detail.title = req.body.title;
        career_detail.slug = req.body.slug ? slugify(req.body.slug, { lower: true }) : slugify(req.body.title, { lower: true });
        career_detail.except = req.body.except;
        career_detail.description = req.body.description;
        career_detail.vacancy = req.body.vacancy;
        career_detail.address = req.body.address;

        career_detail.seo_title = req.body.seo_title;
        career_detail.seo_keywords = req.body.seo_keywords;
        career_detail.seo_description = req.body.seo_description;

        if (req.file) {
            career_detail.image = req.file.filename;
        }

        Career.updateOne({ _id: id }, { $set: career_detail }).then(num => {
            if (num.ok == 1) {
                req.flash('success', `Career updated successfully!`);
                return res.redirect('/career');
            } else {
                req.flash('danger', `Cannot update Career with id=${id}. Maybe Career was not found or req.body is empty!`);
                return res.redirect('/career/edit/' + id);
            }
        })
            .catch(err => {
                req.flash('danger', 'Error updating Career with id=' + id);
                return res.redirect('/career/edit/' + id);
            });

    })
};

// Delete a Career with the specified id in the request
exports.delete = (req, res) => {
    try {
        const id = req.params.id;

        // Validate the Career ID
        if (!id || !mongoose.Types.ObjectId.isValid(id)) {
            req.flash('danger', 'Invalid Career ID.');
            logger.warn(`Attempt to delete with invalid ID: ${id}`);
            return res.redirect('/career');
        }

        // Proceed to delete the career
        Career.deleteOne({ _id: id })
            .then(result => {
                if (result.deletedCount === 1) {
                    // Successful deletion
                    req.flash('success', `Career deleted successfully!`);
                    res.redirect('/career');
                } else {
                    // No document was deleted (Career not found)
                    req.flash('danger', `Cannot delete Career with id=${id}. Maybe the Career was not found!`);
                    logger.warn(`Career with ID ${id} not found for deletion.`);
                    res.redirect('/career');
                }
            })
            .catch(err => {
                // Log and handle errors from the database
                logger.error(`Error occurred while deleting Career with ID ${id} - ${err.message || 'Unknown error'}`);
                req.flash('danger', `Could not delete Career with id=${id}. Please try again later.`);
                res.redirect('/career');
            });
    } catch (err) {
        // Catch unexpected errors and log them
        logger.error(`Unexpected error during delete operation for Career with ID ${req.params.id} - ${err.message || 'Unknown error'}`);
        req.flash('danger', 'An unexpected error occurred while attempting to delete the Career.');
        res.redirect('/career');
    }
};

// Delete all Career from the database.
exports.deleteAll = (req, res) => {
    try {
        // Validate the ID array
        if (!req.body.id || !Array.isArray(req.body.id) || req.body.id.length === 0) {
            req.flash('danger', 'No career IDs provided for deletion.');
            logger.warn('No career IDs provided for deletion.');
            return res.redirect('/career');
        }

        // Validate each ID in the array
        const invalidIds = req.body.id.filter(id => !mongoose.Types.ObjectId.isValid(id));
        if (invalidIds.length > 0) {
            req.flash('danger', `Invalid career IDs: ${invalidIds.join(', ')}`);
            logger.warn(`Invalid career IDs: ${invalidIds.join(', ')}`);
            return res.redirect('/career');
        }

        // Proceed with deletion
        Career.deleteMany({ _id: { $in: req.body.id } })
            .then(nums => {
                if (nums.deletedCount > 0) {
                    req.flash('success', `${nums.deletedCount} Career(s) were deleted successfully!`);
                    logger.info(`${nums.deletedCount} Career(s) deleted successfully.`);
                } else {
                    req.flash('danger', 'No Careers were deleted. Please check if the careers exist.');
                    logger.warn('No Careers were deleted, either due to non-existence or invalid IDs.');
                }
                res.redirect('/career');
            })
            .catch(err => {
                // Log the error and provide a user-friendly message
                logger.error(`Error deleting careers: ${err.message || 'Unknown error'}`);
                req.flash('danger', err.message || 'Some error occurred while deleting the Careers.');
                res.redirect('/career');
            });

    } catch (err) {
        // Catch any unexpected errors
        logger.error(`Unexpected error occurred while deleting careers: ${err.message || 'Unknown error'}`);
        req.flash('danger', err.message || 'An unexpected error occurred while deleting the Careers.');
        res.redirect('/career');
    }
};

// Status Change a Record with the specified id in the request
exports.status = (req, res) => {
    try {
        const id = req.params.id;

        // Validate the Record ID
        if (!id || !mongoose.Types.ObjectId.isValid(id)) {
            req.flash('danger', 'Invalid Record ID.');
            logger.warn(`Attempt to status change with invalid ID: ${id}`);
            return res.redirect('back');
        }

        Career.findOne({ _id: id })
            .then(r_detail => {
                console.log(r_detail);
                const record_detail = {};
                record_detail.showStatus = !r_detail.showStatus;

                Career.updateOne({ _id: id }, { $set: record_detail }).then(num => {
                    if (num.ok == 1) {
                        req.flash('success', `Record status change successfully!`);
                        return res.redirect('back');
                    } else {
                        req.flash('danger', `Cannot update Record with id=${id}. Maybe Record was not found or req.body is empty!`);
                        return res.redirect('back');
                    }
                })
                    .catch(err => {
                        req.flash('danger', 'Error updating Record with id=' + id);
                        return res.redirect('back');
                    });
            })
            .catch(error => {
                req.flash('danger', `${error}`);
                return res.redirect('back');
            });
    } catch (err) {
        req.flash('danger', 'An unexpected error occurred while attempting to status change the Record.');
        return res.redirect('back');
    }
};
