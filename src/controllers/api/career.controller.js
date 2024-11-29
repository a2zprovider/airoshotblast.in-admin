const Career = require('../../schemas/career.js');

// Retrieve all Tag from the database.
exports.findAll = async (req, res) => {
    const { page = 1, limit = 10, search, country } = req.query;
    const offset = (page - 1) * limit;
    let query = {};

    if (search) {
        query.title = { $regex: new RegExp(search, 'i') };
    }

    try {
        const careers = await Career.find(query).skip(offset).limit(parseInt(limit)).exec();
        const count = await Career.find(query).countDocuments();

        let lists = {
            data: careers, current: page, offset: offset,
            pages: Math.ceil(count / limit)
        };
        res.status(200).send({ success: true, message: count + ' Records Found', data: lists });
    } catch (err) {
        res.status(500).send({ success: false, message: 'Internal Server Error', error: err });
    }
};

// Find a single Career with an slug
exports.findOne = async (req, res) => {
    const slug = req.params.slug;
    try {
        const career = await Career.findOne({ slug: slug });
        if (!career) {
            return res.status(404).send({ success: false, message: 'Career not found' });
        }
        res.status(200).send({ success: true, message: 'Record Found', data: career });
    } catch (err) {
        res.status(500).send({ success: false, message: 'Internal Server Error', error: err });
    }
};
