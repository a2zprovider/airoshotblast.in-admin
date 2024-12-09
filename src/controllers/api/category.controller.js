const Category = require('../../schemas/category.js');
const Product = require('../../schemas/product.js');

// Retrieve all Category from the database.
exports.findAll = async (req, res) => {
    const { page = 1, limit = 10, search, category } = req.query;
    const offset = (page - 1) * limit;
    let query = {};

    if (search) {
        query.title = { $regex: new RegExp(search, 'i') };
    }
    if (category) {
        const p_category = await Category.findOne({ slug: category });
        if (p_category) {
            query.parent = p_category._id;
        }
    }

    try {
        const categories = await Category.find(query).skip(offset).limit(parseInt(limit)).populate('parent').exec();
        const count = await Category.find(query).countDocuments();

        const categoriesWithProducts = await Promise.all(
            categories.map(async (category) => {
                const categoryObj = category.toObject ? category.toObject() : category;

                try {
                    // Fetch the blog count for each category
                    const products = await Product.find({
                        category: categoryObj._id, // Make sure category._id is accessible
                    }).populate(['category', 'country']).limit(12).exec();

                    // Add the blogCount to the category object
                    categoryObj.products = products;
                    // console.log('category with blog count:', categoryObj);

                    return categoryObj; // Return the updated object
                } catch (error) {
                    console.error(`Error fetching blog count for category ${categoryObj._id}:`, error);
                    // In case of an error, return the category without blog count
                    categoryObj.products = []; // Fallback value
                    return categoryObj;
                }
            })
        );

        let lists = {
            data: categoriesWithProducts, current: page, offset: offset,
            pages: Math.ceil(count / limit)
        };
        res.status(200).send({ success: true, message: count + ' Records Found', data: lists });
    } catch (err) {
        res.status(500).send({ success: false, message: 'Internal Server Error', error: err });
    }
};

// Find a single Category with an slug
exports.findOne = async (req, res) => {
    const slug = req.params.slug;
    try {
        const category = await Category.findOne({ slug: slug }).populate('parent');
        if (!category) {
            return res.status(404).send({ success: false, message: 'Category not found' });
        }

        const products = await Product.find({
            category: category._id, // Make sure category._id is accessible
        }).populate(['category', 'country']);
        res.status(200).send({ success: true, message: 'Record Found', data: category, products: products });
    } catch (err) {
        res.status(500).send({ success: false, message: 'Internal Server Error', error: err });
    }
};
