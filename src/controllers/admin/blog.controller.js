const Blog = require('../../schemas/blog.js');
const Tag = require('../../schemas/tags.js');
const BlogCategory = require('../../schemas/blogcategory.js');
const Country = require('../../schemas/country.js');

const multer = require('multer');
const fs = require('fs');
const slugify = require('slugify');
const path = require('path');
const mongoose = require('mongoose');
const logger = require('../../logger.js');

const storage = multer.diskStorage({
    destination: function (req, res, callback) {
        if (res.fieldname === "image") {
            var dir = "./src/public/upload/blog";
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir);
            }
            callback(null, dir);
        }
        else if (res.fieldname === "thumb_image") {
            var dir = "./src/public/upload/blog/thumb";
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir);
            }
            callback(null, dir);
        }
    },
    filename: function (req, res, callback) {
        if (res.fieldname === "image") {
            callback(null, res.fieldname + '-' + Date.now() + Math.random().toString().substr(2, 6) + path.extname(res.originalname));
        }
        else if (res.fieldname === "thumb_image") {
            callback(null, res.fieldname + '-' + Date.now() + Math.random().toString().substr(2, 6) + path.extname(res.originalname));
        }
        // callback(null, res.originalname);
    }
})

const upload = multer({ storage: storage }).fields([{ name: 'image', maxCount: 1 }, { name: 'thumb_image', maxCount: 1 }]);

// Create a new Blog Page
exports.add = async (req, res) => {

    const categories = await BlogCategory.find().select(['title', '_id']);
    const tags = await Tag.find().select(['title', '_id']);
    const countries = await Country.find();

    const user = req.cookies['user'];

    const success = req.flash('success');
    const danger = req.flash('danger');
    const info = req.flash('info');

    res.render('pages/blog/add', { user, success, danger, info, categories, countries, tags, page_title: 'Blog Add', page_url: 'blog.add' });
};

// Create and Save a new Blog
exports.create = async (req, res) => {

    // Create a Blog    
    upload(req, res, function (err) {
        const blog = {};
        if (err) {
            res.redirect('/blog/create');
        }

        if (!req.body.title) {
            req.flash('danger', 'Please enter title.');
            res.redirect('/blog/create');
        }
        if (!req.body.description) {
            req.flash('danger', 'Please enter description.');
            res.redirect('/blog/create');
        }

        blog.title = req.body.title;
        blog.slug = req.body.slug ? slugify(req.body.slug, { lower: true }) : slugify(req.body.title, { lower: true });
        blog.except = req.body.except;
        blog.description = req.body.description;

        blog.categories = req.body.categories != null ? req.body.categories : [];
        blog.tags = req.body.tags != null ? req.body.tags : [];

        blog.country = req.body.country;

        blog.seo_title = req.body.seo_title;
        blog.seo_keywords = req.body.seo_keywords;
        blog.seo_description = req.body.seo_description;
        
        if (req.files && req.files.image) {
            blog.image = req.files.image[0].filename;
        }
        if (req.files && req.files.thumb_image) {
            blog.thumb_image = req.files.thumb_image[0].filename;
        }

        // Save Blog in the database
        Blog.create(blog)
            .then(data => {
                // data.addBlogcategory(req.body.category);
                // data.addTag(req.body.tag);
                req.flash('success', `Blog created successfully!`);
                res.redirect('/blog');
            })

            .catch(err => {
                req.flash('danger', err.message || 'Some error occurred while creating the Blog.');
                res.redirect('/blog/create');
            });
    })

};

// Retrieve all Blogs from the database.
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

    Blog.count(condition).then(count => {
        Blog.find(condition).sort({ createdAt: -1 }).skip(offset).limit(limit).populate(['tags', 'categories'])
            .then(data => {
                res.render('pages/blog/list', {
                    lists: {
                        data: data, current: page, offset: offset,
                        pages: Math.ceil(count / limit)
                    },
                    query: query,
                    user, success, danger, info, page_title: 'Blog List', page_url: 'blog.list', url: req.pathname
                });
            })
            .catch(err => {
                req.flash('danger', err.message || 'Some error occurred while creating the Blog.');
                res.redirect('/blog');
            });

    });
};

