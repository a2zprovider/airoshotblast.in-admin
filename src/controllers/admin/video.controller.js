const Video = require('../../schemas/video.js');

const multer = require('multer');
const fs = require('fs');
const slugify = require('slugify');
const path = require('path');
const mongoose = require('mongoose');
const logger = require('../../logger.js');

// Set up storage for Multer
const storage = multer.diskStorage({
    destination: function (req, file, callback) {
        const dir = "./src/public/upload/video";

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

// Create a new Video 
exports.add = async (req, res) => {

    const user = req.cookies['user'];

    const success = req.flash('success');
    const danger = req.flash('danger');
    const info = req.flash('info');

    return res.render('pages/video/add', { user, success, danger, info, page_title: 'Video Add', page_url: 'video.add' });
};

// Create and Save a new Video
exports.create = (req, res) => {

    // Create a Video
    upload(req, res, function (err) {
        const video = {};
        if (err) {
            return res.redirect('/video/create');
        }

        if (req.file) {
            video.image = req.file.filename;
        }

        if (!req.body.title) {
            req.flash('danger', 'Please enter title.');
            return res.redirect('/video/create');
        }

        video.title = req.body.title;
        video.url = req.body.url;

        // Save video in the database
        Video.create(video)
            .then(data => {
                req.flash('success', `Video created successfully!`);
                return res.redirect('/video');
            })
            .catch(err => {
                req.flash('danger', err.message || 'Some error occurred while creating the Video.');
                return res.redirect('/video/create');
            });
    })

};

// Retrieve all Video from the database.
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

    Video.count(condition).then(count => {
        Video.find(condition).skip(offset).limit(limit)
            .then(data => {
                const lists = {
                    data: data, current: page, offset: offset,
                    pages: Math.ceil(count / limit)
                };
                return res.render('pages/video/list', {
                    lists: {
                        data: data, current: page, offset: offset,
                        pages: Math.ceil(count / limit)
                    },
                    query: query,
                    user, success, danger, info, page_title: 'Video List', page_url: 'video.list', url: req.pathname
                });
            })
            .catch(err => {
                req.flash('danger', err.message || 'Some error occurred while creating the Video.');
                return res.redirect('/video');
            });
    });
};

// Find a single Video with an id
exports.findOne = (req, res) => {
    const id = req.params.id;
    Video.findOne({ _id: id })
        .then(data => {
            if (data) {
                return res.send({ data: data });
            } else {
                return res.status(404).send({
                    message: `Cannot find Video with id=${id}.`
                });
            }
        })
        .catch(err => {
            return res.status(500).send({
                message: "Error retrieving Video with id=" + id
            });
        });
};

exports.edit = async (req, res) => {
    const user = req.cookies['user'];

    const success = req.flash('success');
    const danger = req.flash('danger');
    const info = req.flash('info');

    const id = req.params.id;
    Video.findOne({ _id: id })
        .then(data => {
            if (data) {
                return res.render('pages/video/edit', {
                    list: data, user, success, danger, info, page_title: 'Video Edit', page_url: 'video.edit'
                });
            } else {
                req.flash('danger', `Cannot find Video with id=${id}.`);
                return res.redirect('/video');
            }
        })
        .catch(err => {
            req.flash('danger', 'Error updating Video with id=' + id);
            return res.redirect('/video');
        });
};


// Update a Video by the id in the request
exports.update = (req, res) => {
    const id = req.params.id;

    upload(req, res, function (err) {
        if (err) {
            return res.redirect('/video/edit/' + id);
        }

        const video_detail = {};

        video_detail.title = req.body.title;
        video_detail.url = req.body.url;

        if (req.file) {
            video_detail.image = req.file.filename;
        }

        Video.updateOne({ _id: id }, { $set: video_detail }).then(num => {
            if (num.ok == 1) {
                req.flash('success', `Video updated successfully!`);
                return res.redirect('/video');
            } else {
                req.flash('danger', `Cannot update Video with id=${id}. Maybe Video was not found or req.body is empty!`);
                return res.redirect('/video/edit/' + id);
            }
        })
            .catch(err => {
                req.flash('danger', 'Error updating Video with id=' + id);
                return res.redirect('/video/edit/' + id);
            });

    })
};

// Delete a Video with the specified id in the request
exports.delete = (req, res) => {
    try {
        const id = req.params.id;

        // Validate the Video ID
        if (!id || !mongoose.Types.ObjectId.isValid(id)) {
            req.flash('danger', 'Invalid Video ID.');
            logger.warn(`Attempt to delete with invalid ID: ${id}`);
            return res.redirect('/video');
        }

        // Proceed to delete the video
        Video.deleteOne({ _id: id })
            .then(result => {
                if (result.deletedCount === 1) {
                    // Successful deletion
                    req.flash('success', `Video deleted successfully!`);
                    res.redirect('/video');
                } else {
                    // No document was deleted (Video not found)
                    req.flash('danger', `Cannot delete Video with id=${id}. Maybe the Video was not found!`);
                    logger.warn(`Video with ID ${id} not found for deletion.`);
                    res.redirect('/video');
                }
            })
            .catch(err => {
                // Log and handle errors from the database
                logger.error(`Error occurred while deleting Video with ID ${id} - ${err.message || 'Unknown error'}`);
                req.flash('danger', `Could not delete Video with id=${id}. Please try again later.`);
                res.redirect('/video');
            });
    } catch (err) {
        // Catch unexpected errors and log them
        logger.error(`Unexpected error during delete operation for Video with ID ${req.params.id} - ${err.message || 'Unknown error'}`);
        req.flash('danger', 'An unexpected error occurred while attempting to delete the Video.');
        res.redirect('/video');
    }
};

// Delete all Video from the database.
exports.deleteAll = (req, res) => {
    try {
        // Validate the ID array
        if (!req.body.id || !Array.isArray(req.body.id) || req.body.id.length === 0) {
            req.flash('danger', 'No video IDs provided for deletion.');
            logger.warn('No video IDs provided for deletion.');
            return res.redirect('/video');
        }

        // Validate each ID in the array
        const invalidIds = req.body.id.filter(id => !mongoose.Types.ObjectId.isValid(id));
        if (invalidIds.length > 0) {
            req.flash('danger', `Invalid video IDs: ${invalidIds.join(', ')}`);
            logger.warn(`Invalid video IDs: ${invalidIds.join(', ')}`);
            return res.redirect('/video');
        }

        // Proceed with deletion
        Video.deleteMany({ _id: { $in: req.body.id } })
            .then(nums => {
                if (nums.deletedCount > 0) {
                    req.flash('success', `${nums.deletedCount} Video(s) were deleted successfully!`);
                    logger.info(`${nums.deletedCount} Video(s) deleted successfully.`);
                } else {
                    req.flash('danger', 'No Videos were deleted. Please check if the videos exist.');
                    logger.warn('No Videos were deleted, either due to non-existence or invalid IDs.');
                }
                res.redirect('/video');
            })
            .catch(err => {
                // Log the error and provide a user-friendly message
                logger.error(`Error deleting videos: ${err.message || 'Unknown error'}`);
                req.flash('danger', err.message || 'Some error occurred while deleting the Videos.');
                res.redirect('/video');
            });

    } catch (err) {
        // Catch any unexpected errors
        logger.error(`Unexpected error occurred while deleting videos: ${err.message || 'Unknown error'}`);
        req.flash('danger', err.message || 'An unexpected error occurred while deleting the Videos.');
        res.redirect('/video');
    }
};