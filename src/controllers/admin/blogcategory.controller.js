const BlogCategory = require('../../schemas/blogcategory.js');

const multer = require('multer');
const fs = require('fs');
const slugify = require('slugify');
const path = require('path');
const mongoose = require('mongoose');
const logger = require('../../logger.js');

// Set up storage for Multer
const storage = multer.diskStorage({
    destination: function (req, file, callback) {
        const dir = "./src/public/upload/blogcategory";

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

// Create a new Blog Category Page
exports.add = async (req, res) => {

    const user = req.cookies['user'];

    const success = req.flash('success');
    const danger = req.flash('danger');
    const info = req.flash('info');

    res.render('pages/blogcategory/add', { user, success, danger, info, page_title: 'Blog Category Add', page_url: 'blogcategory.add' });
};

// Create and Save a new Blog Category
exports.create = (req, res) => {

    // Create a Blog Category
    upload(req, res, function (err) {
        const category = {};
        if (err) {
            res.redirect('/blogcategory/create');
        }

        if (req.file) {
            category.image = req.file.filename;
        }

        if (!req.body.title) {
            req.flash('danger', 'Please enter title.');
            res.redirect('/blogcategory/create');
        }
        if (!req.body.description) {
            req.flash('danger', 'Please enter description.');
            res.redirect('/blogcategory/create');
        }

        category.title = req.body.title;
        category.slug = req.body.slug ? slugify(req.body.slug, { lower: true }) : slugify(req.body.title, { lower: true });
        category.except = req.body.except;
        category.description = req.body.description;

        category.seo_title = req.body.seo_title;
        category.seo_keywords = req.body.seo_keywords;
        category.seo_description = req.body.seo_description;

        // Save Blog Category in the database
        BlogCategory.create(category)
            .then(data => {
                req.flash('success', `Blog Category created successfully!`);
                res.redirect('/blogcategory');
            })
            .catch(err => {
                req.flash('danger', err.message || 'Some error occurred while creating the Blog Category.');
                res.redirect('/blogcategory/create');
            });
    })

};

// Retrieve all Blog Category from the database.
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

    BlogCategory.count(condition).then(count => {
        BlogCategory.find(condition).skip(offset).limit(limit)
            .then(data => {
                res.render('pages/blogcategory/list', {
                    lists: {
                        data: data, current: page, offset: offset,
                        pages: Math.ceil(count / limit)
                    },
                    query: query,
                    user, success, danger, info, page_title: 'Blog Category List', page_url: 'blogcategory.list', url: req.pathname
                });
            })
            .catch(err => {
                req.flash('danger', err.message || 'Some error occurred while creating the Blog Category.');
                res.redirect('/blogcategory');
            });

    });
};

// Find a single Blog Category with an id
exports.findOne = (req, res) => {
    const id = req.params.id;
    BlogCategory.findOne({ _id: id })
        .then(data => {
            if (data) {
                return res.send({ data: data });
            } else {
                return res.status(404).send({
                    message: `Cannot find Blog Category with id=${id}.`
                });
            }
        })
        .catch(err => {
            return res.status(500).send({
                message: "Error retrieving Blog Category with id=" + id
            });
        });
};

exports.edit = (req, res) => {
    const user = req.cookies['user'];

    const success = req.flash('success');
    const danger = req.flash('danger');
    const info = req.flash('info');

    const id = req.params.id;
    BlogCategory.findOne({ _id: id })
        .then(data => {
            if (data) {
                res.render('pages/blogcategory/edit', {
                    list: data, user, success, danger, info, page_title: 'Blog Category Edit', page_url: 'blogcategory.edit'
                });
            } else {
                req.flash('danger', `Cannot find Blog Category with id=${id}.`);
                res.redirect('/blogcategory');
            }
        })
        .catch(err => {
            req.flash('danger', 'Error updating Blog Category with id=' + id);
            res.redirect('/blogcategory');
        });
};

// Update a Blog Category by the id in the request
exports.update = (req, res) => {
    const id = req.params.id;

    upload(req, res, function (err) {
        if (err) {
            res.redirect('/blogcategory/edit/' + id);
        }

        const category_detail = {};

        category_detail.title = req.body.title;
        category_detail.slug = req.body.slug ? slugify(req.body.slug, { lower: true }) : slugify(req.body.title, { lower: true });
        category_detail.except = req.body.except;
        category_detail.description = req.body.description;

        category_detail.seo_title = req.body.seo_title;
        category_detail.seo_keywords = req.body.seo_keywords;
        category_detail.seo_description = req.body.seo_description;

        if (req.file) {
            category_detail.image = req.file.filename;
        }

        BlogCategory.updateOne({ _id: id }, { $set: category_detail }).then(num => {
            if (num.ok == 1) {
                req.flash('success', `Blog Category updated successfully!`);
                res.redirect('/blogcategory');
            } else {
                req.flash('danger', `Cannot update Blog Category with id=${id}. Maybe Blog Category was not found or req.body is empty!`);
                res.redirect('/blogcategory/edit/' + id);
            }
        })
            .catch(err => {
                req.flash('danger', 'Error updating Blog Category with id=' + id);
                res.redirect('/blogcategory/edit/' + id);
            });

    })
};

// Delete a BlogCategory with the specified id in the request
exports.delete = (req, res) => {
    try {
        const id = req.params.id;

        // Validate the BlogCategory ID
        if (!id || !mongoose.Types.ObjectId.isValid(id)) {
            req.flash('danger', 'Invalid BlogCategory ID.');
            logger.warn(`Attempt to delete with invalid ID: ${id}`);
            return res.redirect('/blogcategory');
        }

        // Proceed to delete the blogcategory
        BlogCategory.deleteOne({ _id: id })
            .then(result => {
                if (result.deletedCount === 1) {
                    // Successful deletion
                    req.flash('success', `BlogCategory deleted successfully!`);
                    res.redirect('/blogcategory');
                } else {
                    // No document was deleted (BlogCategory not found)
                    req.flash('danger', `Cannot delete BlogCategory with id=${id}. Maybe the BlogCategory was not found!`);
                    logger.warn(`BlogCategory with ID ${id} not found for deletion.`);
                    res.redirect('/blogcategory');
                }
            })
            .catch(err => {
                // Log and handle errors from the database
                logger.error(`Error occurred while deleting BlogCategory with ID ${id} - ${err.message || 'Unknown error'}`);
                req.flash('danger', `Could not delete BlogCategory with id=${id}. Please try again later.`);
                res.redirect('/blogcategory');
            });
    } catch (err) {
        // Catch unexpected errors and log them
        logger.error(`Unexpected error during delete operation for BlogCategory with ID ${req.params.id} - ${err.message || 'Unknown error'}`);
        req.flash('danger', 'An unexpected error occurred while attempting to delete the BlogCategory.');
        res.redirect('/blogcategory');
    }
};

// Delete all BlogCategory from the database.
exports.deleteAll = (req, res) => {
    try {
        // Validate the ID array
        if (!req.body.id || !Array.isArray(req.body.id) || req.body.id.length === 0) {
            req.flash('danger', 'No blogcategory IDs provided for deletion.');
            logger.warn('No blogcategory IDs provided for deletion.');
            return res.redirect('/blogcategory');
        }

        // Validate each ID in the array
        const invalidIds = req.body.id.filter(id => !mongoose.Types.ObjectId.isValid(id));
        if (invalidIds.length > 0) {
            req.flash('danger', `Invalid blogcategory IDs: ${invalidIds.join(', ')}`);
            logger.warn(`Invalid blogcategory IDs: ${invalidIds.join(', ')}`);
            return res.redirect('/blogcategory');
        }

        // Proceed with deletion
        BlogCategory.deleteMany({ _id: { $in: req.body.id } })
            .then(nums => {
                if (nums.deletedCount > 0) {
                    req.flash('success', `${nums.deletedCount} BlogCategory(s) were deleted successfully!`);
                    logger.info(`${nums.deletedCount} BlogCategory(s) deleted successfully.`);
                } else {
                    req.flash('danger', 'No BlogCategorys were deleted. Please check if the blogcategorys exist.');
                    logger.warn('No BlogCategorys were deleted, either due to non-existence or invalid IDs.');
                }
                res.redirect('/blogcategory');
            })
            .catch(err => {
                // Log the error and provide a user-friendly message
                logger.error(`Error deleting blogcategorys: ${err.message || 'Unknown error'}`);
                req.flash('danger', err.message || 'Some error occurred while deleting the BlogCategorys.');
                res.redirect('/blogcategory');
            });

    } catch (err) {
        // Catch any unexpected errors
        logger.error(`Unexpected error occurred while deleting blogcategorys: ${err.message || 'Unknown error'}`);
        req.flash('danger', err.message || 'An unexpected error occurred while deleting the BlogCategorys.');
        res.redirect('/blogcategory');
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

        BlogCategory.findOne({ _id: id })
            .then(r_detail => {
                console.log(r_detail);
                const record_detail = {};
                record_detail.showStatus = !r_detail.showStatus;

                BlogCategory.updateOne({ _id: id }, { $set: record_detail }).then(num => {
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
