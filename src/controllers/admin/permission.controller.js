const Permission = require('../../schemas/permission.js');

const multer = require('multer');
const fs = require('fs');
const slugify = require('slugify');
const path = require('path');
const mongoose = require('mongoose');
const logger = require('../../logger.js');

// Set up storage for Multer
const storage = multer.diskStorage({
    destination: function (req, file, callback) {
        const dir = "./src/public/upload/permission";

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

// Create a new Permission Page
exports.add = async (req, res) => {
    let data = [{ resource: 'Slider', action: 'Read' },
    { resource: 'Slider', action: 'Add' },
    { resource: 'Slider', action: 'Create' },
    { resource: 'Slider', action: 'Edit' },
    { resource: 'Slider', action: 'Update' },
    { resource: 'Slider', action: 'Delete' }];

    data.forEach(element => {
        const permission = {};
        permission.resource = element.resource;
        permission.action = element.action;
        Permission.create(permission);
    });

    const user = req.cookies['user'];

    const success = req.flash('success');
    const danger = req.flash('danger');
    const info = req.flash('info');

    res.render('pages/permission/add', { user, success, danger, info, page_title: 'Permission Add', page_url: 'permission.add' });
};

// Create and Save a new Permission
exports.create = (req, res) => {

    // Create a Permission
    upload(req, res, function (err) {
        const permission = {};
        if (err) {
            res.redirect('/permission/create');
        }
        if (!req.body.resource) {
            req.flash('danger', 'Please enter resource.');
            res.redirect('/permission/create');
        }
        if (!req.body.action) {
            req.flash('danger', 'Please enter action.');
            res.redirect('/permission/create');
        }

        permission.resource = req.body.resource;
        permission.action = req.body.action;

        // Save Permission in the database
        Permission.create(permission)
            .then(data => {
                req.flash('success', `Permission created successfully!`);
                res.redirect('/permission');
            })
            .catch(err => {
                req.flash('danger', err.message || 'Some error occurred while creating the permission.');
                res.redirect('/permission/create');
            });
    })

};

// Retrieve all Permission from the database.
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

    Permission.count(condition).then(count => {
        Permission.find(condition).skip(offset).limit(limit)
            .then(data => {
                res.render('pages/permission/list', {
                    lists: {
                        data: data, current: page, offset: offset,
                        pages: Math.ceil(count / limit)
                    },
                    query: query,
                    user, success, danger, info, page_title: 'Permission List', page_url: 'permission.list', url: req.pathname
                });
            })
            .catch(err => {
                req.flash('danger', err.message || 'Some error occurred while creating the Permission.');
                res.redirect('/permission');
            });
    });
};

// Find a single Permission with an id
exports.findOne = (req, res) => {
    const id = req.params.id;
    Permission.findOne({ _id: id })
        .then(data => {
            if (data) {
                return res.send({ data: data });
            } else {
                return res.status(404).send({
                    message: `Cannot find Permission with id=${id}.`
                });
            }
        })
        .catch(err => {
            return res.status(500).send({
                message: "Error retrieving Permission with id=" + id
            });
        });
};

exports.edit = async (req, res) => {
    const user = req.cookies['user'];

    const success = req.flash('success');
    const danger = req.flash('danger');
    const info = req.flash('info');

    const id = req.params.id;
    Permission.findOne({ _id: id })
        .then(data => {
            if (data) {
                res.render('pages/permission/edit', {
                    list: data, user, success, danger, info, page_title: 'Permission Edit', page_url: 'permission.edit'
                });
            } else {
                req.flash('danger', `Cannot find Permission with id=${id}.`);
                res.redirect('/permission');
            }
        })
        .catch(err => {
            req.flash('danger', 'Error updating Permission with id=' + id);
            res.redirect('/permission');
        });
};

// Update a Permission by the id in the request
exports.update = async (req, res) => {
    const id = req.params.id;

    const data = await Permission.findOne({ _id: id });
    upload(req, res, function (err) {
        if (err) {
            res.redirect('/permission/edit/' + id);
        }

        const permission_detail = {};

        permission_detail.resource = req.body.resource;
        permission_detail.action = req.body.action;

        Permission.updateOne({ _id: id }, { $set: permission_detail }).then(num => {
            if (num.ok == 1) {
                req.flash('success', `Permission updated successfully!`);
                res.redirect('/permission');
            } else {
                req.flash('danger', `Cannot update Permission with id=${id}. Maybe Permission was not found or req.body is empty!`);
                res.redirect('/permission/edit/' + id);
            }
        })
            .catch(err => {
                req.flash('danger', 'Error updating Permission with id=' + id);
                res.redirect('/permission/edit/' + id);
            });
    })
};

// Delete a Permission with the specified id in the request
exports.delete = (req, res) => {
    try {
        const id = req.params.id;

        // Validate the Permission ID
        if (!id || !mongoose.Types.ObjectId.isValid(id)) {
            req.flash('danger', 'Invalid Permission ID.');
            logger.warn(`Attempt to delete with invalid ID: ${id}`);
            return res.redirect('/permission');
        }

        // Proceed to delete the permission
        Permission.deleteOne({ _id: id })
            .then(result => {
                if (result.deletedCount === 1) {
                    // Successful deletion
                    req.flash('success', `Permission deleted successfully!`);
                    res.redirect('/permission');
                } else {
                    // No document was deleted (Permission not found)
                    req.flash('danger', `Cannot delete Permission with id=${id}. Maybe the Permission was not found!`);
                    logger.warn(`Permission with ID ${id} not found for deletion.`);
                    res.redirect('/permission');
                }
            })
            .catch(err => {
                // Log and handle errors from the database
                logger.error(`Error occurred while deleting Permission with ID ${id} - ${err.message || 'Unknown error'}`);
                req.flash('danger', `Could not delete Permission with id=${id}. Please try again later.`);
                res.redirect('/permission');
            });
    } catch (err) {
        // Catch unexpected errors and log them
        logger.error(`Unexpected error during delete operation for Permission with ID ${req.params.id} - ${err.message || 'Unknown error'}`);
        req.flash('danger', 'An unexpected error occurred while attempting to delete the Permission.');
        res.redirect('/permission');
    }
};

// Delete all Permission from the database.
exports.deleteAll = (req, res) => {
    try {
        // Validate the ID array
        if (!req.body.id || !Array.isArray(req.body.id) || req.body.id.length === 0) {
            req.flash('danger', 'No permission IDs provided for deletion.');
            logger.warn('No permission IDs provided for deletion.');
            return res.redirect('/permission');
        }

        // Validate each ID in the array
        const invalidIds = req.body.id.filter(id => !mongoose.Types.ObjectId.isValid(id));
        if (invalidIds.length > 0) {
            req.flash('danger', `Invalid permission IDs: ${invalidIds.join(', ')}`);
            logger.warn(`Invalid permission IDs: ${invalidIds.join(', ')}`);
            return res.redirect('/permission');
        }

        // Proceed with deletion
        Permission.deleteMany({ _id: { $in: req.body.id } })
            .then(nums => {
                if (nums.deletedCount > 0) {
                    req.flash('success', `${nums.deletedCount} Permission(s) were deleted successfully!`);
                    logger.info(`${nums.deletedCount} Permission(s) deleted successfully.`);
                } else {
                    req.flash('danger', 'No Permissions were deleted. Please check if the permissions exist.');
                    logger.warn('No Permissions were deleted, either due to non-existence or invalid IDs.');
                }
                res.redirect('/permission');
            })
            .catch(err => {
                // Log the error and provide a user-friendly message
                logger.error(`Error deleting permissions: ${err.message || 'Unknown error'}`);
                req.flash('danger', err.message || 'Some error occurred while deleting the Permissions.');
                res.redirect('/permission');
            });

    } catch (err) {
        // Catch any unexpected errors
        logger.error(`Unexpected error occurred while deleting permissions: ${err.message || 'Unknown error'}`);
        req.flash('danger', err.message || 'An unexpected error occurred while deleting the Permissions.');
        res.redirect('/permission');
    }
};