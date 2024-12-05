const Video = require('../../schemas/video.js');

// Retrieve all Tag from the database.
exports.findAll = async (req, res) => {
    const { page = 1, limit = 10, search, country } = req.query;
    const offset = (page - 1) * limit;
    let query = {};

    if (search) {
        query.title = { $regex: new RegExp(search, 'i') };
    }

    try {
        const videos = await Video.find(query).skip(offset).limit(parseInt(limit)).exec();
        const count = await Video.find(query).countDocuments();

        let lists = {
            data: videos, current: page, offset: offset,
            pages: Math.ceil(count / limit)
        };
        res.status(200).send({ success: true, message: count + ' Records Found', data: lists });
    } catch (err) {
        res.status(500).send({ success: false, message: 'Internal Server Error', error: err });
    }
};

