const Product = require('../../schemas/product.js');
const Category = require('../../schemas/category.js');
const Country = require('../../schemas/country.js');

const multer = require('multer');
const fs = require('fs');
const slugify = require('slugify');
const path = require('path');
const { log } = require('console');

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
        console.log('req : ', req);

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
    const id = req.params.id;
    Product.deleteOne({ _id: id })
        .then(num => {
            if (num.ok == 1) {
                req.flash('success', `Product deleted successfully!`);
                res.redirect('/product');
            } else {
                req.flash('danger', `Cannot delete Product with id=${id}. Maybe Product was not found!`);
                res.redirect('/product');
            }
        })
        .catch(err => {
            req.flash('danger', 'Could not delete Product with id=' + id);
            res.redirect('/product');
        });
};

// Delete all Products from the database.
exports.deleteAll = (req, res) => {
    Product.deleteMany({ _id: { $in: req.body.id } })
        .then(nums => {
            req.flash('success', `${nums.deletedCount} Products were deleted successfully!`);
            res.redirect('/product');
        })
        .catch(err => {
            req.flash('danger', err.message || 'Some error occurred while creating the Product.');
            res.redirect('/product');
        });
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
