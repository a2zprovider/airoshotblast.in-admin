const Tag = require('../../schemas/tags.js');
const Blog = require('../../schemas/blog.js');

// Retrieve all Tags from the database.
exports.findAll = async (req, res) => {
    const { page = 1, limit = 10, search } = req.query;
    const offset = (page - 1) * limit;
    let query = {};

    // Validate pagination parameters
    if (isNaN(page) || page <= 0) {
        return res.status(400).json({
            success: false,
            message: 'Invalid page number. It should be a positive integer.',
        });
    }

    if (isNaN(limit) || limit <= 0) {
        return res.status(400).json({
            success: false,
            message: 'Invalid limit value. It should be a positive integer.',
        });
    }

    // Handle search query if provided
    if (search) {
        query.title = { $regex: search, $options: 'i' };
    }

    try {
        // Fetch tags from the database with pagination
        const tags = await Tag.find(query)
            .skip(offset)
            .limit(parseInt(limit))
            .exec();

        // Get the total count of tags for pagination
        const count = await Tag.find(query).countDocuments();

        let lists = {
            data: tags,
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
        console.error('Error occurred while fetching tags:', err);

        // General error handling for unexpected errors
        return res.status(500).send({
            success: false,
            message: 'Internal Server Error: Something went wrong while fetching tags.',
            error: err.message || 'An unexpected error occurred.',
        });
    }
};

// Find a single Tag with a slug
exports.findOne = async (req, res) => {
    const slug = req.params.slug;

    try {
        const tag = await Tag.findOne({ slug: slug });
        if (!tag) {
            return res.status(404).send({ success: false, message: 'Tag not found' });
        }

        // Fetch the blogs associated with the tag
        const blogs = await Blog.find({
            tags: tag._id, // Make sure tag._id is accessible
        }).exec();

        res.status(200).send({ success: true, message: 'Record Found', data: tag, blogs: blogs });
    } catch (err) {
        console.error(`Error occurred while fetching tag ${slug}:`, err);

        // General error handling for unexpected errors
        return res.status(500).send({
            success: false,
            message: 'Internal Server Error: Something went wrong while fetching the tag.',
            error: err.message || 'An unexpected error occurred.',
        });
    }
};
