const Enquiry = require('../../schemas/enquiry.js');

// Create and Save a new Enquiry
exports.create = (req, res) => {
    try {
        // Create a Enquiry
        const enquiry = {};

        if (!req.body.name) {
            res.status(200).json({ success: false, message: 'Please Enter Name' });
        } else if (!req.body.email) {
            res.status(200).json({ success: false, message: 'Please Enter Email' });
        } else if (!req.body.message) {
            res.status(200).json({ success: false, message: 'Please Enter Message' });
        } else {

            enquiry.name = req.body.name ? req.body.name : '';
            enquiry.email = req.body.email ? req.body.email : '';
            enquiry.mobile = req.body.mobile ? req.body.mobile : '';
            enquiry.subject = req.body.subject ? req.body.subject : '';
            enquiry.message = req.body.message ? req.body.message : '';

            // Save enquiry in the database
            Enquiry.create(enquiry)
                .then(data => {
                    res.json({ success: true, message: 'Enquiry created successfully!' });
                })
                .catch(err => {
                    res.status(500).json({ success: false, message: 'Some Error Found', error: err });
                });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: 'Internal Server Error', error: error });
    }
};
