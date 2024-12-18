const Category = require('../../schemas/category.js');
const Product = require('../../schemas/product.js');

// Retrieve all Category from the database.
exports.findAll = async (req, res) => {
    const { page = 1, limit = 10, search, parent } = req.query;
    const offset = (page - 1) * limit;
    let query = {};

    if (search) {
        query.title = { $regex: search, $options: 'i' };
    }
    if (parent) {
        try {
            // Parent filter
            if (parent == 'null') {
                query.parent = null; // Fetch only parent pages
            } else if (parent) {
                const p_category = await Category.findOne({ slug: parent });
                if (p_category) {
                    query.parent = p_category._id;
                } else {
                    return res.status(404).send({
                        success: false,
                        message: `Category with slug '${parent}' not found`,
                    });
                }
            }
        } catch (error) {
            console.error(`Error fetching category with slug '${parent}':`, error);
            return res.status(500).send({
                success: false,
                message: 'Internal Server Error: Error fetching parent category.',
                error: error.message,
            });
        }
    }

    try {
        const categories = await Category.find(query).skip(offset).limit(parseInt(limit)).populate('parent').exec();
        const count = await Category.find(query).countDocuments();

        const categoriesWithProducts = await Promise.all(
            categories.map(async (cat) => {
                const categoryObj = cat.toObject ? cat.toObject() : cat;

                try {
                    // Fetch products for each category
                    const products = await Product.find({
                        category: categoryObj._id, // Ensure category._id is used correctly
                    }).populate(['category', 'country']).limit(12).exec();

                    // Add products to category object
                    categoryObj.products = products;

                    // Fetch subcategory for each category
                    const subcategory = await Category.find({ parent: categoryObj._id });

                    // Add subcategory to category object
                    categoryObj.subcategory = subcategory;

                    return categoryObj; // Return the updated category object with products
                } catch (error) {
                    console.error(`Error fetching products for category ${categoryObj._id}:`, error);
                    categoryObj.products = []; // Fallback value
                    categoryObj.subcategory = []; // Fallback value
                    return categoryObj;
                }
            })
        );

        let lists = {
            data: categoriesWithProducts,
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
        console.error('Error fetching categories:', err);
        return res.status(500).send({
            success: false,
            message: 'Internal Server Error: Error fetching categories.',
            error: err.message || 'An error occurred while fetching categories.',
        });
    }
};

// Find a single Category with a slug
exports.findOne = async (req, res) => {
    const slug = req.params.slug;

    try {
        const category = await Category.findOne({ slug: slug }).populate('parent');
        if (!category) {
            return res.status(404).send({
                success: false,
                message: `Category with slug '${slug}' not found`,
            });
        }

        // Fetch products related to the found category
        const products = await Product.find({
            category: category._id, // Ensure category._id is accessible
        }).populate(['category', 'country']);

        return res.status(200).send({
            success: true,
            message: 'Category and products found successfully',
            data: category,
            products: products,
        });
    } catch (err) {
        console.error(`Error fetching category with slug '${slug}':`, err);
        return res.status(500).send({
            success: false,
            message: 'Internal Server Error: Error fetching category details.',
            error: err.message || 'An error occurred while fetching category details.',
        });
    }
};
