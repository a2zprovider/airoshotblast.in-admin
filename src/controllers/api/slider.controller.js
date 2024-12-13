const Slider = require('../../schemas/slider.js');

// Retrieve all Sliders from the database.
exports.findAll = async (req, res) => {
    const { page = 1, limit = 10, search } = req.query;
    const offset = (page - 1) * limit;
    let query = {};

    // Validate pagination parameters to ensure they're valid integers
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
        // Fetch sliders from the database with pagination
        const sliders = await Slider.find(query)
            .skip(offset)
            .limit(parseInt(limit))
            .exec();

        // Get the total count of sliders for pagination
        const count = await Slider.find(query).countDocuments();

        let lists = {
            data: sliders,
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
        console.error('Error occurred while fetching sliders:', err);

        // General error handling for unexpected errors
        return res.status(500).send({
            success: false,
            message: 'Internal Server Error: Something went wrong while fetching sliders.',
            error: err.message || 'An unexpected error occurred.',
        });
    }
};
