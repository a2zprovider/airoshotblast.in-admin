const Job = require('../../schemas/job.js');

const multer = require('multer');
const fs = require('fs');
const slugify = require('slugify');
const path = require('path');
const mongoose = require('mongoose');
const logger = require('../../logger.js');

// Set up storage for Multer
const storage = multer.diskStorage({
    destination: function (req, file, callback) {
        const dir = "./src/public/upload/job";

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
}).single('resume'); // Handling single file upload (adjust if needed for multiple files)

// Create a new Job 
exports.add = async (req, res) => {

    const user = req.cookies['user'];

    const success = req.flash('success');
    const danger = req.flash('danger');
    const info = req.flash('info');

    return res.render('pages/job/add', { user, success, danger, info, page_title: 'Job Add', page_url: 'job.add' });
};

// Create and Save a new Job
exports.create = (req, res) => {

    // Create a Job
    upload(req, res, function (err) {
        const job = {};
        if (err) {
            return res.redirect('/job/create');
        }

        if (req.file) {
            job.resume = req.file.filename;
        }

        if (!req.body.title) {
            req.flash('danger', 'Please enter title.');
            return res.redirect('/job/create');
        }
        if (!req.body.description) {
            req.flash('danger', 'Please enter description.');
            return res.redirect('/job/create');
        }

        job.title = req.body.title;
        job.slug = req.body.slug ? slugify(req.body.slug, { lower: true }) : slugify(req.body.title, { lower: true });
        job.except = req.body.except;
        job.description = req.body.description;
        job.vacancy = req.body.vacancy;
        job.address = req.body.address;

        job.seo_title = req.body.seo_title;
        job.seo_keywords = req.body.seo_keywords;
        job.seo_description = req.body.seo_description;

        // Save job in the database
        Job.create(job)
            .then(data => {
                req.flash('success', `Job created successfully!`);
                return res.redirect('/job');
            })
            .catch(err => {
                req.flash('danger', err.message || 'Some error occurred while creating the Job.');
                return res.redirect('/job/create');
            });
    })

};

// Retrieve all Job from the database.
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

    Job.count(condition).then(count => {
        Job.find(condition)
        .populate('job').skip(offset).limit(limit)
            .then(data => {
                return res.render('pages/job/list', {
                    lists: {
                        data: data, current: page, offset: offset,
                        pages: Math.ceil(count / limit)
                    },
                    query: query,
                    user, success, danger, info, page_title: 'Job List', page_url: 'job.list', url: req.pathname
                });
            })
            .catch(err => {
                req.flash('danger', err.message || 'Some error occurred while creating the Job.');
                return res.redirect('/job');
            });
    });
};

// Find a single Job with an id
exports.findOne = (req, res) => {
    const id = req.params.id;
    Job.findOne({ _id: id })
        .then(data => {
            if (data) {
                return res.send({ data: data });
            } else {
                return res.status(404).send({
                    message: `Cannot find Job with id=${id}.`
                });
            }
        })
        .catch(err => {
            return res.status(500).send({
                message: "Error retrieving Job with id=" + id
            });
        });
};

exports.edit = async (req, res) => {
    const user = req.cookies['user'];

    const success = req.flash('success');
    const danger = req.flash('danger');
    const info = req.flash('info');

    const id = req.params.id;
    Job.findOne({ _id: id })
        .then(data => {
            if (data) {
                return res.render('pages/job/edit', {
                    list: data, user, success, danger, info, page_title: 'Job Edit', page_url: 'job.edit'
                });
            } else {
                req.flash('danger', `Cannot find Job with id=${id}.`);
                return res.redirect('/job');
            }
        })
        .catch(err => {
            req.flash('danger', 'Error updating Job with id=' + id);
            return res.redirect('/job');
        });
};

