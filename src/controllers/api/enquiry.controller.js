const Enquiry = require('../../schemas/enquiry.js');

// Create and Save a new Enquiry
exports.create = (req, res) => {
    try {
        // Create a Enquiry
        const enquiry = {};
        
        enquiry.name = req.body.name ? req.body.name : '';
        enquiry.email = req.body.email ? req.body.email : '';
        enquiry.mobile = req.body.mobile ? req.body.mobile : '';
        enquiry.subject = req.body.subject ? req.body.subject : '';
        enquiry.message = req.body.message ? req.body.message : '';

        // Save enquiry in the database
        Enquiry.create(enquiry)
            .then(data => {
                res.json({ success: true, message: 'We are working on your request and will get in touch as soon as possible. ' });
            })
            .catch(err => {
                res.status(500).json({ success: false, message: 'Some Error Found', error: err });
            });

    } catch (error) {
        res.status(500).json({ success: false, message: 'Internal Server Error', error: error });
    }
};
