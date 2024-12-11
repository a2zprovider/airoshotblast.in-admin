const Category = require('../../schemas/category.js');

const multer = require('multer');
const fs = require('fs');
const slugify = require('slugify');
const path = require('path');
const storage = multer.diskStorage({
    destination: function (req, res, callback) {
        var dir = "./src/public/upload/category";

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

// Create a new Category Page
exports.add = async (req, res) => {

    const user = req.cookies['user'];
    const categories = await Category.find();

    const success = req.flash('success');
    const danger = req.flash('danger');
    const info = req.flash('info');

    res.render('pages/category/add', { user, success, danger, info, categories, page_title: 'Category Add', page_url: 'category.add' });
};

// Create and Save a new Category
exports.create = (req, res) => {

    // Create a Category
    upload(req, res, function (err) {
        const category = {};
        if (err) {
            res.redirect('/category/create');
        }

        if (req.file) {
            category.image = req.file.filename;
        }

        if (!req.body.title) {
            req.flash('danger', 'Please enter title.');
            res.redirect('/category/create');
        }
        if (!req.body.description) {
            req.flash('danger', 'Please enter description.');
            res.redirect('/category/create');
        }

        category.title = req.body.title;
        category.slug = req.body.slug ? slugify(req.body.slug, { lower: true }) : slugify(req.body.title, { lower: true });
        category.except = req.body.except;
        category.description = req.body.description;
        category.parent = req.body.parent;

        category.seo_title = req.body.seo_title;
        category.seo_keywords = req.body.seo_keywords;
        category.seo_description = req.body.seo_description;

        // Save Category in the database
        Category.create(category)
            .then(data => {
                req.flash('success', `Category created successfully!`);
                res.redirect('/category');
            })
            .catch(err => {
                req.flash('danger', err.message || 'Some error occurred while creating the Category.');
                res.redirect('/category/create');
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

    Category.count(condition).then(count => {
        Category.find(condition).skip(offset).limit(limit).populate('parent')
            .then(data => {
                res.render('pages/category/list', {
                    lists: {
                        data: data, current: page, offset: offset,
                        pages: Math.ceil(count / limit)
                    },
                    query: query,
                    user, success, danger, info, page_title: 'Category List', page_url: 'category.list', url: req.pathname
                });
            })
            .catch(err => {
                req.flash('danger', err.message || 'Some error occurred while creating the Category.');
                res.redirect('/category');
            });

    });
};

// Find a single Category with an id
exports.findOne = (req, res) => {
    const id = req.params.id;
    Category.findOne({ _id: id })
        .then(data => {
            if (data) {
                return res.send({ data: data });
            } else {
                return res.status(404).send({
                    message: `Cannot find Category with id=${id}.`
                });
            }
        })
        .catch(err => {
            return res.status(500).send({
                message: "Error retrieving Category with id=" + id
            });
        });
};

exports.edit = async (req, res) => {
    const user = req.cookies['user'];

    const success = req.flash('success');
    const danger = req.flash('danger');
    const info = req.flash('info');

    const id = req.params.id;

    const categories = await Category.find({ _id: { $ne: id } });

    Category.findOne({ _id: id })
        .then(data => {
            if (data) {
                res.render('pages/category/edit', {
                    list: data, user, success, danger, info, categories, page_title: 'Category Edit', page_url: 'category.edit'
                });
            } else {
                req.flash('danger', `Cannot find Category with id=${id}.`);
                res.redirect('/category');
            }
        })
        .catch(err => {
            req.flash('danger', 'Error updating Category with id=' + id);
            res.redirect('/category');
        });
};

// Update a Category by the id in the request
exports.update = (req, res) => {
    const id = req.params.id;

    upload(req, res, function (err) {
        if (err) {
            res.redirect('/category/edit/' + id);
        }

        const category_detail = {};

        category_detail.title = req.body.title;
        category_detail.slug = req.body.slug ? slugify(req.body.slug, { lower: true }) : slugify(req.body.title, { lower: true });
        category_detail.except = req.body.except;
        category_detail.description = req.body.description;
        category_detail.parent = req.body.parent;

        category_detail.seo_title = req.body.seo_title;
        category_detail.seo_keywords = req.body.seo_keywords;
        category_detail.seo_description = req.body.seo_description;

        if (req.file) {
            category_detail.image = req.file.filename;
        }

        Category.updateOne({ _id: id }, { $set: category_detail }).then(num => {
            if (num.ok == 1) {
                req.flash('success', `Category updated successfully!`);
                res.redirect('/category');
            } else {
                req.flash('danger', `Cannot update Category with id=${id}. Maybe Category was not found or req.body is empty!`);
                res.redirect('/category/edit/' + id);
            }
        })
            .catch(err => {
                req.flash('danger', 'Error updating Category with id=' + id);
                res.redirect('/category/edit/' + id);
            });

    })
};

// Delete a Category with the specified id in the request
exports.delete = (req, res) => {
    const id = req.params.id;
    Category.deleteOne({ _id: id })
        .then(num => {
            if (num.ok == 1) {
                req.flash('success', `Category deleted successfully!`);
                res.redirect('/category');
            } else {
                req.flash('danger', `Cannot delete Category with id=${id}. Maybe Category was not found!`);
                res.redirect('/category');
            }
        })
        .catch(err => {
            req.flash('danger', 'Could not delete Category with id=' + id);
            res.redirect('/category');
        });
};

// Delete all Category from the database.
exports.deleteAll = (req, res) => {
    Category.deleteMany({ _id: { $in: req.body.id } })
        .then(nums => {
            req.flash('success', `${nums.deletedCount} Category were deleted successfully!`);
            res.redirect('/category');
        })
        .catch(err => {
            req.flash('danger', err.message || 'Some error occurred while deleting the Category.');
            res.redirect('/category');
        });
};