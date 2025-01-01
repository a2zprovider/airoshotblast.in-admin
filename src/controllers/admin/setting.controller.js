const Setting = require('../../schemas/settings.js');

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
            if (res.fieldname === "logo") {
                dir = "./src/public/upload/setting/logo";
            } else if (res.fieldname === "logo2") {
                dir = "./src/public/upload/setting/logo2";
            } else if (res.fieldname === "favicon") {
                dir = "./src/public/upload/setting/favicon";
            } else if (res.fieldname === "brochure") {
                dir = "./src/public/upload/setting/brochure";
            } else {
                dir = "./src/public/upload/setting/other";
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
            } else if (res.fieldname === "logo2") {
                fileName = res.fieldname + '-' + Date.now() + Math.random().toString().substr(2, 6) + path.extname(res.originalname);
            } else if (res.fieldname === "favicon") {
                fileName = res.fieldname + '-' + Date.now() + Math.random().toString().substr(2, 6) + path.extname(res.originalname);
            } else if (res.fieldname === "brochure") {
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

exports.edit = (req, res) => {
    const user = req.cookies['user'];

    const success = req.flash('success');
    const danger = req.flash('danger');
    const info = req.flash('info');

    Setting.count().then(count => {
        if (count < 1) {
            const s = {};
            s.title = 'Admin Panel';
            const p = Setting.create(s);
            res.redirect('/setting');
        }
    });
    Setting.findOne()
        .then(data => {
            if (data) {
                res.render('pages/setting/edit', {
                    list: data,
                    user,
                    success,
                    danger,
                    info,
                    page_title: 'Setting',
                    page_url: 'setting'
                });
            } else {
                req.flash('danger', `Cannot find Setting with id=${id}.`);
                res.redirect('/setting');
            }
        })
        .catch(err => {
            req.flash('danger', 'Error updating Setting');
            res.redirect('/setting');
        });
};

exports.update = async (req, res) => {
    const id = req.params.id;
    upload(req, res, function (err) {
        if (err) {
            res.redirect('/setting');
        }

        const setting_detail = {};

        setting_detail.title = req.body.title;
        setting_detail.tagline = req.body.tagline;
        setting_detail.address = req.body.address;
        setting_detail.map = req.body.map;
        setting_detail.except = req.body.except;
        setting_detail.description = req.body.description;
        setting_detail.email = req.body.email;
        setting_detail.mobile = req.body.mobile;
        setting_detail.mobileStatus = req.body.mobileStatus;
        setting_detail.social_links = req.body.social_links ? JSON.stringify(req.body.social_links) : '{"facebook":"","instagram":"","pinterest":"","youtube":"","linkedin":"","whatsapp":""}';
        setting_detail.seo_details = req.body.seo_details ? JSON.stringify(req.body.seo_details) : '';
        setting_detail.other_details = req.body.other_details ? JSON.stringify(req.body.other_details) : '';

        // Process uploaded files if any
        if (req.files && req.files.length > 0) {
            req.files.forEach((file) => {
                if (file && file.fieldname == 'logo') {
                    setting_detail.logo = file.filename;
                }
                if (file && file.fieldname == 'logo2') {
                    setting_detail.logo2 = file.filename;
                }
                if (file && file.fieldname == 'favicon') {
                    setting_detail.favicon = file.filename;
                }
                if (file && file.fieldname == 'brochure') {
                    setting_detail.brochure = file.filename;
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
        setting_detail.field = req.body.field ? JSON.stringify(fields) : '{"title":[],"image":[],"description":[]}';

        Setting.updateOne({ _id: id }, { $set: setting_detail }).then(num => {
            if (num.ok == 1) {
                req.flash('success', `Setting updated successfully!`);
                res.redirect('/setting');
            } else {
                req.flash('danger', `Cannot update Setting with id=${id}. Maybe Setting was not found or req.body is empty!`);
                res.redirect('/setting');
            }
        })
            .catch(err => {
                req.flash('danger', 'Error updating Setting with id=' + id);
                res.redirect('/setting');
            });

    })
};
