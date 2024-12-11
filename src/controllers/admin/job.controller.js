const Job = require('../../schemas/job.js');

const multer = require('multer');
const fs = require('fs');
const slugify = require('slugify');
const path = require('path');

const storage = multer.diskStorage({
    destination: function (req, res, callback) {
        var dir = "./src/public/upload/job";

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

const upload = multer({ storage: storage }).single('resume');

// Create a new Job 
exports.add = async (req, res) => {

    const user = req.cookies['user'];

    const success = req.flash('success');
    const danger = req.flash('danger');
    const info = req.flash('info');

    return res.render('pages/job/add', { user, success, danger, info, page_title: 'Job Add', page_url: 'job.add' });
};

// Create and Save a new Job
exports.create = (req, res) => {

    // Create a Job
    upload(req, res, function (err) {
        const job = {};
        if (err) {
            return res.redirect('/job/create');
        }

        if (req.file) {
            job.resume = req.file.filename;
        }

        if (!req.body.title) {
            req.flash('danger', 'Please enter title.');
            return res.redirect('/job/create');
        }
        if (!req.body.description) {
            req.flash('danger', 'Please enter description.');
            return res.redirect('/job/create');
        }

        job.title = req.body.title;
        job.slug = req.body.slug ? slugify(req.body.slug, { lower: true }) : slugify(req.body.title, { lower: true });
        job.except = req.body.except;
        job.description = req.body.description;
        job.vacancy = req.body.vacancy;
        job.address = req.body.address;

        job.seo_title = req.body.seo_title;
        job.seo_keywords = req.body.seo_keywords;
        job.seo_description = req.body.seo_description;

        // Save job in the database
        Job.create(job)
            .then(data => {
                req.flash('success', `Job created successfully!`);
                return res.redirect('/job');
            })
            .catch(err => {
                req.flash('danger', err.message || 'Some error occurred while creating the Job.');
                return res.redirect('/job/create');
            });
    })

};

// Retrieve all Job from the database.
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

    Job.count(condition).then(count => {
        Job.find(condition)
        .populate('career').skip(offset).limit(limit)
            .then(data => {
                return res.render('pages/job/list', {
                    lists: {
                        data: data, current: page, offset: offset,
                        pages: Math.ceil(count / limit)
                    },
                    query: query,
                    user, success, danger, info, page_title: 'Job List', page_url: 'job.list', url: req.pathname
                });
            })
            .catch(err => {
                req.flash('danger', err.message || 'Some error occurred while creating the Job.');
                return res.redirect('/job');
            });
    });
};

// Find a single Job with an id
exports.findOne = (req, res) => {
    const id = req.params.id;
    Job.findOne({ _id: id })
        .then(data => {
            if (data) {
                return res.send({ data: data });
            } else {
                return res.status(404).send({
                    message: `Cannot find Job with id=${id}.`
                });
            }
        })
        .catch(err => {
            return res.status(500).send({
                message: "Error retrieving Job with id=" + id
            });
        });
};

exports.edit = async (req, res) => {
    const user = req.cookies['user'];

    const success = req.flash('success');
    const danger = req.flash('danger');
    const info = req.flash('info');

    const id = req.params.id;
    Job.findOne({ _id: id })
        .then(data => {
            if (data) {
                return res.render('pages/job/edit', {
                    list: data, user, success, danger, info, page_title: 'Job Edit', page_url: 'job.edit'
                });
            } else {
                req.flash('danger', `Cannot find Job with id=${id}.`);
                return res.redirect('/job');
            }
        })
        .catch(err => {
            req.flash('danger', 'Error updating Job with id=' + id);
            return res.redirect('/job');
        });
};


// Update a Job by the id in the request
exports.update = (req, res) => {
    const id = req.params.id;

    upload(req, res, function (err) {
        if (err) {
            return res.redirect('/job/edit/' + id);
        }

        const job_detail = {};

        job_detail.review = req.body.review;
        job_detail.status = req.body.status;

        if (req.file) {
            job_detail.resume = req.file.filename;
        }

        Job.updateOne({ _id: id }, { $set: job_detail }).then(num => {
            if (num.ok == 1) {
                req.flash('success', `Job updated successfully!`);
                return res.redirect('/job');
            } else {
                req.flash('danger', `Cannot update Job with id=${id}. Maybe Job was not found or req.body is empty!`);
                return res.redirect('/job/edit/' + id);
            }
        })
            .catch(err => {
                req.flash('danger', 'Error updating Job with id=' + id);
                return res.redirect('/job/edit/' + id);
            });

    })
};

// Delete a Job with the specified id in the request
exports.delete = (req, res) => {
    const id = req.params.id;
    Job.deleteOne({ _id: id })
        .then(num => {
            if (num.ok == 1) {
                req.flash('success', `Job deleted successfully!`);
                return res.redirect('/job');
            } else {
                req.flash('danger', `Cannot delete Job with id=${id}. Maybe Job was not found!`);
                return res.redirect('/job');
            }
        })
        .catch(err => {
            req.flash('danger', 'Could not delete Job with id=' + id);
            return res.redirect('/job');
        });
};

// Delete all Job from the database.
exports.deleteAll = (req, res) => {
    Job.deleteMany({ _id: { $in: req.body.id } })
        .then(nums => {
            req.flash('success', `${nums.deletedCount} Job were deleted successfully!`);
            return res.redirect('/job');
        })
        .catch(err => {
            req.flash('danger', err.message || 'Some error occurred while creating the Job.');
            return res.redirect('/job');
        });
};