// Find a single Blog Category with an id
exports.findOne = (req, res) => {
    const id = req.params.id;
    Blog.findOne({ _id: id })
        .then(data => {
            if (data) {
                return res.send({ data: data });
            } else {
                return res.status(404).send({
                    message: `Cannot find Blog with id=${id}.`
                });
            }
        })
        .catch(err => {
            return res.status(500).send({
                message: "Error retrieving Blog with id=" + id
            });
        });
};

exports.edit = async (req, res) => {
    const user = req.cookies['user'];

    const success = req.flash('success');
    const danger = req.flash('danger');
    const info = req.flash('info');

    const categories = await BlogCategory.find();
    const tags = await Tag.find();
    const countries = await Country.find();

    const id = req.params.id;

    Blog.findOne({ _id: id })
        .then(data => {
            if (data) {
                res.render('pages/blog/edit', {
                    list: data, user, success, danger, info, categories, tags, countries, page_title: 'Blog Edit', page_url: 'blog.edit'
                });
            } else {
                req.flash('danger', `Cannot find Blog with id=${id}.`);
                res.redirect('/blog');
            }
        })
        .catch(err => {
            req.flash('danger', 'Error updating Blog with id=' + id);
            res.redirect('/blog');
        });
};

// Update a Blog by the id in the request
exports.update = async (req, res) => {
    const id = req.params.id;

    upload(req, res, function (err) {
        if (err) {
            res.redirect('/blog/edit/' + id);
        }

        const blog_detail = {};

        blog_detail.title = req.body.title;
        blog_detail.slug = req.body.slug ? slugify(req.body.slug, { lower: true }) : slugify(req.body.title, { lower: true });
        blog_detail.except = req.body.except;
        blog_detail.description = req.body.description;

        blog_detail.categories = req.body.categories != null ? req.body.categories : [];
        blog_detail.tags = req.body.tags != null ? req.body.tags : [];

        blog_detail.country = req.body.country;

        blog_detail.seo_title = req.body.seo_title;
        blog_detail.seo_keywords = req.body.seo_keywords;
        blog_detail.seo_description = req.body.seo_description;

        if (req.files && req.files.image) {
            blog_detail.image = req.files.image[0].filename;
        }
        if (req.files && req.files.thumb_image) {
            blog_detail.thumb_image = req.files.thumb_image[0].filename;
        }

        Blog.updateOne({ _id: id }, { $set: blog_detail }).then(num => {
            if (num.ok == 1) {
                req.flash('success', `Blog updated successfully!`);
                res.redirect('/blog');
            } else {
                req.flash('danger', `Cannot update Blog with id=${id}. Maybe Blog was not found or req.body is empty!`);
                res.redirect('/blog/edit/' + id);
            }
        })
            .catch(err => {
                req.flash('danger', 'Error updating Blog with id=' + id);
                res.redirect('/blog/edit/' + id);
            });

    })
};

// Delete a Blog with the specified id in the request
exports.delete = (req, res) => {
    try {
        const id = req.params.id;

        // Validate the Blog ID
        if (!id || !mongoose.Types.ObjectId.isValid(id)) {
            req.flash('danger', 'Invalid Blog ID.');
            logger.warn(`Attempt to delete with invalid ID: ${id}`);
            return res.redirect('/blog');
        }

        // Proceed to delete the blog
        Blog.deleteOne({ _id: id })
            .then(result => {
                if (result.deletedCount === 1) {
                    // Successful deletion
                    req.flash('success', `Blog deleted successfully!`);
                    res.redirect('/blog');
                } else {
                    // No document was deleted (Blog not found)
                    req.flash('danger', `Cannot delete Blog with id=${id}. Maybe the Blog was not found!`);
                    logger.warn(`Blog with ID ${id} not found for deletion.`);
                    res.redirect('/blog');
                }
            })
            .catch(err => {
                // Log and handle errors from the database
                logger.error(`Error occurred while deleting Blog with ID ${id} - ${err.message || 'Unknown error'}`);
                req.flash('danger', `Could not delete Blog with id=${id}. Please try again later.`);
                res.redirect('/blog');
            });
    } catch (err) {
        // Catch unexpected errors and log them
        logger.error(`Unexpected error during delete operation for Blog with ID ${req.params.id} - ${err.message || 'Unknown error'}`);
        req.flash('danger', 'An unexpected error occurred while attempting to delete the Blog.');
        res.redirect('/blog');
    }
};

