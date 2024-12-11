const Country = require('../../schemas/country.js');

const multer = require('multer');
const fs = require('fs');
const path = require('path');

const storage = multer.diskStorage({
    destination: function (req, res, callback) {
        var dir = "./src/public/upload/country";

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

// Create a new Country Page
exports.add = async (req, res) => {

    const user = req.cookies['user'];
    const categories = await Country.find();

    const success = req.flash('success');
    const danger = req.flash('danger');
    const info = req.flash('info');

    res.render('pages/country/add', { user, success, danger, info, categories, page_title: 'Country Add', page_url: 'country.add' });
};
// Create a new Country Page
exports.add = async (req, res) => {

    const user = req.cookies['user'];

    const success = req.flash('success');
    const danger = req.flash('danger');
    const info = req.flash('info');

    res.render('pages/country/add', { user, success, danger, info, page_title: 'Country Add', page_url: 'country.add' });
};

// Create and Save a new Country
exports.create = (req, res) => {

    // Create a Country
    upload(req, res, function (err) {
        const country = {};

        if (err) {
            res.redirect('/country/create');
        }

        if (!req.body.title) {
            req.flash('danger', 'Please enter title.');
            res.redirect('/country/create');
        }

        country.title = req.body.title;
        country.code = req.body.code;

        // Save Country in the database
        Country.create(country)
            .then(data => {
                req.flash('success', `Country created successfully!`);
                res.redirect('/country');
            })
            .catch(err => {
                req.flash('danger', err.message || 'Some error occurred while creating the Country.');
                res.redirect('/country/create');
            });
    })

};

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

    Country.count(condition).then(count => {
        Country.find(condition).skip(offset).limit(limit)
            .then(data => {
                res.render('pages/country/list', {
                    lists: {
                        data: data, current: page, offset: offset,
                        pages: Math.ceil(count / limit)
                    },
                    query: query,
                    user, success, danger, info, page_title: 'Country List', page_url: 'country.list', url: req.pathname
                });
            })
            .catch(err => {
                req.flash('danger', err.message || 'Some error occurred while creating the Country.');
                res.redirect('/country');
            });

    });
};

// Find a single Country with an id
exports.findOne = (req, res) => {
    const id = req.params.id;
    Country.findOne({ _id: id })
        .then(data => {
            if (data) {
                return res.send({ data: data });
            } else {
                return res.status(404).send({
                    message: `Cannot find Country with id=${id}.`
                });
            }
        })
        .catch(err => {
            return res.status(500).send({
                message: "Error retrieving Country with id=" + id
            });
        });
};

exports.edit = async (req, res) => {
    const user = req.cookies['user'];

    const success = req.flash('success');
    const danger = req.flash('danger');
    const info = req.flash('info');

    const id = req.params.id;

    Country.findOne({ _id: id })
        .then(data => {
            if (data) {
                res.render('pages/country/edit', {
                    list: data, user, success, danger, info, page_title: 'Country Edit', page_url: 'country.edit'
                });
            } else {
                req.flash('danger', `Cannot find Country with id=${id}.`);
                res.redirect('/country');
            }
        })
        .catch(err => {
            req.flash('danger', 'Error updating Country with id=' + id);
            res.redirect('/country');
        });
};


// Update a Country by the id in the request
exports.update = (req, res) => {
    const id = req.params.id;

    upload(req, res, function (err) {
        if (err) {
            res.redirect('/country/edit/' + id);
        }

        const country_detail = {};

        country_detail.title = req.body.title;
        country_detail.code = req.body.code;

        if (req.file) {
            country_detail.image = req.file.filename;
        }

        Country.updateOne({ _id: id }, { $set: country_detail }).then(num => {
            if (num.ok == 1) {
                req.flash('success', `Country updated successfully!`);
                res.redirect('/country');
            } else {
                req.flash('danger', `Cannot update Country with id=${id}. Maybe Country was not found or req.body is empty!`);
                res.redirect('/country/edit/' + id);
            }
        })
            .catch(err => {
                req.flash('danger', 'Error updating Country with id=' + id);
                res.redirect('/country/edit/' + id);
            });
    });
};

// Delete a Country with the specified id in the request
exports.delete = (req, res) => {
    const id = req.params.id;
    Country.deleteOne({ _id: id })
        .then(num => {
            if (num.ok == 1) {
                req.flash('success', `Country deleted successfully!`);
                res.redirect('/country');
            } else {
                req.flash('danger', `Cannot delete Country with id=${id}. Maybe Country was not found!`);
                res.redirect('/country');
            }
        })
        .catch(err => {
            req.flash('danger', 'Could not delete Country with id=' + id);
            res.redirect('/country');
        });
};

// Delete all Country from the database.
exports.deleteAll = (req, res) => {
    Country.deleteMany({ _id: { $in: req.body.id } })
        .then(nums => {
            req.flash('success', `${nums.deletedCount} Country were deleted successfully!`);
            res.redirect('/country');
        })
        .catch(err => {
            req.flash('danger', err.message || 'Some error occurred while deleting the Country.');
            res.redirect('/country');
        });
};