const Page = require('../../schemas/page.js');

// Retrieve all Pages from the database.
exports.findAll = async (req, res) => {
    const { page = 1, limit = 10, search, parent = null, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
    const offset = (page - 1) * limit;

    // Validate query parameters
    if (isNaN(page) || page <= 0) {
        return res.status(400).send({ success: false, message: 'Invalid page number.' });
    }
    if (isNaN(limit) || limit <= 0) {
        return res.status(400).send({ success: false, message: 'Invalid limit number.' });
    }

    let query = {};

    try {
        // Search filter
        if (search) {
            query.title = { $regex: search, $options: 'i' };
        }

        // Parent filter
        if (parent == 'null') {
            query.parent = null; // Fetch only parent pages
        } else if (parent) {
            const p = await Page.findOne({ slug: parent });
            if (!p) {
                return res.status(404).send({ success: false, message: 'Parent page not found.' });
            }
            query.parent = p._id;
        }

        const sort = {};
        sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
        // Query pages from the database
        const pages = await Page.find(query).skip(offset).limit(parseInt(limit)).exec();
        const count = await Page.find(query).countDocuments();

        // Prepare response data
        let lists = {
            data: pages,
            current: page,
            offset: offset,
            pages: Math.ceil(count / limit)
        };
        res.status(200).send({ success: true, message: `${count} Records Found`, data: lists });
    } catch (err) {
        // Log error details for better debugging
        console.error('Error fetching pages:', err);
        res.status(500).send({ success: false, message: 'Internal Server Error', error: err.message });
    }
};

// Find a single Page by slug
exports.findOne = async (req, res) => {
    const slug = req.params.slug;

    // Validate the slug
    if (!slug || typeof slug !== 'string') {
        return res.status(400).send({ success: false, message: 'Invalid slug parameter.' });
    }

    try {
        const page = await Page.findOne({ slug: slug });
        if (!page) {
            return res.status(404).send({ success: false, message: 'Page not found' });
        }
        res.status(200).send({ success: true, message: 'Record Found', data: page });
    } catch (err) {
        // Log the error for debugging
        console.error('Error fetching page:', err);
        res.status(500).send({ success: false, message: 'Internal Server Error', error: err.message });
    }
};
