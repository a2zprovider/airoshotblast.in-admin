const Career = require('../../schemas/career.js');
const Job = require('../../schemas/job.js');

const multer = require('multer');
const fs = require('fs');
const path = require('path');

// Configure multer storage
const storage = multer.diskStorage({
    destination: function (req, res, callback) {
        const dir = "./src/public/upload/job";

        // Check if the upload directory exists, if not, create it
        if (!fs.existsSync(dir)) {
            try {
                fs.mkdirSync(dir, { recursive: true });
            } catch (error) {
                console.error('Error creating upload directory:', error);
                return callback(new Error('Failed to create upload directory'), null);
            }
        }
        callback(null, dir);
    },
    filename: function (req, res, callback) {
        callback(null, res.fieldname + '-' + Date.now() + path.extname(res.originalname));
    }
});

const upload = multer({ storage: storage }).single('file');

// Retrieve all Careers from the database.
exports.findAll = async (req, res) => {
    const { page = 1, limit = 10, search, country } = req.query;
    const offset = (page - 1) * limit;
    let query = {};

    if (search) {
        query.title = { $regex: search, $options: 'i' };
    }

    try {
        const careers = await Career.find(query).skip(offset).limit(parseInt(limit)).exec();
        const count = await Career.find(query).countDocuments();

        let lists = {
            data: careers,
            current: page,
            offset: offset,
            pages: Math.ceil(count / limit),
        };

        return res.status(200).send({
            success: true,
            message: `${count} Records Found`,
            data: lists,
        });
    } catch (err) {
        console.error('Error fetching careers:', err);
        return res.status(500).send({
            success: false,
            message: 'Internal Server Error',
            error: err.message || 'An error occurred while fetching careers.',
        });
    }
};

// Find a single Career with a slug
exports.findOne = async (req, res) => {
    const slug = req.params.slug;

    try {
        const career = await Career.findOne({ slug: slug });
        if (!career) {
            return res.status(404).send({
                success: false,
                message: 'Career not found',
            });
        }
        return res.status(200).send({
            success: true,
            message: 'Record Found',
            data: career,
        });
    } catch (err) {
        console.error('Error fetching career:', err);
        return res.status(500).send({
            success: false,
            message: 'Internal Server Error',
            error: err.message || 'An error occurred while fetching the career.',
        });
    }
};

// Job application upload and creation
exports.job = (req, res) => {
    try {
        // Handle the file upload using multer
        upload(req, res, function (err) {
            if (err) {
                console.error('File upload error:', err);
                // Handle specific upload errors
                return res.status(500).json({
                    success: false,
                    message: 'File upload failed',
                    error: err.message || 'An error occurred during file upload.',
                });
            }

            // Validate if file is provided
            if (!req.file) {
                return res.status(400).json({
                    success: false,
                    message: 'Please select a resume file to upload',
                });
            }

            // Prepare the job object with the resume file name and career details
            const job = {
                resume: req.file.filename, // File name
                career: req.body.career || '', // Career id or slug
            };

            // Validate career field
            if (!job.career) {
                return res.status(400).json({
                    success: false,
                    message: 'Career information is required.',
                });
            }

            // Save the job application to the database
            Job.create(job)
                .then(data => {
                    return res.status(201).json({
                        success: true,
                        message: 'Job application submitted successfully. We will get in touch soon.',
                    });
                })
                .catch(err => {
                    console.error('Error creating job:', err);
                    return res.status(500).json({
                        success: false,
                        message: 'Failed to submit job application',
                        error: err.message || 'An error occurred while submitting the job application.',
                    });
                });
        });
    } catch (error) {
        console.error('Error handling job application:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal Server Error',
            error: error.message || 'An unexpected error occurred.',
        });
    }
};
