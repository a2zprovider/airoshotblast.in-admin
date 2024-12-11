const Slider = require('../../schemas/slider.js');

const multer = require('multer');
const fs = require('fs');
const slugify = require('slugify');
const path = require('path');

const storage = multer.diskStorage({
    destination: function (req, res, callback) {
        var dir = "./src/public/upload/slider";

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


// Create a new Slider Page
exports.add = (req, res) => {

    const user = req.cookies['user'];

    const success = req.flash('success');
    const danger = req.flash('danger');
    const info = req.flash('info');

    res.render('pages/slider/add', { user, success, danger, info, page_title: 'Slider Add', page_url: 'slider.add' });
};

// Create and Save a new Slider
exports.create = (req, res) => {

    // Create a Slider
    upload(req, res, function (err) {
        const slider = {};
        if (err) {
            res.redirect('/slider/create');
        }

        if (req.file) {
            slider.image = req.file.filename;
        }

        if (!req.body.title) {
            req.flash('danger', 'Please enter title.');
            res.redirect('/slider/create');
        }
        if (!req.body.description) {
            req.flash('danger', 'Please enter description.');
            res.redirect('/slider/create');
        }

        slider.title = req.body.title;
        slider.slug = req.body.slug ? slugify(req.body.slug, { lower: true }) : slugify(req.body.title, { lower: true });
        slider.except = req.body.except ? req.body.except : '';
        slider.description = req.body.description;
        // Save slider in the database
        Slider.create(slider)
            .then(data => {
                req.flash('success', `Slider created successfully!`);
                res.redirect('/slider');
            })
            .catch(err => {
                req.flash('danger', err.message || 'Some error occurred while creating the Slider.');
                res.redirect('/slider/create');
            });
    })

};


// Retrieve all Slider from the database.
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

    Slider.count(condition).then(count => {
        Slider.find(condition).skip(offset).limit(limit)
            .then(data => {
                res.render('pages/slider/list', {
                    lists: {
                        data: data, current: page, offset: offset,
                        pages: Math.ceil(count / limit)
                    },
                    query: query,
                    user, success, danger, info, page_title: 'Slider List', page_url: 'slider.list', url: req.pathname
                });
            })
            .catch(err => {
                req.flash('danger', err.message || 'Some error occurred while creating the Slider.');
                res.redirect('/slider');
            });
    });
};

// Find a single Slider with an id
exports.findOne = (req, res) => {
    const id = req.params.id;
    Slider.findOne({ _id: id })
        .then(data => {
            if (data) {
                return res.send({ data: data });
            } else {
                return res.status(404).send({
                    message: `Cannot find Slider with id=${id}.`
                });
            }
        })
        .catch(err => {
            return res.status(500).send({
                message: "Error retrieving Slider with id=" + id
            });
        });
};

exports.edit = (req, res) => {
    const user = req.cookies['user'];

    const success = req.flash('success');
    const danger = req.flash('danger');
    const info = req.flash('info');

    const id = req.params.id;
    Slider.findOne({ _id: id })
        .then(data => {
            if (data) {
                res.render('pages/slider/edit', {
                    list: data, user, success, danger, info, page_title: 'Slider Edit', page_url: 'slider.edit'
                });
            } else {
                req.flash('danger', `Cannot find Slider with id=${id}.`);
                res.redirect('/slider');
            }
        })
        .catch(err => {
            req.flash('danger', 'Error updating Slider with id=' + id);
            res.redirect('/slider');
        });
};


// Update a Slider by the id in the request
exports.update = (req, res) => {
    const id = req.params.id;

    upload(req, res, function (err) {
        if (err) {
            res.redirect('/slider/edit/' + id);
        }

        const slider_detail = {};

        slider_detail.title = req.body.title;
        slider_detail.except = req.body.except;
        slider_detail.description = req.body.description;

        if (req.file) {
            slider_detail.image = req.file.filename;
        }

        Slider.updateOne({ _id: id }, { $set: slider_detail }).then(num => {
            if (num.ok == 1) {
                req.flash('success', `Slider updated successfully!`);
                res.redirect('/slider');
            } else {
                req.flash('danger', `Cannot update Slider with id=${id}. Maybe Slider was not found or req.body is empty!`);
                res.redirect('/slider/edit/' + id);
            }
        })
            .catch(err => {
                req.flash('danger', 'Error updating Slider with id=' + id);
                res.redirect('/slider/edit/' + id);
            });

    })
};

// Delete a Slider with the specified id in the request
exports.delete = (req, res) => {
    const id = req.params.id;
    Slider.deleteOne({ _id: id })
        .then(num => {
            if (num.ok == 1) {
                req.flash('success', `Slider deleted successfully!`);
                res.redirect('/slider');
            } else {
                req.flash('danger', `Cannot delete Slider with id=${id}. Maybe Slider was not found!`);
                res.redirect('/slider');
            }
        })
        .catch(err => {
            req.flash('danger', 'Could not delete Slider with id=' + id);
            res.redirect('/slider');
        });
};

// Delete all Slider from the database.
exports.deleteAll = (req, res) => {
    Slider.deleteMany({ _id: { $in: req.body.id } })
        .then(nums => {
            req.flash('success', `${nums.deletedCount} Slider were deleted successfully!`);
            res.redirect('/slider');
        })
        .catch(err => {
            req.flash('danger', err.message || 'Some error occurred while creating the Slider.');
            res.redirect('/slider');
        });
};