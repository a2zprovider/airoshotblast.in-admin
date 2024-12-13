const Video = require('../../schemas/video.js');

// Retrieve all Videos from the database.
exports.findAll = async (req, res) => {
    const { page = 1, limit = 10, search } = req.query;
    const offset = (page - 1) * limit;
    let query = {};

    // Validate pagination parameters
    if (isNaN(page) || page <= 0) {
        return res.status(400).send({
            success: false,
            message: 'Invalid page number. It should be a positive integer.',
        });
    }

    if (isNaN(limit) || limit <= 0) {
        return res.status(400).send({
            success: false,
            message: 'Invalid limit value. It should be a positive integer.',
        });
    }

    // Handle search query if provided
    if (search) {
        query.title = { $regex: search, $options: 'i' };
    }

    try {
        // Fetch videos from the database with pagination
        const videos = await Video.find(query)
            .skip(offset)
            .limit(parseInt(limit))
            .exec();

        // Get the total count of videos for pagination
        const count = await Video.find(query).countDocuments();

        let lists = {
            data: videos,
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
        console.error('Error occurred while fetching videos:', err);

        // General error handling for unexpected errors
        return res.status(500).send({
            success: false,
            message: 'Internal Server Error: Something went wrong while fetching videos.',
            error: err.message || 'An unexpected error occurred.',
        });
    }
};
