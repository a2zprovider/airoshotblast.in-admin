const Page = require('../../schemas/page.js');
const multer = require('multer');
const fs = require('fs');
const slugify = require('slugify');
const path = require('path');
const mongoose = require('mongoose');
const logger = require('../../logger.js');

const storage = multer.diskStorage({
    destination: function (req, res, callback) {
        try {
            // Check the fieldname to decide where to store the file
            let dir;
            if (res.fieldname === "image") {
                dir = "./src/public/upload/page";
            } else {
                dir = "./src/public/upload/page/other";
            }

            // Check if the directory exists, if not, create it
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true }); // Ensures parent directories are created if they don't exist
            }

            // Proceed to store the file
            callback(null, dir);
        } catch (err) {
            // Log any errors related to directory creation and pass the error to the callback
            logger.error(`Error in multer destination function: ${err.message || 'Unknown error'}`);
            callback(new Error('Error creating upload directory.'));
        }
    },

    filename: function (req, res, callback) {
        try {
            // Generate the file name based on the fieldname and current timestamp
            let fileName;
            if (res.fieldname === "image") {
                fileName = res.fieldname + '-' + Date.now() + Math.random().toString().substr(2, 6) + path.extname(res.originalname);
            } else {
                fileName = 'other' + Math.random().toString().substr(2, 6) + '-' + Date.now() + Math.random().toString().substr(2, 6) + path.extname(res.originalname);
            }

            // Pass the file name to the callback
            callback(null, fileName);
        } catch (err) {
            // Log any errors related to file name generation
            logger.error(`Error in multer filename function: ${err.message || 'Unknown error'}`);
            callback(new Error('Error generating file name.'));
        }
    }
});

// Create a multer instance with storage configuration and additional error handling
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024 // Set a file size limit of 10MB (can adjust as necessary)
    },
    fileFilter: function (req, file, callback) {
        // Filter allowed file types (e.g., only images and PDF)
        const allowedTypes = /jpg|jpeg|png|gif|webp|pdf/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);

        if (extname && mimetype) {
            return callback(null, true);
        } else {
            const errorMessage = 'Invalid file type. Only JPG, JPEG, PNG, GIF, WEBP, and PDF files are allowed.';
            logger.warn(`File upload error: ${errorMessage}`);
            return callback(new Error(errorMessage));
        }
    }
}).any();

// Create a new Page 
exports.add = async (req, res) => {
    try {
        // Retrieve user information from cookies
        const user = req.cookies['user'];

        // Retrieve all pages from the database
        const pages = await Page.find();

        // Fetch flash messages
        const success = req.flash('success');
        const danger = req.flash('danger');
        const info = req.flash('info');

        // Render the page with the fetched data
        res.render('pages/page/add', {
            user,
            success,
            danger,
            info,
            pages,
            page_title: 'Page Add',
            page_url: 'page.add'
        });

    } catch (err) {
        // Log the error and provide feedback to the user
        logger.error(`Error loading the 'add' page: ${err.message || 'Unknown error'}`);

        // Set a flash message for the error
        req.flash('danger', err.message || 'An error occurred while loading the page.');

        // Redirect to a fallback route or render an error page
        res.redirect('/page');
    }
};

