const Product = require('../../schemas/product.js');
const Category = require('../../schemas/category.js');
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
            var dir = "./src/public/upload/product";
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir);
            }
            callback(null, dir);
        }
        else if (res.fieldname === "thumb_image") {
            var dir = "./src/public/upload/product/thumb";
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir);
            }
            callback(null, dir);
        }
        else if (res.fieldname === "images") {
            var dir = "./src/public/upload/product/imgs";
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
        else if (res.fieldname === "images") {
            callback(null, res.fieldname + '-' + Date.now() + Math.random().toString().substr(2, 6) + path.extname(res.originalname));
        }
    }
})

const upload = multer({ storage: storage }).fields([{ name: 'image', maxCount: 1 }, { name: 'thumb_image', maxCount: 1 }, { name: 'images' }]);

// Create a new Product Page
exports.add = async (req, res) => {

    const categories = await Category.find();
    const countries = await Country.find();

    const user = req.cookies['user'];

    const success = req.flash('success');
    const danger = req.flash('danger');
    const info = req.flash('info');

    res.render('pages/product/add', { user, success, danger, info, categories, countries, page_title: 'Product Add', page_url: 'product.add' });
};

// Create and Save a new Product
exports.create = (req, res) => {

    // Create a Product
    upload(req, res, function (err) {
        const product = {};
        if (err) {
            res.redirect('/product/create');
        }

        if (!req.body.title) {
            req.flash('danger', 'Please enter title.');
            res.redirect('/product/create');
        }
        if (!req.body.description) {
            req.flash('danger', 'Please enter description.');
            res.redirect('/product/create');
        }

        product.title = req.body.title;
        product.slug = req.body.slug ? slugify(req.body.slug, { lower: true }) : slugify(req.body.title, { lower: true });
        product.except = req.body.except;
        product.description = req.body.description;
        product.application = req.body.application;
        if (req.body.category) {
            product.category = req.body.category;
        }
        product.price = req.body.price;
        product.field = req.body.field ? JSON.stringify(req.body.field) : '{"name":[],"value":[]}';
        product.field1 = req.body.field1 ? JSON.stringify(req.body.field1) : '{"name":[],"value":[]}';
        product.country = req.body.country;

        product.seo_title = req.body.seo_title;
        product.seo_keywords = req.body.seo_keywords;
        product.seo_description = req.body.seo_description;

        if (req.files && req.files.image) {
            product.image = req.files.image[0].filename;
        }
        if (req.files && req.files.thumb_image) {
            product.thumb_image = req.files.thumb_image[0].filename;
        }
        if (req.files && req.files.images) {
            var imgs = [];
            req.files.images.forEach(element => {
                imgs.push(element.filename);
            });
            product.images = JSON.stringify(imgs);
        }
        // Save Product in the database
        Product.create(product)
            .then(data => {
                req.flash('success', `Product created successfully!`);
                res.redirect('/product');
            })
            .catch(err => {
                req.flash('danger', err.message || 'Some error occurred while creating the Product.');
                res.redirect('/product/create');
            });
    })

};

// Retrieve all Products from the database.
exports.findAll = (req, res) => {
    const limit = parseInt(req.query.limit) || 10;
    const page = parseInt(req.query.page) || 1;
    const offset = (page - 1) * limit;
    const user = req.cookies['user'];
    const query = req.query;

    const success = req.flash('success');
    const danger = req.flash('danger');
    const info = req.flash('info');

    const search = req.query.search || ''; // Default to empty string if no search term

    // Use text search condition only if search is provided
    const condition = search ? { title: { $regex: search, $options: 'i' } } : {};

    Product.count(condition).then(count => {
        Product.find(condition)
            .skip(offset)
            .limit(limit)
            .populate('category')
            .exec()
            .then(data => {
                res.render('pages/product/list', {
                    lists: {
                        data: data,
                        current: page,
                        offset: offset,
                        pages: Math.ceil(count / limit)
                    },
                    query: query,
                    user,
                    success,
                    danger,
                    info,
                    page_title: 'Product List',
                    page_url: 'product.list',
                    url: req.pathname
                });
            })
            .catch(err => {
                req.flash('danger', err.message || 'Some error occurred while retrieving the Product data.');
                res.redirect('/product');
            });
    }).catch(err => {
        req.flash('danger', err.message || 'Some error occurred while counting the Products.');
        res.redirect('/product');
    });
};

