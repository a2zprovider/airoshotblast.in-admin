const Page = require('../../schemas/page.js');

// Retrieve all Page from the database.
exports.findAll = async (req, res) => {
    const { page = 1, limit = 10, search, parent = null } = req.query;
    const offset = (page - 1) * limit;
    let query = {};

    if (search) {
        query.title = { $regex: new RegExp(search, 'i') };
    }
    if (parent == 'null') {
        query.parent = null; // Fetch only parent pages
    } else if (parent) {
        const p = await Page.findOne({ slug: parent });
        if (p) {
            query.parent = p._id;
        }
    }

    try {
        const pages = await Page.find(query).skip(offset).limit(parseInt(limit)).exec();
        const count = await Page.find(query).countDocuments();

        let lists = {
            data: pages, current: page, offset: offset,
            pages: Math.ceil(count / limit)
        };
        res.status(200).send({ success: true, message: count + ' Records Found', data: lists });
    } catch (err) {
        res.status(500).send({ success: false, message: 'Internal Server Error', error: err });
    }
};

// Find a single Page with an slug
exports.findOne = async (req, res) => {
    const slug = req.params.slug;
    try {
        const page = await Page.findOne({ slug: slug });
        if (!page) {
            return res.status(404).send({ success: false, message: 'Page not found' });
        }
        res.status(200).send({ success: true, message: 'Record Found', data: page });
    } catch (err) {
        res.status(500).send({ success: false, message: 'Internal Server Error', error: err });
    }
};
