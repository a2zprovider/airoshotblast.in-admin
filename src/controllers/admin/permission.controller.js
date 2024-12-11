const Permission = require('../../schemas/permission.js');

const multer = require('multer');
const fs = require('fs');
const slugify = require('slugify');
const path = require('path');

const storage = multer.diskStorage({
    destination: function (req, res, callback) {
        var dir = "./src/public/upload/permission";

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

// Create a new Permission Page
exports.add = async (req, res) => {
    let data = [{ resource: 'Slider', action: 'Read' },
    { resource: 'Slider', action: 'Add' },
    { resource: 'Slider', action: 'Create' },
    { resource: 'Slider', action: 'Edit' },
    { resource: 'Slider', action: 'Update' },
    { resource: 'Slider', action: 'Delete' }];

    data.forEach(element => {
        const permission = {};
        permission.resource = element.resource;
        permission.action = element.action;
        Permission.create(permission);
    });

    const user = req.cookies['user'];

    const success = req.flash('success');
    const danger = req.flash('danger');
    const info = req.flash('info');

    res.render('pages/permission/add', { user, success, danger, info, page_title: 'Permission Add', page_url: 'permission.add' });
};

// Create and Save a new Permission
exports.create = (req, res) => {

    // Create a Permission
    upload(req, res, function (err) {
        const permission = {};
        if (err) {
            res.redirect('/permission/create');
        }
        if (!req.body.resource) {
            req.flash('danger', 'Please enter resource.');
            res.redirect('/permission/create');
        }
        if (!req.body.action) {
            req.flash('danger', 'Please enter action.');
            res.redirect('/permission/create');
        }

        permission.resource = req.body.resource;
        permission.action = req.body.action;

        // Save Permission in the database
        Permission.create(permission)
            .then(data => {
                req.flash('success', `Permission created successfully!`);
                res.redirect('/permission');
            })
            .catch(err => {
                req.flash('danger', err.message || 'Some error occurred while creating the permission.');
                res.redirect('/permission/create');
            });
    })

};

// Retrieve all Permission from the database.
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

    Permission.count(condition).then(count => {
        Permission.find(condition).skip(offset).limit(limit)
            .then(data => {
                res.render('pages/permission/list', {
                    lists: {
                        data: data, current: page, offset: offset,
                        pages: Math.ceil(count / limit)
                    },
                    query: query,
                    user, success, danger, info, page_title: 'Permission List', page_url: 'permission.list', url: req.pathname
                });
            })
            .catch(err => {
                req.flash('danger', err.message || 'Some error occurred while creating the Permission.');
                res.redirect('/permission');
            });
    });
};

// Find a single Permission with an id
exports.findOne = (req, res) => {
    const id = req.params.id;
    Permission.findOne({ _id: id })
        .then(data => {
            if (data) {
                return res.send({ data: data });
            } else {
                return res.status(404).send({
                    message: `Cannot find Permission with id=${id}.`
                });
            }
        })
        .catch(err => {
            return res.status(500).send({
                message: "Error retrieving Permission with id=" + id
            });
        });
};

exports.edit = async (req, res) => {
    const user = req.cookies['user'];

    const success = req.flash('success');
    const danger = req.flash('danger');
    const info = req.flash('info');

    const id = req.params.id;
    Permission.findOne({ _id: id })
        .then(data => {
            if (data) {
                res.render('pages/permission/edit', {
                    list: data, user, success, danger, info, page_title: 'Permission Edit', page_url: 'permission.edit'
                });
            } else {
                req.flash('danger', `Cannot find Permission with id=${id}.`);
                res.redirect('/permission');
            }
        })
        .catch(err => {
            req.flash('danger', 'Error updating Permission with id=' + id);
            res.redirect('/permission');
        });
};

// Update a Permission by the id in the request
exports.update = async (req, res) => {
    const id = req.params.id;

    const data = await Permission.findOne({ _id: id });
    upload(req, res, function (err) {
        if (err) {
            res.redirect('/permission/edit/' + id);
        }

        const permission_detail = {};

        permission_detail.resource = req.body.resource;
        permission_detail.action = req.body.action;

        Permission.updateOne({ _id: id }, { $set: permission_detail }).then(num => {
            if (num.ok == 1) {
                req.flash('success', `Permission updated successfully!`);
                res.redirect('/permission');
            } else {
                req.flash('danger', `Cannot update Permission with id=${id}. Maybe Permission was not found or req.body is empty!`);
                res.redirect('/permission/edit/' + id);
            }
        })
            .catch(err => {
                req.flash('danger', 'Error updating Permission with id=' + id);
                res.redirect('/permission/edit/' + id);
            });
    })
};

// Delete a Permission with the specified id in the request
exports.delete = (req, res) => {
    const id = req.params.id;
    Permission.deleteOne({ _id: id })
        .then(num => {
            if (num.ok == 1) {
                req.flash('success', `Permission deleted successfully!`);
                res.redirect('/permission');
            } else {
                req.flash('danger', `Cannot delete Permission with id=${id}. Maybe Permission was not found!`);
                res.redirect('/permission');
            }
        })
        .catch(err => {
            req.flash('danger', 'Could not delete Permission with id=' + id);
            res.redirect('/permission');
        });
};

// Delete all Permission from the database.
exports.deleteAll = (req, res) => {
    Permission.deleteMany({ _id: { $in: req.body.id } })
        .then(nums => {
            req.flash('success', `${nums.deletedCount} Permission were deleted successfully!`);
            res.redirect('/permission');
        })
        .catch(err => {
            req.flash('danger', err.message || 'Some error occurred while creating the Permission.');
            res.redirect('/permission');
        });
};