// Find a single Product with an id
exports.findOne = (req, res) => {
    const id = req.params.id;
    Product.findOne({ _id: id })
        .then(data => {
            if (data) {
                return res.send({ data: data });
            } else {
                return res.status(404).send({
                    message: `Cannot find Product with id=${id}.`
                });
            }
        })
        .catch(err => {
            return res.status(500).send({
                message: "Error retrieving Product with id=" + id
            });
        });
};

exports.edit = async (req, res) => {
    const user = req.cookies['user'];

    const success = req.flash('success');
    const danger = req.flash('danger');
    const info = req.flash('info');
    const categories = await Category.find();
    const countries = await Country.find();

    const id = req.params.id;
    Product.findOne({ _id: id })
        .then(data => {
            if (data) {
                res.render('pages/product/edit', {
                    list: data, user, success, danger, info, categories, countries, page_title: 'Product Edit', page_url: 'product.edit'
                });
            } else {
                req.flash('danger', `Cannot find Product with id=${id}.`);
                res.redirect('/product');
            }
        })
        .catch(err => {
            req.flash('danger', 'Error updating Product with id=' + id);
            res.redirect('/product');
        });
};

// Update a Product by the id in the request
exports.update = async (req, res) => {
    const id = req.params.id;
    const product_details = await Product.findOne({ _id: id });
    const images = product_details.images ? JSON.parse(product_details.images) : null;
    upload(req, res, function (err) {
        if (err) {
            res.redirect('/product/edit/' + id);
        }

        const product_detail = {};

        product_detail.title = req.body.title;
        product_detail.slug = req.body.slug ? slugify(req.body.slug, { lower: true }) : slugify(req.body.title, { lower: true });
        product_detail.except = req.body.except;
        product_detail.description = req.body.description;
        product_detail.application = req.body.application;
        if (req.body.category) {
            product_detail.category = req.body.category;
        }
        product_detail.price = req.body.price;
        product_detail.field = req.body.field ? JSON.stringify(req.body.field) : '{"name":[],"value":[]}';
        product_detail.field1 = req.body.field1 ? JSON.stringify(req.body.field1) : '{"name":[],"value":[]}';
        product_detail.country = req.body.country;

        product_detail.seo_title = req.body.seo_title;
        product_detail.seo_keywords = req.body.seo_keywords;
        product_detail.seo_description = req.body.seo_description;

        if (req.files && req.files.image) {
            product_detail.image = req.files.image[0].filename;
        }
        if (req.files && req.files.thumb_image) {
            product_detail.thumb_image = req.files.thumb_image[0].filename;
        }
        if (req.files && req.files.images) {
            var imgs = [];
            if (images) {
                images.forEach(element => {
                    imgs.push(element);
                });
            }
            req.files.images.forEach(element => {
                imgs.push(element.filename);
            });
            product_detail.images = JSON.stringify(imgs);
        }
        Product.updateOne({ _id: id }, { $set: product_detail }).then(num => {
            if (num.ok == 1) {
                req.flash('success', `Product updated successfully!`);
                res.redirect('/product');
            } else {
                req.flash('danger', `Cannot update Product with id=${id}. Maybe Product was not found or req.body is empty!`);
                res.redirect('/product/edit/' + id);
            }
        })
            .catch(err => {
                req.flash('danger', 'Error updating Product with id=' + id);
                res.redirect('/product/edit/' + id);
            });

    })
};

