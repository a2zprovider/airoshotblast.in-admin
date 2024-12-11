const Application = require('../../schemas/application.js');
const Country = require('../../schemas/country.js');

const multer = require('multer');
const fs = require('fs');
const slugify = require('slugify');
const path = require('path');

const storage = multer.diskStorage({
    destination: function (req, res, callback) {
        var dir = "./src/public/upload/application";

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

// Create a new Application 
exports.add = async (req, res) => {

    const user = req.cookies['user'];

    const countries = await Country.find();

    const success = req.flash('success');
    const danger = req.flash('danger');
    const info = req.flash('info');

    return res.render('pages/application/add', { user, success, danger, info, countries, page_title: 'Application Add', page_url: 'application.add' });
};

// Create and Save a new Application
exports.create = (req, res) => {

    // Create a Application
    upload(req, res, function (err) {
        const application = {};
        if (err) {
            return res.redirect('/application/create');
        }

        if (req.file) {
            application.image = req.file.filename;
        }

        if (!req.body.title) {
            req.flash('danger', 'Please enter title.');
            return res.redirect('/application/create');
        }
        if (!req.body.description) {
            req.flash('danger', 'Please enter description.');
            return res.redirect('/application/create');
        }

        application.title = req.body.title;
        application.slug = req.body.slug ? slugify(req.body.slug, { lower: true }) : slugify(req.body.title, { lower: true });
        application.except = req.body.except;
        application.description = req.body.description;

        application.country = req.body.country;

        application.seo_title = req.body.seo_title;
        application.seo_keywords = req.body.seo_keywords;
        application.seo_description = req.body.seo_description;

        // Save application in the database
        Application.create(application)
            .then(data => {
                req.flash('success', `Application created successfully!`);
                return res.redirect('/application');
            })
            .catch(err => {
                req.flash('danger', err.message || 'Some error occurred while creating the Application.');
                return res.redirect('/application/create');
            });
    })

};

// Retrieve all Application from the database.
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

    Application.count(condition).then(count => {
        Application.find(condition).skip(offset).limit(limit)
            .then(data => {
                const lists = {
                    data: data, current: page, offset: offset,
                    pages: Math.ceil(count / limit)
                };
                return res.render('pages/application/list', {
                    lists: {
                        data: data, current: page, offset: offset,
                        pages: Math.ceil(count / limit)
                    },
                    query: query,
                    user, success, danger, info, page_title: 'Application List', page_url: 'application.list', url: req.pathname
                });
            })
            .catch(err => {
                req.flash('danger', err.message || 'Some error occurred while creating the Application.');
                return res.redirect('/application');
            });
    });
};

// Find a single Application with an id
exports.findOne = (req, res) => {
    const id = req.params.id;
    Application.findOne({ _id: id })
        .then(data => {
            if (data) {
                return res.send({ data: data });
            } else {
                return res.status(404).send({
                    message: `Cannot find Application with id=${id}.`
                });
            }
        })
        .catch(err => {
            return res.status(500).send({
                message: "Error retrieving Application with id=" + id
            });
        });
};

exports.edit = async (req, res) => {
    const user = req.cookies['user'];
    const countries = await Country.find();

    const success = req.flash('success');
    const danger = req.flash('danger');
    const info = req.flash('info');

    const id = req.params.id;
    Application.findOne({ _id: id })
        .then(data => {
            if (data) {
                return res.render('pages/application/edit', {
                    list: data, user, success, danger, info, countries, page_title: 'Application Edit', page_url: 'application.edit'
                });
            } else {
                req.flash('danger', `Cannot find Application with id=${id}.`);
                return res.redirect('/application');
            }
        })
        .catch(err => {
            req.flash('danger', 'Error updating Application with id=' + id);
            return res.redirect('/application');
        });
};


// Update a Application by the id in the request
exports.update = (req, res) => {
    const id = req.params.id;

    upload(req, res, function (err) {
        if (err) {
            return res.redirect('/application/edit/' + id);
        }

        const application_detail = {};

        application_detail.title = req.body.title;
        application_detail.slug = req.body.slug ? slugify(req.body.slug, { lower: true }) : slugify(req.body.title, { lower: true });
        application_detail.except = req.body.except;
        application_detail.description = req.body.description;

        application_detail.country = req.body.country;

        application_detail.seo_title = req.body.seo_title;
        application_detail.seo_keywords = req.body.seo_keywords;
        application_detail.seo_description = req.body.seo_description;

        if (req.file) {
            application_detail.image = req.file.filename;
        }

        Application.updateOne({ _id: id }, { $set: application_detail }).then(num => {
            if (num.ok == 1) {
                req.flash('success', `Application updated successfully!`);
                return res.redirect('/application');
            } else {
                req.flash('danger', `Cannot update Application with id=${id}. Maybe Application was not found or req.body is empty!`);
                return res.redirect('/application/edit/' + id);
            }
        })
            .catch(err => {
                req.flash('danger', 'Error updating Application with id=' + id);
                return res.redirect('/application/edit/' + id);
            });

    })
};

// Delete a Application with the specified id in the request
exports.delete = (req, res) => {
    const id = req.params.id;
    Application.deleteOne({ _id: id })
        .then(num => {
            if (num.ok == 1) {
                req.flash('success', `Application deleted successfully!`);
                return res.redirect('/application');
            } else {
                req.flash('danger', `Cannot delete Application with id=${id}. Maybe Application was not found!`);
                return res.redirect('/application');
            }
        })
        .catch(err => {
            req.flash('danger', 'Could not delete Application with id=' + id);
            return res.redirect('/application');
        });
};

// Delete all Application from the database.
exports.deleteAll = (req, res) => {
    Application.deleteMany({ _id: { $in: req.body.id } })
        .then(nums => {
            req.flash('success', `${nums.deletedCount} Application were deleted successfully!`);
            return res.redirect('/application');
        })
        .catch(err => {
            req.flash('danger', err.message || 'Some error occurred while creating the Application.');
            return res.redirect('/application');
        });
};