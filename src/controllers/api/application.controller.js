const Application = require('../../schemas/application.js');
const Country = require('../../schemas/country.js');

// Retrieve all Tag from the database.
exports.findAll = async (req, res) => {
    const { page = 1, limit = 10, search, country } = req.query;
    const offset = (page - 1) * limit;
    let query = {};

    if (search) {
        query.title = { $regex: new RegExp(search, 'i') };
    }
    if (country) {
        const p_country = await Country.findOne({ code: country });
        if (p_country) {
            query.country = p_country._id;
        }
    }

    try {
        const applications = await Application.find(query).skip(offset).limit(parseInt(limit)).populate('country').exec();
        const count = await Application.find(query).countDocuments();

        let lists = {
            data: applications, current: page, offset: offset,
            pages: Math.ceil(count / limit)
        };
        res.status(200).send({ success: true, message: count + ' Records Found', data: lists });
    } catch (err) {
        res.status(500).send({ success: false, message: 'Internal Server Error', error: err });
    }
};

// Find a single Application with an slug
exports.findOne = async (req, res) => {
    const slug = req.params.slug;
    try {
        const application = await Application.findOne({ slug: slug }).populate(['country']);
        if (!application) {
            return res.status(404).send({ success: false, message: 'Application not found' });
        }
        res.status(200).send({ success: true, message: 'Record Found', data: application });
    } catch (err) {
        res.status(500).send({ success: false, message: 'Internal Server Error', error: err });
    }
};