// Delete a Product with the specified id in the request
exports.delete = (req, res) => {
    try {
        const id = req.params.id;

        // Validate the Product ID
        if (!id || !mongoose.Types.ObjectId.isValid(id)) {
            req.flash('danger', 'Invalid Product ID.');
            logger.warn(`Attempt to delete with invalid ID: ${id}`);
            return res.redirect('/product');
        }

        // Proceed to delete the product
        Product.deleteOne({ _id: id })
            .then(result => {
                if (result.deletedCount === 1) {
                    // Successful deletion
                    req.flash('success', `Product deleted successfully!`);
                    res.redirect('/product');
                } else {
                    // No document was deleted (Product not found)
                    req.flash('danger', `Cannot delete Product with id=${id}. Maybe the Product was not found!`);
                    logger.warn(`Product with ID ${id} not found for deletion.`);
                    res.redirect('/product');
                }
            })
            .catch(err => {
                // Log and handle errors from the database
                logger.error(`Error occurred while deleting Product with ID ${id} - ${err.message || 'Unknown error'}`);
                req.flash('danger', `Could not delete Product with id=${id}. Please try again later.`);
                res.redirect('/product');
            });
    } catch (err) {
        // Catch unexpected errors and log them
        logger.error(`Unexpected error during delete operation for Product with ID ${req.params.id} - ${err.message || 'Unknown error'}`);
        req.flash('danger', 'An unexpected error occurred while attempting to delete the Product.');
        res.redirect('/product');
    }
};

// Delete all Product from the database.
exports.deleteAll = (req, res) => {
    try {
        // Validate the ID array
        if (!req.body.id || !Array.isArray(req.body.id) || req.body.id.length === 0) {
            req.flash('danger', 'No product IDs provided for deletion.');
            logger.warn('No product IDs provided for deletion.');
            return res.redirect('/product');
        }

        // Validate each ID in the array
        const invalidIds = req.body.id.filter(id => !mongoose.Types.ObjectId.isValid(id));
        if (invalidIds.length > 0) {
            req.flash('danger', `Invalid product IDs: ${invalidIds.join(', ')}`);
            logger.warn(`Invalid product IDs: ${invalidIds.join(', ')}`);
            return res.redirect('/product');
        }

        // Proceed with deletion
        Product.deleteMany({ _id: { $in: req.body.id } })
            .then(nums => {
                if (nums.deletedCount > 0) {
                    req.flash('success', `${nums.deletedCount} Product(s) were deleted successfully!`);
                    logger.info(`${nums.deletedCount} Product(s) deleted successfully.`);
                } else {
                    req.flash('danger', 'No Products were deleted. Please check if the products exist.');
                    logger.warn('No Products were deleted, either due to non-existence or invalid IDs.');
                }
                res.redirect('/product');
            })
            .catch(err => {
                // Log the error and provide a user-friendly message
                logger.error(`Error deleting products: ${err.message || 'Unknown error'}`);
                req.flash('danger', err.message || 'Some error occurred while deleting the Products.');
                res.redirect('/product');
            });

    } catch (err) {
        // Catch any unexpected errors
        logger.error(`Unexpected error occurred while deleting products: ${err.message || 'Unknown error'}`);
        req.flash('danger', err.message || 'An unexpected error occurred while deleting the Products.');
        res.redirect('/product');
    }
};

// Delete a Product imgs with the specified id in the request
exports.imgDelete = async (req, res) => {
    const id = req.params.id;
    const index = req.params.index;

    const product_details = await Product.findOne({ _id: id });
    const images = JSON.parse(product_details.images);

    var filePath = './src/public/upload/product/imgs/' + images[index];
    fs.unlinkSync(filePath);

    images.splice(index, 1);

    var product_imgs = JSON.stringify(images);
    let product_detail = {};
    product_detail.images = product_imgs;

    Product.updateOne({ _id: id }, { $set: product_detail }).then(num => {
        if (num.ok == 1) {
            req.flash('success', `Image deleted successfully!`);
            res.redirect('back');
        } else {
            res.redirect('back');
        }
    })
        .catch(err => {
            res.redirect('back');
        });
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

        Product.findOne({ _id: id })
            .then(r_detail => {
                console.log(r_detail);
                const record_detail = {};
                record_detail.showStatus = !r_detail.showStatus;

                Product.updateOne({ _id: id }, { $set: record_detail }).then(num => {
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
