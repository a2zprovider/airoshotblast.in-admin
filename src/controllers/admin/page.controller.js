const Page = require('../../schemas/page.js');
const multer = require('multer');
const fs = require('fs');
const slugify = require('slugify');
const path = require('path');

const storage = multer.diskStorage({
    destination: function (req, res, callback) {
        var dir = "./src/public/upload/page";

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

// Create a new Page 
exports.add = (req, res) => {

    const user = req.cookies['user'];

    const success = req.flash('success');
    const danger = req.flash('danger');
    const info = req.flash('info');

    res.render('pages/page/add', { user, success, danger, info, page_title: 'Page Add', page_url: 'page.add' });
};

// Create and Save a new Page
exports.create = (req, res) => {

    // Create a Page
    upload(req, res, function (err) {
        const page = {};
        const pageseo = {};
        if (err) {
            res.redirect('/page/create');
        }

        if (req.file) {
            page.image = req.file.filename;
        }

        if (!req.body.title) {
            req.flash('danger', 'Please enter title.');
            res.redirect('/page/create');
        }
        if (!req.body.description) {
            req.flash('danger', 'Please enter description.');
            res.redirect('/page/create');
        }

        page.title = req.body.title;
        page.slug = req.body.slug ? slugify(req.body.slug, { lower: true }) : slugify(req.body.title, { lower: true });
        page.except = req.body.except;
        page.description = req.body.description;

        page.seo_title = req.body.seo_title;
        page.seo_keywords = req.body.seo_keywords;
        page.seo_description = req.body.seo_description;

        // Save page in the database
        Page.create(page)
            .then(data => {
                req.flash('success', `Page created successfully!`);
                res.redirect('/page');
            })
            .catch(err => {
                req.flash('danger', err.message || 'Some error occurred while creating the Page.');
                res.redirect('/page/create');
            });
    })

};

// Retrieve all Page from the database.
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

    Page.count(condition).then(count => {
        Page.find(condition).skip(offset).limit(limit)
            .then(data => {
                const lists = {
                    data: data, current: page, offset: offset,
                    pages: Math.ceil(count / limit)
                };
                res.render('pages/page/list', {
                    lists: {
                        data: data, current: page, offset: offset,
                        pages: Math.ceil(count / limit)
                    },
                    query: query,
                    user, success, danger, info, page_title: 'Page List', page_url: 'page.list', url: req.pathname
                });
            })
            .catch(err => {
                req.flash('danger', err.message || 'Some error occurred while creating the Page.');
                res.redirect('/page');
            });
    });
};

// Find a single Page with an id
exports.findOne = (req, res) => {
    const id = req.params.id;
    Page.findOne({ _id: id })
        .then(data => {
            if (data) {
                return res.send({ data: data });
            } else {
                return res.status(404).send({
                    message: `Cannot find Page with id=${id}.`
                });
            }
        })
        .catch(err => {
            return res.status(500).send({
                message: "Error retrieving Page with id=" + id
            });
        });
};

exports.edit = (req, res) => {
    const user = req.cookies['user'];

    const success = req.flash('success');
    const danger = req.flash('danger');
    const info = req.flash('info');

    const id = req.params.id;
    Page.findOne({ _id: id })
        .then(data => {
            if (data) {
                res.render('pages/page/edit', {
                    list: data, user, success, danger, info, page_title: 'Page Edit', page_url: 'page.edit'
                });
            } else {
                req.flash('danger', `Cannot find Page with id=${id}.`);
                res.redirect('/page');
            }
        })
        .catch(err => {
            req.flash('danger', 'Error updating Page with id=' + id);
            res.redirect('/page');
        });
};


// Update a Page by the id in the request
exports.update = (req, res) => {
    const id = req.params.id;

    upload(req, res, function (err) {
        if (err) {
            res.redirect('/page/edit/' + id);
        }

        const page_detail = {};

        page_detail.title = req.body.title;
        page_detail.slug = req.body.slug ? slugify(req.body.slug, { lower: true }) : slugify(req.body.title, { lower: true });
        page_detail.except = req.body.except;
        page_detail.description = req.body.description;

        page_detail.seo_title = req.body.seo_title;
        page_detail.seo_keywords = req.body.seo_keywords;
        page_detail.seo_description = req.body.seo_description;

        if (req.file) {
            page_detail.image = req.file.filename;
        }

        Page.updateOne({ _id: id }, { $set: page_detail }).then(num => {
            if (num.ok == 1) {
                req.flash('success', `Page updated successfully!`);
                res.redirect('/page');
            } else {
                req.flash('danger', `Cannot update Page with id=${id}. Maybe Page was not found or req.body is empty!`);
                res.redirect('/page/edit/' + id);
            }
        })
            .catch(err => {
                req.flash('danger', 'Error updating Page with id=' + id);
                res.redirect('/page/edit/' + id);
            });

    })
};

// Delete a Page with the specified id in the request
exports.delete = (req, res) => {
    const id = req.params.id;
    Page.deleteOne({ _id: id })
        .then(num => {
            if (num.ok == 1) {
                req.flash('success', `Page deleted successfully!`);
                res.redirect('/page');
            } else {
                req.flash('danger', `Cannot delete Page with id=${id}. Maybe Page was not found!`);
                res.redirect('/page');
            }
        })
        .catch(err => {
            req.flash('danger', 'Could not delete Page with id=' + id);
            res.redirect('/page');
        });
};

// Delete all Page from the database.
exports.deleteAll = (req, res) => {
    Page.deleteMany({ _id: { $in: req.body.id } })
        .then(nums => {
            req.flash('success', `${nums.deletedCount} Page were deleted successfully!`);
            res.redirect('/page');
        })
        .catch(err => {
            req.flash('danger', err.message || 'Some error occurred while creating the Page.');
            res.redirect('/page');
        });
};