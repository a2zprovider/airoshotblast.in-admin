const Application = require('../../schemas/application.js');
const Country = require('../../schemas/country.js');

// Retrieve all Applications from the database.
exports.findAll = async (req, res) => {
    const { page = 1, limit = 10, search, country, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
    const offset = (page - 1) * limit;
    let query = {};

    try {
        // Search by title if provided
        if (search) {
            query.title = { $regex: search, $options: 'i' };
        }

        // Filter by country code if provided
        if (country) {
            const p_country = await Country.findOne({ code: country });
            if (p_country) {
                query.country = p_country._id;
            } else {
                return res.status(400).send({ success: false, message: 'Invalid country code' });
            }
        }

        const sort = {};
        sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
        // Fetch applications with pagination
        const applications = await Application.find(query).sort(sort).skip(offset).limit(parseInt(limit)).populate('country').exec();
        const count = await Application.find(query).countDocuments();

        const lists = {
            data: applications, current: page, offset: offset,
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

// Find a single Application with a slug
exports.findOne = async (req, res) => {
    const slug = req.params.slug;
    try {
        const application = await Application.findOne({ slug: slug }).populate('country');

        if (!application) {
            return res.status(404).send({ success: false, message: 'Application not found' });
        }

        return res.status(200).send({
            success: true,
            message: 'Record Found',
            data: application,
        });

    } catch (err) {
        // Send a generic error message to the client
        return res.status(500).send({ success: false, message: 'Internal Server Error' });
    }
};
