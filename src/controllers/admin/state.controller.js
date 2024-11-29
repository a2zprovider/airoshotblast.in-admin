const State = require('../../schemas/state.js');
const Country = require('../../schemas/country.js');

const multer = require('multer');
const fs = require('fs');
const slugify = require('slugify');
const path = require('path');

const storage = multer.diskStorage({
    destination: function (req, res, callback) {
        var dir = "./src/public/upload/state";

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


// Create a new State Page
exports.add = async (req, res) => {

    const user = req.cookies['user'];
    const countries = await Country.find();

    const success = req.flash('success');
    const danger = req.flash('danger');
    const info = req.flash('info');

    res.render('pages/state/add', { user, success, danger, info, countries, page_title: 'State Add', page_url: 'state.add' });
};

// Create and Save a new State
exports.create = (req, res) => {

    // Create a State
    upload(req, res, function (err) {


        const state = {};
        if (err) {
            res.redirect('/state/create');
        }

        if (req.file) {
            state.image = req.file.filename;
        }

        if (!req.body.title) {
            req.flash('danger', 'Please enter title.');
            res.redirect('/state/create');
        }

        state.title = req.body.title;
        state.code = req.body.code;
        state.country = req.body.country;

        // Save State in the database
        State.create(state)
            .then(data => {
                req.flash('success', `State created successfully!`);
                res.redirect('/state');
            })
            .catch(err => {
                req.flash('danger', err.message || 'Some error occurred while creating the State.');
                res.redirect('/state/create');
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
    const condition = search ? { $text: { $search: search } } : {};

    State.count(condition).then(count => {
        State.find(condition).skip(offset).limit(limit).populate('country')
            .then(data => {
                res.render('pages/state/list', {
                    lists: {
                        data: data, current: page, offset: offset,
                        pages: Math.ceil(count / limit)
                    },
                    query: query,
                    user, success, danger, info, page_title: 'State List', page_url: 'state.list', url: req.pathname
                });
            })
            .catch(err => {
                req.flash('danger', err.message || 'Some error occurred while creating the State.');
                res.redirect('/state');
            });

    });
};

// Find a single State with an id
exports.findOne = (req, res) => {
    const id = req.params.id;
    State.findOne({ _id: id })
        .then(data => {
            if (data) {
                return res.send({ data: data });
            } else {
                return res.status(404).send({
                    message: `Cannot find State with id=${id}.`
                });
            }
        })
        .catch(err => {
            return res.status(500).send({
                message: "Error retrieving State with id=" + id
            });
        });
};

exports.edit = async (req, res) => {
    const user = req.cookies['user'];

    const success = req.flash('success');
    const danger = req.flash('danger');
    const info = req.flash('info');

    const id = req.params.id;

    const countries = await Country.find({ _id: { $ne: id } });

    State.findOne({ _id: id })
        .then(data => {
            if (data) {
                res.render('pages/state/edit', {
                    list: data, user, success, danger, info, countries, page_title: 'State Edit', page_url: 'state.edit'
                });
            } else {
                req.flash('danger', `Cannot find State with id=${id}.`);
                res.redirect('/state');
            }
        })
        .catch(err => {
            req.flash('danger', 'Error updating State with id=' + id);
            res.redirect('/state');
        });
};


// Update a State by the id in the request
exports.update = (req, res) => {
    const id = req.params.id;

    upload(req, res, function (err) {
        if (err) {
            res.redirect('/state/edit/' + id);
        }

        const state_detail = {};

        state_detail.title = req.body.title;
        state_detail.code = req.body.code;
        state_detail.country = req.body.country;

        State.updateOne({ _id: id }, { $set: state_detail }).then(num => {
            if (num.ok == 1) {
                req.flash('success', `State updated successfully!`);
                res.redirect('/state');
            } else {
                req.flash('danger', `Cannot update State with id=${id}. Maybe State was not found or req.body is empty!`);
                res.redirect('/state/edit/' + id);
            }
        })
            .catch(err => {
                req.flash('danger', 'Error updating State with id=' + id);
                res.redirect('/state/edit/' + id);
            });

    })
};

// Delete a State with the specified id in the request
exports.delete = (req, res) => {
    const id = req.params.id;
    State.deleteOne({ _id: id })
        .then(num => {
            if (num.ok == 1) {
                req.flash('success', `State deleted successfully!`);
                res.redirect('/state');
            } else {
                req.flash('danger', `Cannot delete State with id=${id}. Maybe State was not found!`);
                res.redirect('/state');
            }
        })
        .catch(err => {
            req.flash('danger', 'Could not delete State with id=' + id);
            res.redirect('/state');
        });
};

// Delete all State from the database.
exports.deleteAll = (req, res) => {
    State.deleteMany({ _id: { $in: req.body.id } })
        .then(nums => {
            req.flash('success', `${nums.deletedCount} State were deleted successfully!`);
            res.redirect('/state');
        })
        .catch(err => {
            req.flash('danger', err.message || 'Some error occurred while deleting the State.');
            res.redirect('/state');
        });
};