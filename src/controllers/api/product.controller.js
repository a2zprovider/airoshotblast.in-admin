const Product = require('../../schemas/product.js');
const Country = require('../../schemas/country.js');
const Category = require('../../schemas/category.js');

// Retrieve all Products from the database.
exports.findAll = async (req, res) => {
    const { page = 1, limit = 10, search, country, category } = req.query;
    const offset = (page - 1) * limit;
    let query = {};

    // Validate pagination parameters
    if (isNaN(page) || page <= 0) {
        return res.status(400).send({
            success: false,
            message: 'Invalid page number. It should be a positive integer.',
        });
    }

    if (isNaN(limit) || limit <= 0) {
        return res.status(400).send({
            success: false,
            message: 'Invalid limit value. It should be a positive integer.',
        });
    }

    // Handle search query if provided
    if (search) {
        query.title = { $regex: search, $options: 'i' };
    }

    // Handle country query if provided
    if (country) {
        try {
            const p_country = await Country.findOne({ code: country });
            if (p_country) {
                query.country = p_country._id;
            } else {
                return res.status(404).send({
                    success: false,
                    message: 'Country not found.',
                });
            }
        } catch (err) {
            console.error('Error fetching country:', err);
            return res.status(500).send({
                success: false,
                message: 'Error fetching country details.',
                error: err.message || err,
            });
        }
    }

    // Handle category query if provided
    if (category) {
        try {
            const p_category = await Category.findOne({ slug: category });
            if (p_category) {
                query.category = p_category._id;
            } else {
                return res.status(404).send({
                    success: false,
                    message: 'Category not found.',
                });
            }
        } catch (err) {
            console.error('Error fetching category:', err);
            return res.status(500).send({
                success: false,
                message: 'Error fetching category details.',
                error: err.message || err,
            });
        }
    }

    try {
        const products = await Product.find(query)
            .skip(offset)
            .limit(parseInt(limit))
            .populate(['category', 'country'])
            .exec();

        const count = await Product.find(query).countDocuments();

        let lists = {
            data: products,
            current: page,
            offset: offset,
            pages: Math.ceil(count / limit),
        };

        return res.status(200).send({
            success: true,
            message: `${count} Records Found`,
            data: lists,
        });
    } catch (err) {
        console.error('Error fetching products:', err);
        return res.status(500).send({
            success: false,
            message: 'Error occurred while fetching products.',
            error: err.message || 'An unexpected error occurred.',
        });
    }
};

// Find a single Product with a slug
exports.findOne = async (req, res) => {
    const slug = req.params.slug;

    try {
        const product = await Product.findOne({ slug: slug })
            .populate(['category', 'country'])
            .exec();

        if (!product) {
            return res.status(404).send({
                success: false,
                message: 'Product not found.',
            });
        }

        // Fetch related products if the product has a category
        if (product.category && product.category._id) {
            try {
                const relatedProducts = await Product.find({
                    category: product.category._id,
                    _id: { $ne: product._id },
                })
                    .populate(['category', 'country'])
                    .limit(4)
                    .exec();
                return res.status(200).send({
                    success: true,
                    message: 'Record Found',
                    data: product,
                    relatedProducts: relatedProducts,
                });
            } catch (err) {
                console.error('Error fetching related products:', err);
                return res.status(500).send({
                    success: false,
                    message: 'Error fetching related products.',
                    error: err.message || 'An unexpected error occurred.',
                });
            }
        } else {
            return res.status(200).send({
                success: true,
                message: 'Record Found',
                data: product,
                relatedProducts: [],
            });
        }
    } catch (err) {
        console.error('Error fetching product:', err);
        return res.status(500).send({
            success: false,
            message: 'Error occurred while fetching the product.',
            error: err.message || 'An unexpected error occurred.',
        });
    }
};
