const Enquiry = require('../../schemas/enquiry.js');

// Create and Save a new Enquiry
exports.create = async (req, res) => {
    try {
        // Validate input fields
        const { name, email, mobile, subject, message } = req.body;

        if (email) {
            // Optionally validate email format
            const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;
            if (!emailRegex.test(email)) {
                return res.status(400).send({
                    success: false,
                    message: 'Invalid email format.',
                });
            }
        }
        const enquiry = {};
        // Prepare the enquiry object
        enquiry.name = name ? name : '';
        enquiry.email = email ? email : '';
        enquiry.mobile = mobile ? mobile : '';
        enquiry.subject = subject ? subject : '';
        enquiry.message = message ? message : '';

        // Save enquiry in the database
        const createdEnquiry = await Enquiry.create(enquiry);

        return res.status(201).send({
            success: true,
            message: 'We are working on your request and will get in touch as soon as possible.',
            data: createdEnquiry,
        });
    } catch (err) {
        console.error('Error creating enquiry:', err);

        // Handle specific error cases (e.g., database errors, validation errors)
        if (err.name === 'ValidationError') {
            return res.status(400).send({
                success: false,
                message: 'Validation Error: Invalid data format.',
                error: err.message,
            });
        }

        // General error handling
        return res.status(500).send({
            success: false,
            message: 'Internal Server Error: Something went wrong while creating the enquiry.',
            error: err.message || 'An unexpected error occurred.',
        });
    }
};
