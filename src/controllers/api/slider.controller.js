const Slider = require('../../schemas/slider.js');

// Retrieve all Slider from the database.
exports.findAll = async (req, res) => {
    const { page = 1, limit = 10, search } = req.query;
    const offset = (page - 1) * limit;
    let query = {};

    if (search) {
        query.title = { $regex: new RegExp(search, 'i') };
    }

    try {
        const sliders = await Slider.find(query).skip(offset).limit(parseInt(limit)).exec();
        const count = await Slider.find(query).countDocuments();

        let lists = {
            data: sliders, current: page, offset: offset,
            pages: Math.ceil(count / limit)
        };
        res.status(200).send({ success: true, message: count + ' Records Found', data: lists });
    } catch (err) {
        res.status(500).send({ success: false, message: 'Internal Server Error', error: err });
    }
};
