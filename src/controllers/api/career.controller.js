const Career = require('../../schemas/career.js');
const Job = require('../../schemas/job.js');

const multer = require('multer');
const fs = require('fs');
const path = require('path');

const storage = multer.diskStorage({
    destination: function (req, res, callback) {
        var dir = "./src/public/upload/job";

        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir);
        }
        callback(null, dir);
    },
    filename: function (req, res, callback) {
        callback(null, res.fieldname + '-' + Date.now() + path.extname(res.originalname));
    }
})

const upload = multer({ storage: storage }).single('file');

// Retrieve all Tag from the database.
exports.findAll = async (req, res) => {
    const { page = 1, limit = 10, search, country } = req.query;
    const offset = (page - 1) * limit;
    let query = {};

    if (search) {
        query.title = { $regex: new RegExp(search, 'i') };
    }

    try {
        const careers = await Career.find(query).skip(offset).limit(parseInt(limit)).exec();
        const count = await Career.find(query).countDocuments();

        let lists = {
            data: careers, current: page, offset: offset,
            pages: Math.ceil(count / limit)
        };
        res.status(200).send({ success: true, message: count + ' Records Found', data: lists });
    } catch (err) {
        res.status(500).send({ success: false, message: 'Internal Server Error', error: err });
    }
};

// Find a single Career with an slug
exports.findOne = async (req, res) => {
    const slug = req.params.slug;
    try {
        const career = await Career.findOne({ slug: slug });
        if (!career) {
            return res.status(404).send({ success: false, message: 'Career not found' });
        }
        res.status(200).send({ success: true, message: 'Record Found', data: career });
    } catch (err) {
        res.status(500).send({ success: false, message: 'Internal Server Error', error: err });
    }
};

exports.job = (req, res) => {
    console.log('req : ', req);
    console.log('req file : ', req.file);
    console.log('req files : ', req.files);
    console.log('req body : ', req.body);
    try {
        upload(req, res, function (err) {

            if (err) {
                return res.status(500).json({ success: false, message: 'Some Error Found', error: err });
            }
            // Create a Job
            const job = {};

            console.log('req : ', req);
            console.log('req body : ', req.body);

            if (!req.file) {
                return res.status(200).json({ success: false, message: 'Please Select Resume' });
            } else {

                if (req.file) {
                    job.resume = req.file.filename;
                }
                // job.resume = req.file ? req.file.filename : '';
                job.career = req.body.career ? req.body.career : '';

                // Save job in the database
                Job.create(job)
                    .then(data => {
                        return res.json({ success: true, message: 'We are working on your request and will get in touch as soon as possible. ' });
                    })
                    .catch(err => {
                        return res.status(500).json({ success: false, message: 'Some Error Found', error: err });
                    });
            }
        })
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Internal Server Error', error: error });
    }
};