// Create and Save a new Page
exports.create = (req, res) => {
    try {
        // Ensure file upload is completed before proceeding
        upload(req, res, function (err) {
            if (err) {
                // Log the error and send a user-friendly message
                logger.error(`File upload error: ${err.message || 'Unknown error'}`);
                req.flash('danger', `File upload error: ${err.message || 'Unknown error'}`);
                return res.redirect('/page/create');
            }

            // Create a page object
            const page = {};

            // Validate required fields
            if (!req.body.title) {
                req.flash('danger', 'Please enter a title.');
                return res.redirect('/page/create');
            }
            if (!req.body.description) {
                req.flash('danger', 'Please enter a description.');
                return res.redirect('/page/create');
            }

            // Prepare the page data
            page.title = req.body.title;
            page.slug = req.body.slug ? slugify(req.body.slug, { lower: true }) : slugify(req.body.title, { lower: true });
            page.except = req.body.except || '';
            page.description = req.body.description;
            page.parent = req.body.parent || null;

            // Handle image uploads
            if (req.files && req.files['image'] && req.files['image'][0]) {
                page.image = req.files['image'][0].filename;
            }

            // Handle additional field images
            if (req.files && req.files.length > 0) {
                req.files.forEach((file) => {
                    if (file.fieldname == 'image') {
                        page.image = file.filename; // Override the main image if present
                    }
                    if (file.fieldname.startsWith('field[image][')) {
                        const match = file.fieldname.match(/\[(\d+)\]/);
                        const index = match ? parseInt(match[1], 10) : null;
                        if (index !== null) {
                            req.body.field.img[index] = file.filename;
                        }
                    }
                });
            }

            // Prepare additional fields if provided
            const fields = {};
            if (req.body.field) {
                fields.title = req.body.field.title || [];
                fields.image = req.body.field.img || [];
                fields.description = req.body.field.description || [];
            }
            page.field = req.body.field ? JSON.stringify(fields) : '{"title":[],"image":[],"description":[]}';

            page.seo_title = req.body.seo_title || '';
            page.seo_keywords = req.body.seo_keywords || '';
            page.seo_description = req.body.seo_description || '';

            // Save the page to the database
            Page.create(page)
                .then(data => {
                    // Send a success message and redirect
                    req.flash('success', 'Page created successfully!');
                    res.redirect('/page');
                })
                .catch(err => {
                    // Log and handle any errors during database creation
                    logger.error(`Error creating page: ${err.message || 'Unknown error'}`);
                    req.flash('danger', err.message || 'Some error occurred while creating the Page.');
                    res.redirect('/page/create');
                });
        });
    } catch (err) {
        // Log the error and provide feedback
        logger.error(`Error creating page: ${err.message || 'Unknown error'}`);
        req.flash('danger', err.message || 'Some error occurred while creating the Page.');
        res.redirect('/page/create');
    }
};

// Retrieve all Page from the database.

exports.findAll = (req, res) => {
    const limit = parseInt(req.query.limit) || 10;  // Default to 10 if no limit is provided
    const page = parseInt(req.query.page) || 1;    // Default to 1 if no page is provided
    const offset = (page - 1) * limit;
    const user = req.cookies['user'];
    const query = req.query;
    const success = req.flash('success');
    const danger = req.flash('danger');
    const info = req.flash('info');
    const search = req.query.search;

    // Validate the limit and page parameters to ensure they are numbers and within reasonable bounds
    if (isNaN(limit) || limit <= 0 || limit > 1000) {
        req.flash('danger', 'Invalid limit value. Please provide a limit between 1 and 1000.');
        logger.warn(`Invalid limit value: ${limit}`);
        return res.redirect('/page');
    }

    if (isNaN(page) || page <= 0) {
        req.flash('danger', 'Invalid page number. Please provide a positive page number.');
        logger.warn(`Invalid page value: ${page}`);
        return res.redirect('/page');
    }

    // Build the search condition (if any search is provided)
    const condition = search ? { title: { $regex: search, $options: 'i' } } : {};

    // Count the total number of matching pages
    Page.countDocuments(condition)
        .then(count => {
            // Fetch pages based on the search query, pagination, and populate parent
            Page.find(condition)
                .skip(offset)
                .limit(limit)
                .populate('parent')
                .then(data => {
                    // Render the page list if data is found
                    res.render('pages/page/list', {
                        lists: {
                            data: data,
                            current: page,
                            offset: offset,
                            pages: Math.ceil(count / limit)
                        },
                        query: query,
                        user,
                        success,
                        danger,
                        info,
                        page_title: 'Page List',
                        page_url: 'page.list',
                        url: req.pathname
                    });
                })
                .catch(err => {
                    // Log the error and return a flash message to the user
                    logger.error(`Error retrieving pages: ${err.message || 'Unknown error'}`);
                    req.flash('danger', `Error retrieving pages: ${err.message || 'Unknown error'}`);
                    res.redirect('/page');
                });
        })
        .catch(err => {
            // Handle errors related to counting pages (e.g., database issues)
            logger.error(`Error counting pages: ${err.message || 'Unknown error'}`);
            req.flash('danger', `Error counting pages: ${err.message || 'Unknown error'}`);
            res.redirect('/page');
        });
};

