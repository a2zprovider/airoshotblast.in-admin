const Role = require('../../schemas/role.js');
const Permission = require('../../schemas/permission.js');

const multer = require('multer');
const fs = require('fs');
const slugify = require('slugify');
const path = require('path');

const storage = multer.diskStorage({
    destination: function (req, res, callback) {
        var dir = "./src/public/upload/role";

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

// Create a new Role Page
exports.add = async (req, res) => {

    const user = req.cookies['user'];
    const permissions = await Permission.find().select(['resource', 'action', '_id']);

    const success = req.flash('success');
    const danger = req.flash('danger');
    const info = req.flash('info');

    res.render('pages/role/add', { user, success, danger, info, permissions, page_title: 'Role Add', page_url: 'role.add' });
};

// Create and Save a new Role
exports.create = (req, res) => {

    // Create a Role
    upload(req, res, function (err) {
        const role = {};
        if (err) {
            res.redirect('/role/create');
        }
        if (!req.body.name) {
            req.flash('danger', 'Please enter name.');
            res.redirect('/role/create');
        }

        role.name = req.body.name;
        role.permissions = req.body.permissions;

        // Save Role in the database
        Role.create(role)
            .then(data => {
                req.flash('success', `Role created successfully!`);
                res.redirect('/role');
            })
            .catch(err => {
                req.flash('danger', err.message || 'Some error occurred while creating the role.');
                res.redirect('/role/create');
            });
    })

};

// Retrieve all Role from the database.
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

    Role.count(condition).then(count => {
        Role.find(condition).skip(offset).limit(limit)
            .then(data => {
                res.render('pages/role/list', {
                    lists: {
                        data: data, current: page, offset: offset,
                        pages: Math.ceil(count / limit)
                    },
                    query: query,
                    user, success, danger, info, page_title: 'Role List', page_url: 'role.list', url: req.pathname
                });
            })
            .catch(err => {
                req.flash('danger', err.message || 'Some error occurred while creating the Role.');
                res.redirect('/role');
            });
    });
};

// Find a single Role with an id
exports.findOne = (req, res) => {
    const id = req.params.id;
    Role.findOne({ _id: id })
        .then(data => {
            if (data) {
                return res.send({ data: data });
            } else {
                return res.status(404).send({
                    message: `Cannot find Role with id=${id}.`
                });
            }
        })
        .catch(err => {
            return res.status(500).send({
                message: "Error retrieving Role with id=" + id
            });
        });
};

exports.edit = async (req, res) => {
    const user = req.cookies['user'];
    const permissions = await Permission.find().select(['resource', 'action', '_id']);

    const success = req.flash('success');
    const danger = req.flash('danger');
    const info = req.flash('info');

    const id = req.params.id;
    Role.findOne({ _id: id })
        .then(data => {
            if (data) {
                res.render('pages/role/edit', {
                    list: data, user, success, danger, info, permissions, page_title: 'Role Edit', page_url: 'role.edit'
                });
            } else {
                req.flash('danger', `Cannot find Role with id=${id}.`);
                res.redirect('/role');
            }
        })
        .catch(err => {
            req.flash('danger', 'Error updating Role with id=' + id);
            res.redirect('/role');
        });
};

// Update a Role by the id in the request
exports.update = async (req, res) => {
    const id = req.params.id;

    const data = await Role.findOne({ _id: id });
    upload(req, res, function (err) {
        if (err) {
            res.redirect('/role/edit/' + id);
        }

        const role_detail = {};

        role_detail.name = req.body.name;
        role_detail.permissions = req.body.permissions;

        Role.updateOne({ _id: id }, { $set: role_detail }).then(num => {
            if (num.ok == 1) {
                req.flash('success', `Role updated successfully!`);
                res.redirect('/role');
            } else {
                req.flash('danger', `Cannot update Role with id=${id}. Maybe Role was not found or req.body is empty!`);
                res.redirect('/role/edit/' + id);
            }
        })
            .catch(err => {
                req.flash('danger', 'Error updating Role with id=' + id);
                res.redirect('/role/edit/' + id);
            });
    })
};

// Delete a Role with the specified id in the request
exports.delete = (req, res) => {
    const id = req.params.id;
    Role.deleteOne({ _id: id })
        .then(num => {
            if (num.ok == 1) {
                req.flash('success', `Role deleted successfully!`);
                res.redirect('/role');
            } else {
                req.flash('danger', `Cannot delete Role with id=${id}. Maybe Role was not found!`);
                res.redirect('/role');
            }
        })
        .catch(err => {
            req.flash('danger', 'Could not delete Role with id=' + id);
            res.redirect('/role');
        });
};

// Delete all Role from the database.
exports.deleteAll = (req, res) => {
    Role.deleteMany({ _id: { $in: req.body.id } })
        .then(nums => {
            req.flash('success', `${nums.deletedCount} Role were deleted successfully!`);
            res.redirect('/role');
        })
        .catch(err => {
            req.flash('danger', err.message || 'Some error occurred while creating the Role.');
            res.redirect('/role');
        });
};