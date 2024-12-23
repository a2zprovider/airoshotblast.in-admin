const Role = require('../../schemas/role.js');
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
        const dir = "./src/public/upload/role";

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

// Create a new Role Page
exports.add = async (req, res) => {

    const user = req.cookies['user'];
    const permissions = await Permission.find().select(['resource', 'action', '_id']);

    const success = req.flash('success');
    const danger = req.flash('danger');
    const info = req.flash('info');

    res.render('pages/role/add', { user, success, danger, info, permissions, page_title: 'Role Add', page_url: 'role.add' });
};

// Create and Save a new Role
exports.create = (req, res) => {

    // Create a Role
    upload(req, res, function (err) {
        const role = {};
        if (err) {
            res.redirect('/role/create');
        }
        if (!req.body.name) {
            req.flash('danger', 'Please enter name.');
            res.redirect('/role/create');
        }

        role.name = req.body.name;
        role.permissions = req.body.permissions;

        // Save Role in the database
        Role.create(role)
            .then(data => {
                req.flash('success', `Role created successfully!`);
                res.redirect('/role');
            })
            .catch(err => {
                req.flash('danger', err.message || 'Some error occurred while creating the role.');
                res.redirect('/role/create');
            });
    })

};

// Retrieve all Role from the database.
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

    Role.count(condition).then(count => {
        Role.find(condition).skip(offset).limit(limit)
            .then(data => {
                res.render('pages/role/list', {
                    lists: {
                        data: data, current: page, offset: offset,
                        pages: Math.ceil(count / limit)
                    },
                    query: query,
                    user, success, danger, info, page_title: 'Role List', page_url: 'role.list', url: req.pathname
                });
            })
            .catch(err => {
                req.flash('danger', err.message || 'Some error occurred while creating the Role.');
                res.redirect('/role');
            });
    });
};

// Find a single Role with an id
exports.findOne = (req, res) => {
    const id = req.params.id;
    Role.findOne({ _id: id })
        .then(data => {
            if (data) {
                return res.send({ data: data });
            } else {
                return res.status(404).send({
                    message: `Cannot find Role with id=${id}.`
                });
            }
        })
        .catch(err => {
            return res.status(500).send({
                message: "Error retrieving Role with id=" + id
            });
        });
};

exports.edit = async (req, res) => {
    const user = req.cookies['user'];
    const permissions = await Permission.find().select(['resource', 'action', '_id']);

    const success = req.flash('success');
    const danger = req.flash('danger');
    const info = req.flash('info');

    const id = req.params.id;
    Role.findOne({ _id: id })
        .then(data => {
            if (data) {
                res.render('pages/role/edit', {
                    list: data, user, success, danger, info, permissions, page_title: 'Role Edit', page_url: 'role.edit'
                });
            } else {
                req.flash('danger', `Cannot find Role with id=${id}.`);
                res.redirect('/role');
            }
        })
        .catch(err => {
            req.flash('danger', 'Error updating Role with id=' + id);
            res.redirect('/role');
        });
};

// Update a Role by the id in the request
exports.update = async (req, res) => {
    const id = req.params.id;

    const data = await Role.findOne({ _id: id });
    upload(req, res, function (err) {
        if (err) {
            res.redirect('/role/edit/' + id);
        }

        const role_detail = {};

        role_detail.name = req.body.name;
        role_detail.permissions = req.body.permissions;

        Role.updateOne({ _id: id }, { $set: role_detail }).then(num => {
            if (num.ok == 1) {
                req.flash('success', `Role updated successfully!`);
                res.redirect('/role');
            } else {
                req.flash('danger', `Cannot update Role with id=${id}. Maybe Role was not found or req.body is empty!`);
                res.redirect('/role/edit/' + id);
            }
        })
            .catch(err => {
                req.flash('danger', 'Error updating Role with id=' + id);
                res.redirect('/role/edit/' + id);
            });
    })
};

// Delete a Role with the specified id in the request
exports.delete = (req, res) => {
    try {
        const id = req.params.id;

        // Validate the Role ID
        if (!id || !mongoose.Types.ObjectId.isValid(id)) {
            req.flash('danger', 'Invalid Role ID.');
            logger.warn(`Attempt to delete with invalid ID: ${id}`);
            return res.redirect('/role');
        }

        // Proceed to delete the role
        Role.deleteOne({ _id: id })
            .then(result => {
                if (result.deletedCount === 1) {
                    // Successful deletion
                    req.flash('success', `Role deleted successfully!`);
                    res.redirect('/role');
                } else {
                    // No document was deleted (Role not found)
                    req.flash('danger', `Cannot delete Role with id=${id}. Maybe the Role was not found!`);
                    logger.warn(`Role with ID ${id} not found for deletion.`);
                    res.redirect('/role');
                }
            })
            .catch(err => {
                // Log and handle errors from the database
                logger.error(`Error occurred while deleting Role with ID ${id} - ${err.message || 'Unknown error'}`);
                req.flash('danger', `Could not delete Role with id=${id}. Please try again later.`);
                res.redirect('/role');
            });
    } catch (err) {
        // Catch unexpected errors and log them
        logger.error(`Unexpected error during delete operation for Role with ID ${req.params.id} - ${err.message || 'Unknown error'}`);
        req.flash('danger', 'An unexpected error occurred while attempting to delete the Role.');
        res.redirect('/role');
    }
};

// Delete all Role from the database.
exports.deleteAll = (req, res) => {
    try {
        // Validate the ID array
        if (!req.body.id || !Array.isArray(req.body.id) || req.body.id.length === 0) {
            req.flash('danger', 'No role IDs provided for deletion.');
            logger.warn('No role IDs provided for deletion.');
            return res.redirect('/role');
        }

        // Validate each ID in the array
        const invalidIds = req.body.id.filter(id => !mongoose.Types.ObjectId.isValid(id));
        if (invalidIds.length > 0) {
            req.flash('danger', `Invalid role IDs: ${invalidIds.join(', ')}`);
            logger.warn(`Invalid role IDs: ${invalidIds.join(', ')}`);
            return res.redirect('/role');
        }

        // Proceed with deletion
        Role.deleteMany({ _id: { $in: req.body.id } })
            .then(nums => {
                if (nums.deletedCount > 0) {
                    req.flash('success', `${nums.deletedCount} Role(s) were deleted successfully!`);
                    logger.info(`${nums.deletedCount} Role(s) deleted successfully.`);
                } else {
                    req.flash('danger', 'No Roles were deleted. Please check if the roles exist.');
                    logger.warn('No Roles were deleted, either due to non-existence or invalid IDs.');
                }
                res.redirect('/role');
            })
            .catch(err => {
                // Log the error and provide a user-friendly message
                logger.error(`Error deleting roles: ${err.message || 'Unknown error'}`);
                req.flash('danger', err.message || 'Some error occurred while deleting the Roles.');
                res.redirect('/role');
            });

    } catch (err) {
        // Catch any unexpected errors
        logger.error(`Unexpected error occurred while deleting roles: ${err.message || 'Unknown error'}`);
        req.flash('danger', err.message || 'An unexpected error occurred while deleting the Roles.');
        res.redirect('/role');
    }
};