// Find a single Page with an id
exports.findOne = (req, res) => {
    const id = req.params.id;

    // Validate if the provided id is a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
        req.flash('danger', `Invalid Page ID: ${id}`);
        logger.warn(`Invalid Page ID: ${id}`);
        return res.status(400).send({
            message: `Invalid Page ID: ${id}`
        });
    }

    // Attempt to find the page with the given ID
    Page.findOne({ _id: id })
        .then(data => {
            if (data) {
                return res.send({ data: data });
            } else {
                // Page not found
                logger.warn(`Page not found with ID: ${id}`);
                return res.status(404).send({
                    message: `Cannot find Page with id=${id}.`
                });
            }
        })
        .catch(err => {
            // Handle any error during the query process
            logger.error(`Error retrieving Page with id=${id}: ${err.message || 'Unknown error'}`);
            return res.status(500).send({
                message: `Error retrieving Page with id=${id}: ${err.message || 'Unknown error'}`
            });
        });
};

exports.edit = async (req, res) => {
    const user = req.cookies['user'];

    const success = req.flash('success');
    const danger = req.flash('danger');
    const info = req.flash('info');
    const id = req.params.id;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
        req.flash('danger', 'Invalid page ID.');
        return res.redirect('/page');
    }

    try {
        // Fetch all pages except the current one
        const pages = await Page.find({ _id: { $ne: id } });

        // Find the page by its ID
        const pageData = await Page.findOne({ _id: id });

        if (!pageData) {
            // If page not found, show flash message and redirect
            req.flash('danger', `Cannot find Page with id=${id}.`);
            logger.error(`Page not found with id=${id}`);
            return res.redirect('/page');
        }

        // If page is found, render the page edit form
        res.render('pages/page/edit', {
            list: pageData,
            user,
            success,
            danger,
            info,
            pages,
            page_title: 'Page Edit',
            page_url: 'page.edit'
        });
    } catch (err) {
        // Log the error for debugging purposes
        logger.error(`Error occurred while fetching page data for id=${id}: ${err.message}`, { error: err });

        // Provide a user-friendly error message
        req.flash('danger', `Error occurred while fetching the page with id=${id}.`);
        res.redirect('/page');
    }
};

// Update a Page by the id in the request
exports.update = (req, res) => {
    try {
        const id = req.params.id;

        // Validate the Page ID
        if (!id || !mongoose.Types.ObjectId.isValid(id)) {
            req.flash('danger', 'Invalid Page ID.');
            logger.warn(`Invalid Page ID provided: ${id}`); // Log the invalid ID warning
            return res.redirect('/page');
        }

        upload(req, res, function (err) {
            if (err) {
                // Log the file upload error
                req.flash('danger', `File upload error: ${err.message || 'Unknown error'}`);
                logger.error(`File upload error for Page ID: ${id} - ${err.message || 'Unknown error'}`); // Log the file upload error
                return res.redirect(`/page/edit/${id}`);
            }

            const page_detail = {
                title: req.body.title,
                slug: req.body.slug ? slugify(req.body.slug, { lower: true }) : slugify(req.body.title, { lower: true }),
                except: req.body.except,
                description: req.body.description,
                parent: req.body.parent || null,
                seo_title: req.body.seo_title,
                seo_keywords: req.body.seo_keywords,
                seo_description: req.body.seo_description,
            };

            // Process uploaded files if any
            if (req.files && req.files.length > 0) {
                req.files.forEach((file) => {
                    if (file.fieldname == 'image') {
                        page_detail.image = file.filename;
                    }
                    if (file.fieldname.startsWith('field[image][')) {
                        const match = file.fieldname.match(/\[(\d+)\]/);
                        const index = match ? parseInt(match[1], 10) : null;

                        if (index !== null) {
                            req.body.field.img[index] = file.filename;
                        }
                    }
                });
            }

            // Handle additional fields
            const fields = {};
            if (req.body.field) {
                fields.title = req.body.field.title;
                fields.image = req.body.field.img;
                fields.description = req.body.field.description;
            }
            page_detail.field = req.body.field ? JSON.stringify(fields) : '{"title":[],"image":[],"description":[]}';

            if (req.file) {
                page_detail.image = req.file.filename;
            }

            // Attempt to update the page in the database
            Page.updateOne({ _id: id }, { $set: page_detail }).then(result => {
                if (result.nModified === 0) {
                    req.flash('danger', `Cannot update Page with id=${id}. Maybe Page was not found or req.body is empty!`);
                    logger.warn(`No changes made to Page ID: ${id}. Either not found or no data to update.`);
                    return res.redirect(`/page/edit/${id}`);
                }
                req.flash('success', 'Page updated successfully!');
                res.redirect('/page');
            }).catch(err => {
                // Log the database update error
                logger.error(`Database update error for Page ID: ${id} - ${err.message || 'Unknown error'}`);
                req.flash('danger', `Error updating Page with id=${id}: ${err.message || 'Unknown error'}`);
                res.redirect(`/page/edit/${id}`);
            });
        });
    } catch (err) {
        // General error handling (e.g., invalid data, unknown errors)
        logger.error(`General error while updating Page ID: ${req.params.id} - ${err.message || 'Unknown error'}`);
        req.flash('danger', err.message || 'Some error occurred while updating the Page.');
        res.redirect(`/page/edit/${req.params.id}`);
    }
};

