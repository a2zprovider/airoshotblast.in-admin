const Setting = require('../../schemas/settings.js');

exports.findOne = async (req, res) => {
    try {
        // Attempt to find the setting from the database
        const setting = await Setting.findOne();

        // If no setting is found, return a 404 response
        if (!setting) {
            return res.status(404).send({
                success: false,
                message: 'Setting not found.',
            });
        }

        // If setting is found, return a 200 response with the setting data
        res.status(200).send({
            success: true,
            message: 'Record Found',
            data: setting,
        });
    } catch (err) {
        console.error('Error occurred while fetching setting:', err);

        // General error handling for any other unexpected errors
        return res.status(500).send({
            success: false,
            message: 'Internal Server Error: Something went wrong while fetching the setting.',
            error: err.message || 'An unexpected error occurred.',
        });
    }
};