// Update a Job by the id in the request
exports.update = (req, res) => {
    const id = req.params.id;

    upload(req, res, function (err) {
        if (err) {
            return res.redirect('/job/edit/' + id);
        }

        const job_detail = {};

        job_detail.review = req.body.review;
        job_detail.status = req.body.status;

        if (req.file) {
            job_detail.resume = req.file.filename;
        }

        Job.updateOne({ _id: id }, { $set: job_detail }).then(num => {
            if (num.ok == 1) {
                req.flash('success', `Job updated successfully!`);
                return res.redirect('/job');
            } else {
                req.flash('danger', `Cannot update Job with id=${id}. Maybe Job was not found or req.body is empty!`);
                return res.redirect('/job/edit/' + id);
            }
        })
            .catch(err => {
                req.flash('danger', 'Error updating Job with id=' + id);
                return res.redirect('/job/edit/' + id);
            });

    })
};

// Delete a Job with the specified id in the request
exports.delete = (req, res) => {
    try {
        const id = req.params.id;

        // Validate the Job ID
        if (!id || !mongoose.Types.ObjectId.isValid(id)) {
            req.flash('danger', 'Invalid Job ID.');
            logger.warn(`Attempt to delete with invalid ID: ${id}`);
            return res.redirect('/job');
        }

        // Proceed to delete the job
        Job.deleteOne({ _id: id })
            .then(result => {
                if (result.deletedCount === 1) {
                    // Successful deletion
                    req.flash('success', `Job deleted successfully!`);
                    res.redirect('/job');
                } else {
                    // No document was deleted (Job not found)
                    req.flash('danger', `Cannot delete Job with id=${id}. Maybe the Job was not found!`);
                    logger.warn(`Job with ID ${id} not found for deletion.`);
                    res.redirect('/job');
                }
            })
            .catch(err => {
                // Log and handle errors from the database
                logger.error(`Error occurred while deleting Job with ID ${id} - ${err.message || 'Unknown error'}`);
                req.flash('danger', `Could not delete Job with id=${id}. Please try again later.`);
                res.redirect('/job');
            });
    } catch (err) {
        // Catch unexpected errors and log them
        logger.error(`Unexpected error during delete operation for Job with ID ${req.params.id} - ${err.message || 'Unknown error'}`);
        req.flash('danger', 'An unexpected error occurred while attempting to delete the Job.');
        res.redirect('/job');
    }
};

// Delete all Job from the database.
exports.deleteAll = (req, res) => {
    try {
        // Validate the ID array
        if (!req.body.id || !Array.isArray(req.body.id) || req.body.id.length === 0) {
            req.flash('danger', 'No job IDs provided for deletion.');
            logger.warn('No job IDs provided for deletion.');
            return res.redirect('/job');
        }

        // Validate each ID in the array
        const invalidIds = req.body.id.filter(id => !mongoose.Types.ObjectId.isValid(id));
        if (invalidIds.length > 0) {
            req.flash('danger', `Invalid job IDs: ${invalidIds.join(', ')}`);
            logger.warn(`Invalid job IDs: ${invalidIds.join(', ')}`);
            return res.redirect('/job');
        }

        // Proceed with deletion
        Job.deleteMany({ _id: { $in: req.body.id } })
            .then(nums => {
                if (nums.deletedCount > 0) {
                    req.flash('success', `${nums.deletedCount} Job(s) were deleted successfully!`);
                    logger.info(`${nums.deletedCount} Job(s) deleted successfully.`);
                } else {
                    req.flash('danger', 'No Jobs were deleted. Please check if the jobs exist.');
                    logger.warn('No Jobs were deleted, either due to non-existence or invalid IDs.');
                }
                res.redirect('/job');
            })
            .catch(err => {
                // Log the error and provide a user-friendly message
                logger.error(`Error deleting jobs: ${err.message || 'Unknown error'}`);
                req.flash('danger', err.message || 'Some error occurred while deleting the Jobs.');
                res.redirect('/job');
            });

    } catch (err) {
        // Catch any unexpected errors
        logger.error(`Unexpected error occurred while deleting jobs: ${err.message || 'Unknown error'}`);
        req.flash('danger', err.message || 'An unexpected error occurred while deleting the Jobs.');
        res.redirect('/job');
    }
};