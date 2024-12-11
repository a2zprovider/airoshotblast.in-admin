const Video = require('../../schemas/video.js');

const multer = require('multer');
const fs = require('fs');
const slugify = require('slugify');
const path = require('path');

const storage = multer.diskStorage({
    destination: function (req, res, callback) {
        var dir = "./src/public/upload/video";

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

// Create a new Video 
exports.add = async (req, res) => {

    const user = req.cookies['user'];

    const success = req.flash('success');
    const danger = req.flash('danger');
    const info = req.flash('info');

    return res.render('pages/video/add', { user, success, danger, info, page_title: 'Video Add', page_url: 'video.add' });
};

// Create and Save a new Video
exports.create = (req, res) => {

    // Create a Video
    upload(req, res, function (err) {
        const video = {};
        if (err) {
            return res.redirect('/video/create');
        }

        if (req.file) {
            video.image = req.file.filename;
        }

        if (!req.body.title) {
            req.flash('danger', 'Please enter title.');
            return res.redirect('/video/create');
        }

        video.title = req.body.title;
        video.url = req.body.url;

        // Save video in the database
        Video.create(video)
            .then(data => {
                req.flash('success', `Video created successfully!`);
                return res.redirect('/video');
            })
            .catch(err => {
                req.flash('danger', err.message || 'Some error occurred while creating the Video.');
                return res.redirect('/video/create');
            });
    })

};

// Retrieve all Video from the database.
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

    Video.count(condition).then(count => {
        Video.find(condition).skip(offset).limit(limit)
            .then(data => {
                const lists = {
                    data: data, current: page, offset: offset,
                    pages: Math.ceil(count / limit)
                };
                return res.render('pages/video/list', {
                    lists: {
                        data: data, current: page, offset: offset,
                        pages: Math.ceil(count / limit)
                    },
                    query: query,
                    user, success, danger, info, page_title: 'Video List', page_url: 'video.list', url: req.pathname
                });
            })
            .catch(err => {
                req.flash('danger', err.message || 'Some error occurred while creating the Video.');
                return res.redirect('/video');
            });
    });
};

// Find a single Video with an id
exports.findOne = (req, res) => {
    const id = req.params.id;
    Video.findOne({ _id: id })
        .then(data => {
            if (data) {
                return res.send({ data: data });
            } else {
                return res.status(404).send({
                    message: `Cannot find Video with id=${id}.`
                });
            }
        })
        .catch(err => {
            return res.status(500).send({
                message: "Error retrieving Video with id=" + id
            });
        });
};

exports.edit = async (req, res) => {
    const user = req.cookies['user'];

    const success = req.flash('success');
    const danger = req.flash('danger');
    const info = req.flash('info');

    const id = req.params.id;
    Video.findOne({ _id: id })
        .then(data => {
            if (data) {
                return res.render('pages/video/edit', {
                    list: data, user, success, danger, info, page_title: 'Video Edit', page_url: 'video.edit'
                });
            } else {
                req.flash('danger', `Cannot find Video with id=${id}.`);
                return res.redirect('/video');
            }
        })
        .catch(err => {
            req.flash('danger', 'Error updating Video with id=' + id);
            return res.redirect('/video');
        });
};


// Update a Video by the id in the request
exports.update = (req, res) => {
    const id = req.params.id;

    upload(req, res, function (err) {
        if (err) {
            return res.redirect('/video/edit/' + id);
        }

        const video_detail = {};

        video_detail.title = req.body.title;
        video_detail.url = req.body.url;

        if (req.file) {
            video_detail.image = req.file.filename;
        }

        Video.updateOne({ _id: id }, { $set: video_detail }).then(num => {
            if (num.ok == 1) {
                req.flash('success', `Video updated successfully!`);
                return res.redirect('/video');
            } else {
                req.flash('danger', `Cannot update Video with id=${id}. Maybe Video was not found or req.body is empty!`);
                return res.redirect('/video/edit/' + id);
            }
        })
            .catch(err => {
                req.flash('danger', 'Error updating Video with id=' + id);
                return res.redirect('/video/edit/' + id);
            });

    })
};

// Delete a Video with the specified id in the request
exports.delete = (req, res) => {
    const id = req.params.id;
    Video.deleteOne({ _id: id })
        .then(num => {
            if (num.ok == 1) {
                req.flash('success', `Video deleted successfully!`);
                return res.redirect('/video');
            } else {
                req.flash('danger', `Cannot delete Video with id=${id}. Maybe Video was not found!`);
                return res.redirect('/video');
            }
        })
        .catch(err => {
            req.flash('danger', 'Could not delete Video with id=' + id);
            return res.redirect('/video');
        });
};

// Delete all Video from the database.
exports.deleteAll = (req, res) => {
    Video.deleteMany({ _id: { $in: req.body.id } })
        .then(nums => {
            req.flash('success', `${nums.deletedCount} Video were deleted successfully!`);
            return res.redirect('/video');
        })
        .catch(err => {
            req.flash('danger', err.message || 'Some error occurred while creating the Video.');
            return res.redirect('/video');
        });
};