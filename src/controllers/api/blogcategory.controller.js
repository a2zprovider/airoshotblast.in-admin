const BlogCategory = require('../../schemas/blogcategory.js');
const Blog = require('../../schemas/blog.js');

// Retrieve all Blog Categories from the database.
exports.findAll = async (req, res) => {
    const { page = 1, limit = 10, search, category, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
    const offset = (page - 1) * limit;
    let query = {};

    try {
        // Validate page and limit
        if (isNaN(page) || page <= 0) {
            return res.status(400).send({ success: false, message: 'Invalid page number' });
        }
        if (isNaN(limit) || limit <= 0) {
            return res.status(400).send({ success: false, message: 'Invalid limit number' });
        }

        // Search filter
        if (search) {
            query.title = { $regex: search, $options: 'i' };
        }

        // Category filter
        if (category) {
            const p_category = await BlogCategory.findOne({ slug: category });
            if (!p_category) {
                return res.status(400).send({ success: false, message: 'Invalid category slug' });
            }
            query.parent = p_category._id;
        }
        query.showStatus = true;

        const sort = {};
        sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
        // Fetch categories with pagination and population
        const categories = await BlogCategory.find(query).sort(sort).skip(offset).limit(parseInt(limit)).populate('parent').exec();
        const count = await BlogCategory.find(query).countDocuments();

        // Fetch the blog count for each category
        const categoriesWithBlogCount = await Promise.all(
            categories.map(async (category) => {
                const categoryObj = category.toObject ? category.toObject() : category;

                try {
                    const blogCount = await Blog.countDocuments({
                        categories: categoryObj._id, // Ensure category._id is accessible
                    });

                    categoryObj.blogCount = blogCount;
                    return categoryObj;
                } catch (error) {
                    console.error(`Error fetching blog count for category ${categoryObj._id}:`, error);
                    categoryObj.blogCount = 0; // Fallback to 0 if an error occurs
                    return categoryObj;
                }
            })
        );

        let lists = {
            data: categoriesWithBlogCount, current: page, offset: offset,
            pages: Math.ceil(count / limit),
        };

        res.status(200).send({
            success: true,
            message: `${count} Records Found`,
            data: lists,
        });
    } catch (err) {
        console.error('Error fetching categories:', err);
        res.status(500).send({ success: false, message: 'Internal Server Error', error: err.message });
    }
};

// Find a single Blog Category with a slug
exports.findOne = async (req, res) => {
    const slug = req.params.slug;

    try {
        // Validate slug parameter
        if (!slug) {
            return res.status(400).send({ success: false, message: 'Category slug is required' });
        }

        const category = await BlogCategory.findOne({ slug: slug }).populate('parent');
        if (!category) {
            return res.status(404).send({ success: false, message: 'Category not found' });
        }

        const blogs = await Blog.find({
            categories: category._id, showStatus: true // Ensure category._id is accessible
        });

        res.status(200).send({
            success: true,
            message: 'Record Found',
            data: category,
            blogs: blogs,
        });
    } catch (err) {
        console.error(`Error fetching category with slug ${slug}:`, err);
        res.status(500).send({ success: false, message: 'Internal Server Error', error: err.message });
    }
};
