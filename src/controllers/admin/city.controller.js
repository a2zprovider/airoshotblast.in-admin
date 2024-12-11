const City = require('../../schemas/city.js');
const State = require('../../schemas/state.js');

const multer = require('multer');
const fs = require('fs');
const slugify = require('slugify');
const path = require('path');

const storage = multer.diskStorage({
    destination: function (req, res, callback) {
        var dir = "./src/public/upload/city";

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


// Create a new City Page
exports.add = async (req, res) => {

    const user = req.cookies['user'];
    const states = await State.find();

    const success = req.flash('success');
    const danger = req.flash('danger');
    const info = req.flash('info');

    res.render('pages/city/add', { user, success, danger, info, states, page_title: 'City Add', page_url: 'city.add' });
};

// Create and Save a new City
exports.create = (req, res) => {

    // Create a City
    upload(req, res, function (err) {
        const city = {};
        if (err) {
            res.redirect('/city/create');
        }

        if (req.file) {
            city.image = req.file.filename;
        }

        if (!req.body.title) {
            req.flash('danger', 'Please enter title.');
            res.redirect('/city/create');
        }

        city.title = req.body.title;
        city.code = req.body.code;
        city.state = req.body.state;

        // Save City in the database
        City.create(city)
            .then(data => {
                req.flash('success', `City created successfully!`);
                res.redirect('/city');
            })
            .catch(err => {
                req.flash('danger', err.message || 'Some error occurred while creating the City.');
                res.redirect('/city/create');
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

    City.count(condition).then(count => {
        City.find(condition).skip(offset).limit(limit).populate('state')
            .then(data => {
                res.render('pages/city/list', {
                    lists: {
                        data: data, current: page, offset: offset,
                        pages: Math.ceil(count / limit)
                    },
                    query: query,
                    user, success, danger, info, page_title: 'City List', page_url: 'city.list', url: req.pathname
                });
            })
            .catch(err => {
                req.flash('danger', err.message || 'Some error occurred while creating the City.');
                res.redirect('/city');
            });

    });
};

// Find a single City with an id
exports.findOne = (req, res) => {
    const id = req.params.id;
    City.findOne({ _id: id })
        .then(data => {
            if (data) {
                return res.send({ data: data });
            } else {
                return res.status(404).send({
                    message: `Cannot find City with id=${id}.`
                });
            }
        })
        .catch(err => {
            return res.status(500).send({
                message: "Error retrieving City with id=" + id
            });
        });
};

exports.edit = async (req, res) => {
    const user = req.cookies['user'];

    const success = req.flash('success');
    const danger = req.flash('danger');
    const info = req.flash('info');

    const id = req.params.id;

    const states = await State.find({ _id: { $ne: id } });

    City.findOne({ _id: id })
        .then(data => {
            if (data) {
                res.render('pages/city/edit', {
                    list: data, user, success, danger, info, states, page_title: 'City Edit', page_url: 'city.edit'
                });
            } else {
                req.flash('danger', `Cannot find City with id=${id}.`);
                res.redirect('/city');
            }
        })
        .catch(err => {
            req.flash('danger', 'Error updating City with id=' + id);
            res.redirect('/city');
        });
};


// Update a City by the id in the request
exports.update = (req, res) => {
    const id = req.params.id;

    upload(req, res, function (err) {
        if (err) {
            res.redirect('/city/edit/' + id);
        }

        const city_detail = {};

        city_detail.title = req.body.title;
        city_detail.slug = req.body.slug ? slugify(req.body.slug, { lower: true }) : slugify(req.body.title, { lower: true });
        city_detail.except = req.body.except;
        city_detail.description = req.body.description;
        city_detail.parent = req.body.parent;

        city_detail.seo_title = req.body.seo_title;
        city_detail.seo_keywords = req.body.seo_keywords;
        city_detail.seo_description = req.body.seo_description;

        if (req.file) {
            city_detail.image = req.file.filename;
        }

        City.updateOne({ _id: id }, { $set: city_detail }).then(num => {
            if (num.ok == 1) {
                req.flash('success', `City updated successfully!`);
                res.redirect('/city');
            } else {
                req.flash('danger', `Cannot update City with id=${id}. Maybe City was not found or req.body is empty!`);
                res.redirect('/city/edit/' + id);
            }
        })
            .catch(err => {
                req.flash('danger', 'Error updating City with id=' + id);
                res.redirect('/city/edit/' + id);
            });

    })
};

// Delete a City with the specified id in the request
exports.delete = (req, res) => {
    const id = req.params.id;
    City.deleteOne({ _id: id })
        .then(num => {
            if (num.ok == 1) {
                req.flash('success', `City deleted successfully!`);
                res.redirect('/city');
            } else {
                req.flash('danger', `Cannot delete City with id=${id}. Maybe City was not found!`);
                res.redirect('/city');
            }
        })
        .catch(err => {
            req.flash('danger', 'Could not delete City with id=' + id);
            res.redirect('/city');
        });
};

// Delete all City from the database.
exports.deleteAll = (req, res) => {
    City.deleteMany({ _id: { $in: req.body.id } })
        .then(nums => {
            req.flash('success', `${nums.deletedCount} City were deleted successfully!`);
            res.redirect('/city');
        })
        .catch(err => {
            req.flash('danger', err.message || 'Some error occurred while deleting the City.');
            res.redirect('/city');
        });
};