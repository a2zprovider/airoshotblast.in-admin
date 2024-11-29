const Product = require('../../schemas/product.js');
const Country = require('../../schemas/country.js');
const Category = require('../../schemas/category.js');



// Retrieve all Products from the database.
exports.findAll = async (req, res) => {
    const { page = 1, limit = 10, search, country, category } = req.query;
    const offset = (page - 1) * limit;
    let query = {};

    if (search) {
        query.title = { $regex: new RegExp(search, 'i') };
    }
    if (country) {
        const p_country = await Country.findOne({ code: country });
        if (p_country) {
            query.country = p_country._id;
        }
    }
    if (category) {
        const p_category = await Category.findOne({ slug: category });
        if (p_category) {
            query.category = p_category._id;
        }
    }

    try {
        const Products = await Product.find(query).skip(offset).limit(parseInt(limit)).populate(['category', 'country']).exec();
        const count = await Product.find(query).populate(['category', 'country']).countDocuments();

        let lists = {
            data: Products, current: page, offset: offset,
            pages: Math.ceil(count / limit)
        };
        res.status(200).send({ success: true, message: count + ' Records Found', data: lists });
    } catch (err) {
        res.status(500).send({ success: false, message: 'Internal Server Error', error: err });
    }
};

// Find a single Product with an id
exports.findOne = async (req, res) => {
    const slug = req.params.slug;

    try {
        const product = await Product.findOne({ slug: slug }).populate(['category', 'country']);
        if (!product) {
            return res.status(404).send({ success: false, message: 'Product not found' });
        }
        if (product.category && product.category._id) {
            const relatedProducts = await Product.find({ category: product.category._id, _id: { $ne: product._id } }).populate(['category', 'country']).limit(4).exec();
            res.status(200).send({ success: true, message: 'Record Found', data: product, relatedProducts: relatedProducts });
        }else {
            const relatedProducts = [];
            res.status(200).send({ success: true, message: 'Record Found', data: product, relatedProducts: relatedProducts });
        }
    } catch (err) {
        res.status(500).send({ success: false, message: 'Internal Server Error', error: err });
    }
};

