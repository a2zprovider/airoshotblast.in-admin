const Blog = require('../../schemas/blog.js');
const Country = require('../../schemas/country.js');
const BlogCategory = require('../../schemas/blogcategory.js');

// Retrieve all Blogs from the database.
exports.findAll = async (req, res) => {

    const { page = 1, limit = 10, search, country, category, year } = req.query;
    const offset = (page - 1) * limit;
    let query = {};

    if (search) {
        query.title = { $regex: search, $options: 'i' };
    }
    if (country) {
        const p_country = await Country.findOne({ code: country });
        if (p_country) {
            query.country = p_country._id;
        }
    }
    if (category) {
        const blogcategory = await BlogCategory.findOne({ slug: category });
        if (blogcategory) {
            query.categories = { $in: blogcategory._id };
        }
    }
    if (year) {
        const startDate = new Date(`${year}-01-01T00:00:00.000Z`);
        const endDate = new Date(`${parseInt(year) + 1}-01-01T00:00:00.000Z`);
        query.createdAt = { $gte: startDate, $lt: endDate };
    }

    try {
        const blogs = await Blog.find(query).skip(offset).limit(parseInt(limit)).populate(['categories', 'country']).exec();
        const count = await Blog.find(query).populate(['categories', 'country']).countDocuments();
        
        let lists = {
            data: blogs, current: page, offset: offset,
            pages: Math.ceil(count / limit)
        };
        res.status(200).send({ success: true, message: count + ' Records Found', data: lists });
    } catch (err) {
        res.status(500).send({ success: false, message: 'Internal Server Error', error: err });
    }
};

// Find a single Blog with an slug
exports.findOne = async (req, res) => {
    const slug = req.params.slug;
    try {
        const blog = await Blog.findOne({ slug: slug }).populate(['tags', 'categories', 'country']);
        if (!blog) {
            return res.status(404).send({ success: false, message: 'Blog not found' });
        }
        const relatedBlogs = await Blog.find({ _id: { $ne: blog._id } }).limit(4).exec();
        res.status(200).send({ success: true, message: 'Record Found', data: blog, relatedBlogs: relatedBlogs });
    } catch (err) {
        res.status(500).send({ success: false, message: 'Internal Server Error', error: err });
    }
};
