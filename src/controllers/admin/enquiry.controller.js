const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const moment = require('moment');

const User = require('../../schemas/user.js');
const Enquiry = require('../../schemas/enquiry.js');
const multer = require('multer');
const fs = require('fs');
const slugify = require('slugify');
const path = require('path');

const storage = multer.diskStorage({
    destination: function (req, res, callback) {
        var dir = "./src/public/upload/enquiry";

        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir);
        }
        callback(null, dir);
    },
    filename: function (req, res, callback) {
        callback(null, res.fieldname + '-' + Date.now() + path.extname(res.originalname));
        // callback(null, res.originalname);
    }
})

const upload = multer({ storage: storage }).single('image');


// Create a new Enquiry Page
exports.add = (req, res) => {

    const user = req.cookies['user'];

    const success = req.flash('success');
    const danger = req.flash('danger');
    const info = req.flash('info');

    res.render('pages/enquiry/add', { user, success, danger, info, page_title: 'Enquiry Add', page_url: 'enquiry.add' });
};

// Create and Save a new Enquiry
exports.create = (req, res) => {

    // Create a Enquiry
    upload(req, res, function (err) {
        const enquiry = {};
        if (err) {
            res.redirect('/enquiry/create');
        }

        if (req.file) {
            enquiry.image = req.file.filename;
        }

        if (!req.body.name) {
            req.flash('danger', 'Please enter name.');
            res.redirect('/enquiry/create');
        }
        if (!req.body.description) {
            req.flash('danger', 'Please enter description.');
            res.redirect('/enquiry/create');
        }

        enquiry.name = req.body.name;
        enquiry.slug = req.body.slug ? slugify(req.body.slug, { lower: true }) : slugify(req.body.name);
        enquiry.except = req.body.except;
        enquiry.description = req.body.description;

        enquiry.seo_title = req.body.seo_title;
        enquiry.seo_keywords = req.body.seo_keywords;
        enquiry.seo_description = req.body.seo_description;

        // Save enquiry in the database
        Enquiry.create(enquiry)
            .then(data => {
                req.flash('success', `Enquiry created successfully!`);
                res.redirect('/enquiry');
            })
            .catch(err => {
                req.flash('danger', err.message || 'Some error occurred while creating the Enquiry.');
                res.redirect('/enquiry/create');
            });
    })

};

// Retrieve all Enquiry from the database.
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
    const condition = search ? { $text: { $search: search } } : {};

    Enquiry.count(condition).then(count => {
        Enquiry.find(condition).skip(offset).limit(limit)
            .then(data => {
                res.render('pages/enquiry/list', {
                    lists: {
                        data: data, current: page, offset: offset,
                        pages: Math.ceil(count / limit)
                    },
                    query: query,
                    user, success, danger, info, page_title: 'Enquiry List', page_url: 'enquiry.list', url: req.pathname
                });
            })
            .catch(err => {
                req.flash('danger', err.message || 'Some error occurred while creating the Enquiry.');
                res.redirect('/enquiry');
            });
    });
};

// Find a single Enquiry with an id
exports.findOne = (req, res) => {
    const id = req.params.id;
    Enquiry.findOne({ _id: id })
        .then(data => {
            if (data) {
                return res.send({ data: data });
            } else {
                return res.status(404).send({
                    message: `Cannot find Enquiry with id=${id}.`
                });
            }
        })
        .catch(err => {
            return res.status(500).send({
                message: "Error retrieving Enquiry with id=" + id
            });
        });
};

exports.edit = (req, res) => {
    const user = req.cookies['user'];

    const success = req.flash('success');
    const danger = req.flash('danger');
    const info = req.flash('info');

    const id = req.params.id;
    Enquiry.findByPk(id)
        .then(data => {
            if (data) {
                res.render('pages/enquiry/edit', {
                    list: data, user, success, danger, info, page_title: 'Enquiry Edit', page_url: 'enquiry.edit'
                });
            } else {
                req.flash('danger', `Cannot find Enquiry with id=${id}.`);
                res.redirect('/enquiry');
            }
        })
        .catch(err => {
            req.flash('danger', 'Error updating Enquiry with id=' + id);
            res.redirect('/enquiry');
        });
};

// Update a Enquiry by the id in the request
exports.update = (req, res) => {
    const id = req.params.id;

    upload(req, res, function (err) {
        if (err) {
            res.redirect('/enquiry/edit/' + id);
        }

        const enquiry_detail = {};

        enquiry_detail.name = req.body.name;
        enquiry_detail.slug = req.body.slug ? slugify(req.body.slug, { lower: true }) : slugify(req.body.name);
        enquiry_detail.except = req.body.except;
        enquiry_detail.description = req.body.description;

        enquiry_detail.field = req.body.field && req.body.field != 'undefined' ? req.body.field : null;

        enquiry_detail.seo_title = req.body.seo_title;
        enquiry_detail.seo_keywords = req.body.seo_keywords;
        enquiry_detail.seo_description = req.body.seo_description;


        if (req.file) {
            enquiry_detail.image = req.file.filename;
        }

        Enquiry.update(enquiry_detail, {
            where: { id: id }
        })
            .then(num => {
                if (num == 1) {
                    req.flash('success', `Enquiry updated successfully!`);
                    res.redirect('/enquiry');
                } else {
                    req.flash('danger', `Cannot update Enquiry with id=${id}. Maybe Enquiry was not found or req.body is empty!`);
                    res.redirect('/enquiry/edit/' + id);
                }
            })
            .catch(err => {
                req.flash('danger', 'Error updating Enquiry with id=' + id);
                res.redirect('/enquiry/edit/' + id);
            });

    })
};

// Delete a Enquiry with the specified id in the request
exports.delete = (req, res) => {
    const id = req.params.id;
    Enquiry.deleteOne({ _id: id })
        .then(num => {
            if (num.ok == 1) {
                req.flash('success', `Enquiry deleted successfully!`);
                res.redirect('/enquiry');
            } else {
                req.flash('danger', `Cannot delete Enquiry with id=${id}. Maybe Enquiry was not found!`);
                res.redirect('/enquiry');
            }
        })
        .catch(err => {
            req.flash('danger', 'Could not delete Enquiry with id=' + id);
            res.redirect('/enquiry');
        });
};

// Delete all Enquiry from the database.
exports.deleteAll = (req, res) => {
    Enquiry.deleteMany({ _id: { $in: req.body.id } })
        .then(nums => {
            req.flash('success', `${nums.deletedCount} Enquiry were deleted successfully!`);
            res.redirect('/enquiry');
        })
        .catch(err => {
            req.flash('danger', err.message || 'Some error occurred while creating the Enquiry.');
            res.redirect('/enquiry');
        });
};