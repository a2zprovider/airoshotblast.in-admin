const Tag = require('../../schemas/tags.js');

const multer = require('multer');
const fs = require('fs');
const slugify = require('slugify');
const path = require('path');

const storage = multer.diskStorage({
    destination: function (req, res, callback) {
        var dir = "./src/public/upload/tag";

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


// Create a new Tag Page
exports.add = (req, res) => {

    const user = req.cookies['user'];

    const success = req.flash('success');
    const danger = req.flash('danger');
    const info = req.flash('info');

    res.render('pages/tag/add', { user, success, danger, info, page_title: 'Tag Add', page_url: 'tag.add' });
};

// Create and Save a new Tag
exports.create = (req, res) => {

    // Create a Tag
    upload(req, res, function (err) {
        const tag = {};
        if (err) {
            res.redirect('/tag/create');
        }

        if (req.file) {
            tag.image = req.file.filename;
        }

        if (!req.body.title) {
            req.flash('danger', 'Please enter title.');
            res.redirect('/tag/create');
        }
        if (!req.body.description) {
            req.flash('danger', 'Please enter description.');
            res.redirect('/tag/create');
        }

        tag.title = req.body.title;
        tag.slug = req.body.slug ? slugify(req.body.slug, { lower: true }) : slugify(req.body.title, { lower: true });
        tag.except = req.body.except;
        tag.description = req.body.description;

        tag.seo_title = req.body.seo_title;
        tag.seo_keywords = req.body.seo_keywords;
        tag.seo_description = req.body.seo_description;

        // Save Tag in the database
        Tag.create(tag)
            .then(data => {
                req.flash('success', `Tag created successfully!`);
                res.redirect('/tag');
            })
            .catch(err => {
                req.flash('danger', err.message || 'Some error occurred while creating the Tag.');
                res.redirect('/tag/create');
            });
    })

};

// Retrieve all Tag from the database.
exports.findAll = async (req, res) => {
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

    Tag.count(condition).then(count => {
        Tag.find(condition).skip(offset).limit(limit)
            .then(data => {
                res.render('pages/tag/list', {
                    lists: {
                        data: data, current: page, offset: offset,
                        pages: Math.ceil(count / limit)
                    },
                    query: query,
                    user, success, danger, info, page_title: 'Tag List', page_url: 'tag.list', url: req.pathname
                });
            })
            .catch(err => {
                req.flash('danger', err.message || 'Some error occurred while creating the Tag.');
                res.redirect('/tag');
            });
    });
};

// Find a single Tag with an id
exports.findOne = (req, res) => {
    const id = req.params.id;
    Tag.findOne({ _id: id })
        .then(data => {
            if (data) {
                return res.send({ data: data });
            } else {
                return res.status(404).send({
                    message: `Cannot find Tag with id=${id}.`
                });
            }
        })
        .catch(err => {
            return res.status(500).send({
                message: "Error retrieving Tag with id=" + id
            });
        });
};

exports.edit = (req, res) => {
    const user = req.cookies['user'];

    const success = req.flash('success');
    const danger = req.flash('danger');
    const info = req.flash('info');

    const id = req.params.id;
    Tag.findOne({ _id: id })
        .then(data => {
            if (data) {
                res.render('pages/tag/edit', {
                    list: data, user, success, danger, info, page_title: 'Tag Edit', page_url: 'tag.edit'
                });
            } else {
                req.flash('danger', `Cannot find Tag with id=${id}.`);
                res.redirect('/tag');
            }
        })
        .catch(err => {
            req.flash('danger', 'Error updating Tag with id=' + id);
            res.redirect('/tag');
        });
};

// Update a Tag by the id in the request
exports.update = (req, res) => {
    const id = req.params.id;

    upload(req, res, function (err) {
        if (err) {
            res.redirect('/tag/edit/' + id);
        }

        const tag_detail = {};
        tag_detail.title = req.body.title;
        tag_detail.slug = req.body.slug ? slugify(req.body.slug, { lower: true }) : slugify(req.body.title, { lower: true });
        tag_detail.except = req.body.except;
        tag_detail.description = req.body.description;

        tag_detail.field = req.body.field && req.body.field != 'undefined' ? req.body.field : null;

        tag_detail.seo_title = req.body.seo_title;
        tag_detail.seo_keywords = req.body.seo_keywords;
        tag_detail.seo_description = req.body.seo_description;

        if (req.file) {
            tag_detail.image = req.file.filename;
        }
        Tag.updateOne({ _id: id }, { $set: tag_detail }).then(num => {
            if (num.ok == 1) {
                req.flash('success', `Tag updated successfully!`);
                res.redirect('/tag');
            } else {
                req.flash('danger', `Cannot update Tag with id=${id}. Maybe Tag was not found or req.body is empty!`);
                res.redirect('/tag/edit/' + id);
            }
        })
            .catch(err => {
                req.flash('danger', 'Error updating Tag with id=' + id);
                res.redirect('/tag/edit/' + id);
            });

    })
};

// Delete a Tag with the specified id in the request
exports.delete = (req, res) => {
    const id = req.params.id;
    Tag.deleteOne({ _id: id })
        .then(num => {
            if (num.ok == 1) {
                req.flash('success', `Tag deleted successfully!`);
                res.redirect('/tag');
            } else {
                req.flash('danger', `Cannot delete Tag with id=${id}. Maybe Tag was not found!`);
                res.redirect('/tag');
            }
        })
        .catch(err => {
            req.flash('danger', 'Could not delete Tag with id=' + id);
            res.redirect('/tag');
        });
};

// Delete all Tag from the database.
exports.deleteAll = (req, res) => {
    Tag.deleteMany({ _id: { $in: req.body.id } })
        .then(nums => {
            req.flash('success', `${nums.deletedCount} Tags were deleted successfully!`);
            res.redirect('/tag');
        })
        .catch(err => {
            req.flash('danger', err.message || 'Some error occurred while creating the Tag.');
            res.redirect('/tag');
        });
};