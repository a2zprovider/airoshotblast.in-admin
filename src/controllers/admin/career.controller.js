const Career = require('../../schemas/career.js');
const Country = require('../../schemas/country.js');

const multer = require('multer');
const fs = require('fs');
const slugify = require('slugify');
const path = require('path');

const storage = multer.diskStorage({
    destination: function (req, res, callback) {
        var dir = "./src/public/upload/career";

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

// Create a new Career 
exports.add = async (req, res) => {

    const user = req.cookies['user'];

    const success = req.flash('success');
    const danger = req.flash('danger');
    const info = req.flash('info');

    return res.render('pages/career/add', { user, success, danger, info, page_title: 'Career Add', page_url: 'career.add' });
};

// Create and Save a new Career
exports.create = (req, res) => {

    // Create a Career
    upload(req, res, function (err) {
        const career = {};
        if (err) {
            return res.redirect('/career/create');
        }

        if (req.file) {
            career.image = req.file.filename;
        }

        if (!req.body.title) {
            req.flash('danger', 'Please enter title.');
            return res.redirect('/career/create');
        }
        if (!req.body.description) {
            req.flash('danger', 'Please enter description.');
            return res.redirect('/career/create');
        }

        career.title = req.body.title;
        career.slug = req.body.slug ? slugify(req.body.slug, { lower: true }) : slugify(req.body.title, { lower: true });
        career.except = req.body.except;
        career.description = req.body.description;
        career.vacancy = req.body.vacancy;
        career.address = req.body.address;

        career.seo_title = req.body.seo_title;
        career.seo_keywords = req.body.seo_keywords;
        career.seo_description = req.body.seo_description;

        // Save career in the database
        Career.create(career)
            .then(data => {
                req.flash('success', `Career created successfully!`);
                return res.redirect('/career');
            })
            .catch(err => {
                req.flash('danger', err.message || 'Some error occurred while creating the Career.');
                return res.redirect('/career/create');
            });
    })

};

// Retrieve all Career from the database.
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

    Career.count(condition).then(count => {
        Career.find(condition).skip(offset).limit(limit)
            .then(data => {
                const lists = {
                    data: data, current: page, offset: offset,
                    pages: Math.ceil(count / limit)
                };
                return res.render('pages/career/list', {
                    lists: {
                        data: data, current: page, offset: offset,
                        pages: Math.ceil(count / limit)
                    },
                    query: query,
                    user, success, danger, info, page_title: 'Career List', page_url: 'career.list', url: req.pathname
                });
            })
            .catch(err => {
                req.flash('danger', err.message || 'Some error occurred while creating the Career.');
                return res.redirect('/career');
            });
    });
};

// Find a single Career with an id
exports.findOne = (req, res) => {
    const id = req.params.id;
    Career.findOne({ _id: id })
        .then(data => {
            if (data) {
                return res.send({ data: data });
            } else {
                return res.status(404).send({
                    message: `Cannot find Career with id=${id}.`
                });
            }
        })
        .catch(err => {
            return res.status(500).send({
                message: "Error retrieving Career with id=" + id
            });
        });
};

exports.edit = async (req, res) => {
    const user = req.cookies['user'];

    const success = req.flash('success');
    const danger = req.flash('danger');
    const info = req.flash('info');

    const id = req.params.id;
    Career.findOne({ _id: id })
        .then(data => {
            if (data) {
                return res.render('pages/career/edit', {
                    list: data, user, success, danger, info, page_title: 'Career Edit', page_url: 'career.edit'
                });
            } else {
                req.flash('danger', `Cannot find Career with id=${id}.`);
                return res.redirect('/career');
            }
        })
        .catch(err => {
            req.flash('danger', 'Error updating Career with id=' + id);
            return res.redirect('/career');
        });
};


// Update a Career by the id in the request
exports.update = (req, res) => {
    const id = req.params.id;

    upload(req, res, function (err) {
        if (err) {
            return res.redirect('/career/edit/' + id);
        }

        const career_detail = {};

        career_detail.title = req.body.title;
        career_detail.slug = req.body.slug ? slugify(req.body.slug, { lower: true }) : slugify(req.body.title, { lower: true });
        career_detail.except = req.body.except;
        career_detail.description = req.body.description;
        career_detail.vacancy = req.body.vacancy;
        career_detail.address = req.body.address;

        career_detail.seo_title = req.body.seo_title;
        career_detail.seo_keywords = req.body.seo_keywords;
        career_detail.seo_description = req.body.seo_description;

        if (req.file) {
            career_detail.image = req.file.filename;
        }

        Career.updateOne({ _id: id }, { $set: career_detail }).then(num => {
            if (num.ok == 1) {
                req.flash('success', `Career updated successfully!`);
                return res.redirect('/career');
            } else {
                req.flash('danger', `Cannot update Career with id=${id}. Maybe Career was not found or req.body is empty!`);
                return res.redirect('/career/edit/' + id);
            }
        })
            .catch(err => {
                req.flash('danger', 'Error updating Career with id=' + id);
                return res.redirect('/career/edit/' + id);
            });

    })
};

// Delete a Career with the specified id in the request
exports.delete = (req, res) => {
    const id = req.params.id;
    Career.deleteOne({ _id: id })
        .then(num => {
            if (num.ok == 1) {
                req.flash('success', `Career deleted successfully!`);
                return res.redirect('/career');
            } else {
                req.flash('danger', `Cannot delete Career with id=${id}. Maybe Career was not found!`);
                return res.redirect('/career');
            }
        })
        .catch(err => {
            req.flash('danger', 'Could not delete Career with id=' + id);
            return res.redirect('/career');
        });
};

// Delete all Career from the database.
exports.deleteAll = (req, res) => {
    Career.deleteMany({ _id: { $in: req.body.id } })
        .then(nums => {
            req.flash('success', `${nums.deletedCount} Career were deleted successfully!`);
            return res.redirect('/career');
        })
        .catch(err => {
            req.flash('danger', err.message || 'Some error occurred while creating the Career.');
            return res.redirect('/career');
        });
};