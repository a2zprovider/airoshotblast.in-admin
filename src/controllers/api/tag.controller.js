const Tag = require('../../schemas/tags.js');

// Retrieve all Tag from the database.
exports.findAll = async (req, res) => {
    const { page = 1, limit = 10, search } = req.query;
    const offset = (page - 1) * limit;
    let query = {};

    if (search) {
        query.title = { $regex: new RegExp(search, 'i') };
    }

    try {
        const tags = await Tag.find(query).skip(offset).limit(parseInt(limit)).exec();
        const count = await Tag.find(query).countDocuments();

        let lists = {
            data: tags, current: page, offset: offset,
            pages: Math.ceil(count / limit)
        };
        res.status(200).send({ success: true, message: count + ' Records Found', data: lists });
    } catch (err) {
        res.status(500).send({ success: false, message: 'Internal Server Error', error: err });
    }
};

// Find a single Tag with an slug
exports.findOne = async (req, res) => {
    const slug = req.params.slug;
    try {
        const tag = await Tag.findOne({ slug: slug });
        if (!tag) {
            return res.status(404).send({ success: false, message: 'Tag not found' });
        }
        res.status(200).send({ success: true, message: 'Record Found', data: tag });
    } catch (err) {
        res.status(500).send({ success: false, message: 'Internal Server Error', error: err });
    }
};
