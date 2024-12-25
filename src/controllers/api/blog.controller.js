const Blog = require('../../schemas/blog.js');
const Country = require('../../schemas/country.js');
const BlogCategory = require('../../schemas/blogcategory.js');

// Retrieve all Blogs from the database.
exports.findAll = async (req, res) => {

    const { page = 1, limit = 10, search, country, category, year, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
    const offset = (page - 1) * limit;
    let query = {};

    try {
        // Search filter
        if (search) {
            query.title = { $regex: search, $options: 'i' };
        }

        // Country filter
        if (country) {
            const p_country = await Country.findOne({ code: country });
            if (!p_country) {
                return res.status(400).send({ success: false, message: 'Invalid country code' });
            }
            query.country = p_country._id;
        }

        // Category filter
        if (category) {
            const blogcategory = await BlogCategory.findOne({ slug: category });
            if (!blogcategory) {
                return res.status(400).send({ success: false, message: 'Invalid category slug' });
            }
            query.categories = { $in: blogcategory._id };
        }

        // Year filter
        if (year) {
            // Validate year format
            const yearInt = parseInt(year);
            if (isNaN(yearInt)) {
                return res.status(400).send({ success: false, message: 'Invalid year format' });
            }
            const startDate = new Date(`${year}-01-01T00:00:00.000Z`);
            const endDate = new Date(`${yearInt + 1}-01-01T00:00:00.000Z`);
            query.createdAt = { $gte: startDate, $lt: endDate };
        }

        const sort = {};
        sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
        // Fetch blogs with filters, pagination, and population of related fields
        const blogs = await Blog.find(query).sort(sort).skip(offset).limit(parseInt(limit)).populate(['categories', 'country']).exec();
        const count = await Blog.find(query).countDocuments();

        let lists = {
            data: blogs, current: page, offset: offset,
            pages: Math.ceil(count / limit),
        };

        return res.status(200).send({
            success: true,
            message: `${count} Records Found`,
            data: lists,
        });

    } catch (err) {
        // Send generic error message to the client
        return res.status(500).send({ success: false, message: 'Internal Server Error' });
    }
};


// Find a single Blog with a slug
exports.findOne = async (req, res) => {
    const slug = req.params.slug;
    try {
        const blog = await Blog.findOne({ slug: slug }).populate(['tags', 'categories', 'country']);
        if (!blog) {
            return res.status(404).send({ success: false, message: 'Blog not found' });
        }
        console.log('blog : ', blog.createdAt);

        // Step 1: Check if createdAt is in the correct format (string) and convert it to Date if needed
        let updatedCreatedAt = blog.createdAt;
        if (typeof updatedCreatedAt === 'string') {
            updatedCreatedAt = new Date(updatedCreatedAt.replace(' ', 'T'));  // Convert to ISO format if needed
        }

        // Step 2: Remove the createdAt field first using $unset
        // const removeResult = await Blog.updateOne(
        //     { _id: blog._id },
        //     { $unset: { createdAt: "" } }
        // );
        // console.log('Removed createdAt field:', removeResult);

        // Step 3: Now, set the updated createdAt field as a Date using $set
        const updateResult = await Blog.updateOne(
            { _id: blog._id },
            { $set: { createdAt: updatedCreatedAt } }
        );
        console.log('Updated createdAt field:', updateResult);

        // Step 4: Fetch related blogs
        const relatedBlogs = await Blog.find({ _id: { $ne: blog._id } }).limit(4).exec();

        res.status(200).send({
            success: true,
            message: 'Record Found',
            data: blog,
            relatedBlogs: relatedBlogs
        });

    } catch (err) {
        console.log('Error in updating blog:', err);
        return res.status(500).send({ success: false, message: 'Internal Server Error' });
    }
};