// Delete a Page with the specified id in the request
exports.delete = (req, res) => {
    try {
        const id = req.params.id;

        // Validate the Page ID
        if (!id || !mongoose.Types.ObjectId.isValid(id)) {
            req.flash('danger', 'Invalid Page ID.');
            logger.warn(`Attempt to delete with invalid ID: ${id}`);
            return res.redirect('/page');
        }

        // Proceed to delete the page
        Page.deleteOne({ _id: id })
            .then(result => {
                if (result.deletedCount === 1) {
                    // Successful deletion
                    req.flash('success', `Page deleted successfully!`);
                    res.redirect('/page');
                } else {
                    // No document was deleted (Page not found)
                    req.flash('danger', `Cannot delete Page with id=${id}. Maybe the Page was not found!`);
                    logger.warn(`Page with ID ${id} not found for deletion.`);
                    res.redirect('/page');
                }
            })
            .catch(err => {
                // Log and handle errors from the database
                logger.error(`Error occurred while deleting Page with ID ${id} - ${err.message || 'Unknown error'}`);
                req.flash('danger', `Could not delete Page with id=${id}. Please try again later.`);
                res.redirect('/page');
            });
    } catch (err) {
        // Catch unexpected errors and log them
        logger.error(`Unexpected error during delete operation for Page with ID ${req.params.id} - ${err.message || 'Unknown error'}`);
        req.flash('danger', 'An unexpected error occurred while attempting to delete the Page.');
        res.redirect('/page');
    }
};

// Delete all Page from the database.
exports.deleteAll = (req, res) => {
    try {
        // Validate the ID array
        if (!req.body.id || !Array.isArray(req.body.id) || req.body.id.length === 0) {
            req.flash('danger', 'No page IDs provided for deletion.');
            logger.warn('No page IDs provided for deletion.');
            return res.redirect('/page');
        }

        // Validate each ID in the array
        const invalidIds = req.body.id.filter(id => !mongoose.Types.ObjectId.isValid(id));
        if (invalidIds.length > 0) {
            req.flash('danger', `Invalid page IDs: ${invalidIds.join(', ')}`);
            logger.warn(`Invalid page IDs: ${invalidIds.join(', ')}`);
            return res.redirect('/page');
        }

        // Proceed with deletion
        Page.deleteMany({ _id: { $in: req.body.id } })
            .then(nums => {
                if (nums.deletedCount > 0) {
                    req.flash('success', `${nums.deletedCount} Page(s) were deleted successfully!`);
                    logger.info(`${nums.deletedCount} Page(s) deleted successfully.`);
                } else {
                    req.flash('danger', 'No Pages were deleted. Please check if the pages exist.');
                    logger.warn('No Pages were deleted, either due to non-existence or invalid IDs.');
                }
                res.redirect('/page');
            })
            .catch(err => {
                // Log the error and provide a user-friendly message
                logger.error(`Error deleting pages: ${err.message || 'Unknown error'}`);
                req.flash('danger', err.message || 'Some error occurred while deleting the Pages.');
                res.redirect('/page');
            });

    } catch (err) {
        // Catch any unexpected errors
        logger.error(`Unexpected error occurred while deleting pages: ${err.message || 'Unknown error'}`);
        req.flash('danger', err.message || 'An unexpected error occurred while deleting the Pages.');
        res.redirect('/page');
    }
};