// Delete all Blog from the database.
exports.deleteAll = (req, res) => {
    try {
        // Validate the ID array
        if (!req.body.id || !Array.isArray(req.body.id) || req.body.id.length === 0) {
            req.flash('danger', 'No blog IDs provided for deletion.');
            logger.warn('No blog IDs provided for deletion.');
            return res.redirect('/blog');
        }

        // Validate each ID in the array
        const invalidIds = req.body.id.filter(id => !mongoose.Types.ObjectId.isValid(id));
        if (invalidIds.length > 0) {
            req.flash('danger', `Invalid blog IDs: ${invalidIds.join(', ')}`);
            logger.warn(`Invalid blog IDs: ${invalidIds.join(', ')}`);
            return res.redirect('/blog');
        }

        // Proceed with deletion
        Blog.deleteMany({ _id: { $in: req.body.id } })
            .then(nums => {
                if (nums.deletedCount > 0) {
                    req.flash('success', `${nums.deletedCount} Blog(s) were deleted successfully!`);
                    logger.info(`${nums.deletedCount} Blog(s) deleted successfully.`);
                } else {
                    req.flash('danger', 'No Blogs were deleted. Please check if the blogs exist.');
                    logger.warn('No Blogs were deleted, either due to non-existence or invalid IDs.');
                }
                res.redirect('/blog');
            })
            .catch(err => {
                // Log the error and provide a user-friendly message
                logger.error(`Error deleting blogs: ${err.message || 'Unknown error'}`);
                req.flash('danger', err.message || 'Some error occurred while deleting the Blogs.');
                res.redirect('/blog');
            });

    } catch (err) {
        // Catch any unexpected errors
        logger.error(`Unexpected error occurred while deleting blogs: ${err.message || 'Unknown error'}`);
        req.flash('danger', err.message || 'An unexpected error occurred while deleting the Blogs.');
        res.redirect('/blog');
    }
};

// Status Change a Record with the specified id in the request
exports.status = (req, res) => {
    try {
        const id = req.params.id;

        // Validate the Record ID
        if (!id || !mongoose.Types.ObjectId.isValid(id)) {
            req.flash('danger', 'Invalid Record ID.');
            logger.warn(`Attempt to status change with invalid ID: ${id}`);
            return res.redirect('back');
        }

        Blog.findOne({ _id: id })
            .then(r_detail => {
                console.log(r_detail);
                const record_detail = {};
                record_detail.showStatus = !r_detail.showStatus;

                Blog.updateOne({ _id: id }, { $set: record_detail }).then(num => {
                    if (num.ok == 1) {
                        req.flash('success', `Record status change successfully!`);
                        return res.redirect('back');
                    } else {
                        req.flash('danger', `Cannot update Record with id=${id}. Maybe Record was not found or req.body is empty!`);
                        return res.redirect('back');
                    }
                })
                    .catch(err => {
                        req.flash('danger', 'Error updating Record with id=' + id);
                        return res.redirect('back');
                    });
            })
            .catch(error => {
                req.flash('danger', `${error}`);
                return res.redirect('back');
            });
    } catch (err) {
        req.flash('danger', 'An unexpected error occurred while attempting to status change the Record.');
        return res.redirect('back');
    }
};
