const BlogCategory = require('../../schemas/blogcategory.js');

const multer = require('multer');
const fs = require('fs');
const slugify = require('slugify');
const path = require('path');

const storage = multer.diskStorage({
    destination: function (req, res, callback) {
        var dir = "./src/public/upload/blogcategory";

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


// Create a new Blog Category Page
exports.add = async (req, res) => {

    const user = req.cookies['user'];

    const success = req.flash('success');
    const danger = req.flash('danger');
    const info = req.flash('info');

    res.render('pages/blogcategory/add', { user, success, danger, info, page_title: 'Blog Category Add', page_url: 'blogcategory.add' });
};

// Create and Save a new Blog Category
exports.create = (req, res) => {

    // Create a Blog Category
    upload(req, res, function (err) {
        const category = {};
        if (err) {
            res.redirect('/blogcategory/create');
        }

        if (req.file) {
            category.image = req.file.filename;
        }

        if (!req.body.title) {
            req.flash('danger', 'Please enter title.');
            res.redirect('/blogcategory/create');
        }
        if (!req.body.description) {
            req.flash('danger', 'Please enter description.');
            res.redirect('/blogcategory/create');
        }

        category.title = req.body.title;
        category.slug = req.body.slug ? slugify(req.body.slug, { lower: true }) : slugify(req.body.title, { lower: true });
        category.except = req.body.except;
        category.description = req.body.description;

        category.seo_title = req.body.seo_title;
        category.seo_keywords = req.body.seo_keywords;
        category.seo_description = req.body.seo_description;

        // Save Blog Category in the database
        BlogCategory.create(category)
            .then(data => {
                req.flash('success', `Blog Category created successfully!`);
                res.redirect('/blogcategory');
            })
            .catch(err => {
                req.flash('danger', err.message || 'Some error occurred while creating the Blog Category.');
                res.redirect('/blogcategory/create');
            });
    })

};

// Retrieve all Blog Category from the database.
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

    BlogCategory.count(condition).then(count => {
        BlogCategory.find(condition).skip(offset).limit(limit)
            .then(data => {
                res.render('pages/blogcategory/list', {
                    lists: {
                        data: data, current: page, offset: offset,
                        pages: Math.ceil(count / limit)
                    },
                    query: query,
                    user, success, danger, info, page_title: 'Blog Category List', page_url: 'blogcategory.list', url: req.pathname
                });
            })
            .catch(err => {
                req.flash('danger', err.message || 'Some error occurred while creating the Blog Category.');
                res.redirect('/blogcategory');
            });

    });
};

// Find a single Blog Category with an id
exports.findOne = (req, res) => {
    const id = req.params.id;
    BlogCategory.findOne({ _id: id })
        .then(data => {
            if (data) {
                return res.send({ data: data });
            } else {
                return res.status(404).send({
                    message: `Cannot find Blog Category with id=${id}.`
                });
            }
        })
        .catch(err => {
            return res.status(500).send({
                message: "Error retrieving Blog Category with id=" + id
            });
        });
};

exports.edit = (req, res) => {
    const user = req.cookies['user'];

    const success = req.flash('success');
    const danger = req.flash('danger');
    const info = req.flash('info');

    const id = req.params.id;
    BlogCategory.findOne({ _id: id })
        .then(data => {
            if (data) {
                res.render('pages/blogcategory/edit', {
                    list: data, user, success, danger, info, page_title: 'Blog Category Edit', page_url: 'blogcategory.edit'
                });
            } else {
                req.flash('danger', `Cannot find Blog Category with id=${id}.`);
                res.redirect('/blogcategory');
            }
        })
        .catch(err => {
            req.flash('danger', 'Error updating Blog Category with id=' + id);
            res.redirect('/blogcategory');
        });
};


// Update a Blog Category by the id in the request
exports.update = (req, res) => {
    const id = req.params.id;

    upload(req, res, function (err) {
        if (err) {
            res.redirect('/blogcategory/edit/' + id);
        }

        const category_detail = {};

        category_detail.title = req.body.title;
        category_detail.slug = req.body.slug ? slugify(req.body.slug, { lower: true }) : slugify(req.body.title, { lower: true });
        category_detail.except = req.body.except;
        category_detail.description = req.body.description;

        category_detail.seo_title = req.body.seo_title;
        category_detail.seo_keywords = req.body.seo_keywords;
        category_detail.seo_description = req.body.seo_description;

        if (req.file) {
            category_detail.image = req.file.filename;
        }

        BlogCategory.updateOne({ _id: id }, { $set: category_detail }).then(num => {
            if (num.ok == 1) {
                req.flash('success', `Blog Category updated successfully!`);
                res.redirect('/blogcategory');
            } else {
                req.flash('danger', `Cannot update Blog Category with id=${id}. Maybe Blog Category was not found or req.body is empty!`);
                res.redirect('/blogcategory/edit/' + id);
            }
        })
            .catch(err => {
                req.flash('danger', 'Error updating Blog Category with id=' + id);
                res.redirect('/blogcategory/edit/' + id);
            });

    })
};

// Delete a Blog Category with the specified id in the request
exports.delete = (req, res) => {
    const id = req.params.id;
    BlogCategory.deleteOne({ _id: id })
        .then(num => {
            if (num.ok == 1) {
                req.flash('success', `Blog Category deleted successfully!`);
                res.redirect('/blogcategory');
            } else {
                req.flash('danger', `Cannot delete Blog Category with id=${id}. Maybe Blog Category was not found!`);
                res.redirect('/blogcategory');
            }
        })
        .catch(err => {
            req.flash('danger', 'Could not delete Blog Category with id=' + id);
            res.redirect('/blogcategory');
        });
};

// Delete all Blog Category from the database.
exports.deleteAll = (req, res) => {
    BlogCategory.deleteMany({ _id: { $in: req.body.id } })
        .then(nums => {
            req.flash('success', `${nums.deletedCount} Blog Category were deleted successfully!`);
            res.redirect('/blogcategory');
        })
        .catch(err => {
            req.flash('danger', err.message || 'Some error occurred while creating the Blog Category.');
            res.redirect('/blogcategory');
        });
};