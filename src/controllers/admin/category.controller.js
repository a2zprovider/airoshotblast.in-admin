const Category = require('../../schemas/category.js');

const multer = require('multer');
const fs = require('fs');
const slugify = require('slugify');
const path = require('path');
const mongoose = require('mongoose');
const logger = require('../../logger.js');

// Set up storage for Multer
const storage = multer.diskStorage({
    destination: function (req, file, callback) {
        const dir = "./src/public/upload/category";

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

// Create a new Category Page
exports.add = async (req, res) => {

    const user = req.cookies['user'];
    const categories = await Category.find();

    const success = req.flash('success');
    const danger = req.flash('danger');
    const info = req.flash('info');

    res.render('pages/category/add', { user, success, danger, info, categories, page_title: 'Category Add', page_url: 'category.add' });
};

// Create and Save a new Category
exports.create = (req, res) => {

    // Create a Category
    upload(req, res, function (err) {
        const category = {};
        if (err) {
            res.redirect('/category/create');
        }

        if (req.file) {
            category.image = req.file.filename;
        }

        if (!req.body.title) {
            req.flash('danger', 'Please enter title.');
            res.redirect('/category/create');
        }
        if (!req.body.description) {
            req.flash('danger', 'Please enter description.');
            res.redirect('/category/create');
        }

        category.title = req.body.title;
        category.slug = req.body.slug ? slugify(req.body.slug, { lower: true }) : slugify(req.body.title, { lower: true });
        category.except = req.body.except;
        category.description = req.body.description;
        category.parent = req.body.parent;

        category.seo_title = req.body.seo_title;
        category.seo_keywords = req.body.seo_keywords;
        category.seo_description = req.body.seo_description;

        // Save Category in the database
        Category.create(category)
            .then(data => {
                req.flash('success', `Category created successfully!`);
                res.redirect('/category');
            })
            .catch(err => {
                req.flash('danger', err.message || 'Some error occurred while creating the Category.');
                res.redirect('/category/create');
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

    Category.count(condition).then(count => {
        Category.find(condition).skip(offset).limit(limit).populate('parent')
            .then(data => {
                res.render('pages/category/list', {
                    lists: {
                        data: data, current: page, offset: offset,
                        pages: Math.ceil(count / limit)
                    },
                    query: query,
                    user, success, danger, info, page_title: 'Category List', page_url: 'category.list', url: req.pathname
                });
            })
            .catch(err => {
                req.flash('danger', err.message || 'Some error occurred while creating the Category.');
                res.redirect('/category');
            });

    });
};

// Find a single Category with an id
exports.findOne = (req, res) => {
    const id = req.params.id;
    Category.findOne({ _id: id })
        .then(data => {
            if (data) {
                return res.send({ data: data });
            } else {
                return res.status(404).send({
                    message: `Cannot find Category with id=${id}.`
                });
            }
        })
        .catch(err => {
            return res.status(500).send({
                message: "Error retrieving Category with id=" + id
            });
        });
};

exports.edit = async (req, res) => {
    const user = req.cookies['user'];

    const success = req.flash('success');
    const danger = req.flash('danger');
    const info = req.flash('info');

    const id = req.params.id;

    const categories = await Category.find({ _id: { $ne: id } });

    Category.findOne({ _id: id })
        .then(data => {
            if (data) {
                res.render('pages/category/edit', {
                    list: data, user, success, danger, info, categories, page_title: 'Category Edit', page_url: 'category.edit'
                });
            } else {
                req.flash('danger', `Cannot find Category with id=${id}.`);
                res.redirect('/category');
            }
        })
        .catch(err => {
            req.flash('danger', 'Error updating Category with id=' + id);
            res.redirect('/category');
        });
};

// Update a Category by the id in the request
exports.update = (req, res) => {
    const id = req.params.id;

    upload(req, res, function (err) {
        if (err) {
            res.redirect('/category/edit/' + id);
        }

        const category_detail = {};

        category_detail.title = req.body.title;
        category_detail.slug = req.body.slug ? slugify(req.body.slug, { lower: true }) : slugify(req.body.title, { lower: true });
        category_detail.except = req.body.except;
        category_detail.description = req.body.description;
        category_detail.parent = req.body.parent;

        category_detail.seo_title = req.body.seo_title;
        category_detail.seo_keywords = req.body.seo_keywords;
        category_detail.seo_description = req.body.seo_description;

        if (req.file) {
            category_detail.image = req.file.filename;
        }

        Category.updateOne({ _id: id }, { $set: category_detail }).then(num => {
            if (num.ok == 1) {
                req.flash('success', `Category updated successfully!`);
                res.redirect('/category');
            } else {
                req.flash('danger', `Cannot update Category with id=${id}. Maybe Category was not found or req.body is empty!`);
                res.redirect('/category/edit/' + id);
            }
        })
            .catch(err => {
                req.flash('danger', 'Error updating Category with id=' + id);
                res.redirect('/category/edit/' + id);
            });

    })
};

// Delete a Category with the specified id in the request
exports.delete = (req, res) => {
    try {
        const id = req.params.id;

        // Validate the Category ID
        if (!id || !mongoose.Types.ObjectId.isValid(id)) {
            req.flash('danger', 'Invalid Category ID.');
            logger.warn(`Attempt to delete with invalid ID: ${id}`);
            return res.redirect('/category');
        }

        // Proceed to delete the category
        Category.deleteOne({ _id: id })
            .then(result => {
                if (result.deletedCount === 1) {
                    // Successful deletion
                    req.flash('success', `Category deleted successfully!`);
                    res.redirect('/category');
                } else {
                    // No document was deleted (Category not found)
                    req.flash('danger', `Cannot delete Category with id=${id}. Maybe the Category was not found!`);
                    logger.warn(`Category with ID ${id} not found for deletion.`);
                    res.redirect('/category');
                }
            })
            .catch(err => {
                // Log and handle errors from the database
                logger.error(`Error occurred while deleting Category with ID ${id} - ${err.message || 'Unknown error'}`);
                req.flash('danger', `Could not delete Category with id=${id}. Please try again later.`);
                res.redirect('/category');
            });
    } catch (err) {
        // Catch unexpected errors and log them
        logger.error(`Unexpected error during delete operation for Category with ID ${req.params.id} - ${err.message || 'Unknown error'}`);
        req.flash('danger', 'An unexpected error occurred while attempting to delete the Category.');
        res.redirect('/category');
    }
};

// Delete all Category from the database.
exports.deleteAll = (req, res) => {
    try {
        // Validate the ID array
        if (!req.body.id || !Array.isArray(req.body.id) || req.body.id.length === 0) {
            req.flash('danger', 'No category IDs provided for deletion.');
            logger.warn('No category IDs provided for deletion.');
            return res.redirect('/category');
        }

        // Validate each ID in the array
        const invalidIds = req.body.id.filter(id => !mongoose.Types.ObjectId.isValid(id));
        if (invalidIds.length > 0) {
            req.flash('danger', `Invalid category IDs: ${invalidIds.join(', ')}`);
            logger.warn(`Invalid category IDs: ${invalidIds.join(', ')}`);
            return res.redirect('/category');
        }

        // Proceed with deletion
        Category.deleteMany({ _id: { $in: req.body.id } })
            .then(nums => {
                if (nums.deletedCount > 0) {
                    req.flash('success', `${nums.deletedCount} Category(s) were deleted successfully!`);
                    logger.info(`${nums.deletedCount} Category(s) deleted successfully.`);
                } else {
                    req.flash('danger', 'No Categorys were deleted. Please check if the categorys exist.');
                    logger.warn('No Categorys were deleted, either due to non-existence or invalid IDs.');
                }
                res.redirect('/category');
            })
            .catch(err => {
                // Log the error and provide a user-friendly message
                logger.error(`Error deleting categorys: ${err.message || 'Unknown error'}`);
                req.flash('danger', err.message || 'Some error occurred while deleting the Categorys.');
                res.redirect('/category');
            });

    } catch (err) {
        // Catch any unexpected errors
        logger.error(`Unexpected error occurred while deleting categorys: ${err.message || 'Unknown error'}`);
        req.flash('danger', err.message || 'An unexpected error occurred while deleting the Categorys.');
        res.redirect('/category');
    }
};