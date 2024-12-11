const Faq = require('../../schemas/faq.js');
const Product = require('../../schemas/product.js');

const multer = require('multer');
const fs = require('fs');
const slugify = require('slugify');
const path = require('path');

const storage = multer.diskStorage({
    destination: function (req, res, callback) {
        var dir = "./src/public/upload/faq";

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

// Create a new Faq Page
exports.add = async (req, res) => {

    const user = req.cookies['user'];

    const products = await Product.find();
    const success = req.flash('success');
    const danger = req.flash('danger');
    const info = req.flash('info');

    res.render('pages/faq/add', { user, success, danger, info, products, page_title: 'Faq Add', page_url: 'faq.add' });
};

// Create and Save a new Faq
exports.create = (req, res) => {

    // Create a Faq
    upload(req, res, function (err) {
        const faq = {};
        if (err) {
            res.redirect('/faq/create');
        }
        if (!req.body.title) {
            req.flash('danger', 'Please enter title.');
            res.redirect('/faq/create');
        }
        if (!req.body.description) {
            req.flash('danger', 'Please enter description.');
            res.redirect('/faq/create');
        }

        faq.title = req.body.title;
        faq.description = req.body.description;

        // Save Faq in the database
        Faq.create(faq)
            .then(data => {
                req.flash('success', `Faq created successfully!`);
                res.redirect('/faq');
            })
            .catch(err => {
                req.flash('danger', err.message || 'Some error occurred while creating the faq.');
                res.redirect('/faq/create');
            });
    })

};

// Retrieve all Faq from the database.
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

    Faq.count(condition).then(count => {
        Faq.find(condition).skip(offset).limit(limit)
            .then(data => {
                res.render('pages/faq/list', {
                    lists: {
                        data: data, current: page, offset: offset,
                        pages: Math.ceil(count / limit)
                    },
                    query: query,
                    user, success, danger, info, page_title: 'Faq List', page_url: 'faq.list', url: req.pathname
                });
            })
            .catch(err => {
                req.flash('danger', err.message || 'Some error occurred while creating the Faq.');
                res.redirect('/faq');
            });
    });
};

// Find a single Faq with an id
exports.findOne = (req, res) => {
    const id = req.params.id;
    Faq.findOne({ _id: id })
        .then(data => {
            if (data) {
                return res.send({ data: data });
            } else {
                return res.status(404).send({
                    message: `Cannot find Faq with id=${id}.`
                });
            }
        })
        .catch(err => {
            return res.status(500).send({
                message: "Error retrieving Faq with id=" + id
            });
        });
};

exports.edit = async (req, res) => {
    const user = req.cookies['user'];

    const success = req.flash('success');
    const danger = req.flash('danger');
    const info = req.flash('info');

    const id = req.params.id;
    Faq.findOne({ _id: id })
        .then(data => {
            if (data) {
                res.render('pages/faq/edit', {
                    list: data, user, success, danger, info, page_title: 'Faq Edit', page_url: 'faq.edit'
                });
            } else {
                req.flash('danger', `Cannot find Faq with id=${id}.`);
                res.redirect('/faq');
            }
        })
        .catch(err => {
            req.flash('danger', 'Error updating Faq with id=' + id);
            res.redirect('/faq');
        });
};

// Update a Faq by the id in the request
exports.update = async (req, res) => {
    const id = req.params.id;

    const data = await Faq.findOne({ _id: id });
    upload(req, res, function (err) {
        if (err) {
            res.redirect('/faq/edit/' + id);
        }

        const faq_detail = {};

        faq_detail.title = req.body.title;
        faq_detail.description = req.body.description;

        Faq.updateOne({ _id: id }, { $set: faq_detail }).then(num => {
            if (num.ok == 1) {
                req.flash('success', `Faq updated successfully!`);
                res.redirect('/faq');
            } else {
                req.flash('danger', `Cannot update Faq with id=${id}. Maybe Faq was not found or req.body is empty!`);
                res.redirect('/faq/edit/' + id);
            }
        })
            .catch(err => {
                req.flash('danger', 'Error updating Faq with id=' + id);
                res.redirect('/faq/edit/' + id);
            });
    })
};

// Delete a Faq with the specified id in the request
exports.delete = (req, res) => {
    const id = req.params.id;
    Faq.deleteOne({ _id: id })
        .then(num => {
            if (num.ok == 1) {
                req.flash('success', `Faq deleted successfully!`);
                res.redirect('/faq');
            } else {
                req.flash('danger', `Cannot delete Faq with id=${id}. Maybe Faq was not found!`);
                res.redirect('/faq');
            }
        })
        .catch(err => {
            req.flash('danger', 'Could not delete Faq with id=' + id);
            res.redirect('/faq');
        });
};

// Delete all Faq from the database.
exports.deleteAll = (req, res) => {
    Faq.deleteMany({ _id: { $in: req.body.id } })
        .then(nums => {
            req.flash('success', `${nums.deletedCount} Faq were deleted successfully!`);
            res.redirect('/faq');
        })
        .catch(err => {
            req.flash('danger', err.message || 'Some error occurred while creating the Faq.');
            res.redirect('/faq');
        });
};