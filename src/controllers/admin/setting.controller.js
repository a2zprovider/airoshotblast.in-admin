const Setting = require('../../schemas/settings.js');

const multer = require('multer');
const fs = require('fs');
const slugify = require('slugify');
const path = require('path');
const mongoose = require('mongoose');
const logger = require('../../logger.js');

const storage = multer.diskStorage({
    destination: function (req, res, callback) {
        if (res.fieldname === "logo") {
            var dir = "./src/public/upload/setting/logo";
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir);
            }
            callback(null, dir);
        } else if (res.fieldname === "logo2") {
            var dir = "./src/public/upload/setting/logo2";
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir);
            }
            callback(null, dir);
        } else if (res.fieldname === "favicon") {
            var dir = "./src/public/upload/setting/favicon";
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir);
            }
            callback(null, dir);
        } else if (res.fieldname === "brochure") {
            var dir = "./src/public/upload/setting/brochure";
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir);
            }
            callback(null, dir);
        }

    },
    filename: function (req, res, callback) {
        if (res.fieldname === "logo") {
            callback(null, res.fieldname + path.extname(res.originalname));
        } else if (res.fieldname === "logo2") {
            callback(null, res.fieldname + path.extname(res.originalname));
        } else if (res.fieldname === "favicon") {
            callback(null, res.fieldname + path.extname(res.originalname));
        } else if (res.fieldname === "brochure") {
            callback(null, res.fieldname + path.extname(res.originalname));
        }
    }
})

const upload = multer({ storage: storage }).fields([{ name: 'logo', maxCount: 1 }, { name: 'logo2', maxCount: 1 }, { name: 'favicon', maxCount: 1 }, { name: 'brochure', maxCount: 1 }]);

exports.edit = (req, res) => {
    const user = req.cookies['user'];

    const success = req.flash('success');
    const danger = req.flash('danger');
    const info = req.flash('info');

    Setting.count().then(count => {
        if (count < 1) {
            const s = {};
            s.title = 'Admin Panel';
            const p = Setting.create(s);
            res.redirect('/setting');
        }
    });
    Setting.findOne()
        .then(data => {
            if (data) {
                res.render('pages/setting/edit', {
                    list: data,
                    user,
                    success,
                    danger,
                    info,
                    page_title: 'Setting',
                    page_url: 'setting'
                });
            } else {
                req.flash('danger', `Cannot find Setting with id=${id}.`);
                res.redirect('/setting');
            }
        })
        .catch(err => {
            req.flash('danger', 'Error updating Setting');
            res.redirect('/setting');
        });
};

exports.update = async (req, res) => {
    const id = req.params.id;
    upload(req, res, function (err) {
        if (err) {
            res.redirect('/setting');
        }

        const setting_detail = {};

        setting_detail.title = req.body.title;
        setting_detail.tagline = req.body.tagline;
        setting_detail.address = req.body.address;
        setting_detail.map = req.body.map;
        setting_detail.except = req.body.except;
        setting_detail.description = req.body.description;
        setting_detail.email = req.body.email;
        setting_detail.mobile = req.body.mobile;
        setting_detail.social_links = req.body.social_links ? JSON.stringify(req.body.social_links) : '{"facebook":"","instagram":"","pinterest":"","youtube":"","linkedin":"","whatsapp":""}';
        setting_detail.seo_details = req.body.seo_details ? JSON.stringify(req.body.seo_details) : '';
        setting_detail.other_details = req.body.other_details ? JSON.stringify(req.body.other_details) : '';

        if (req.files && req.files.logo) {
            setting_detail.logo = req.files.logo[0].filename;
        }
        if (req.files && req.files.logo2) {
            setting_detail.logo2 = req.files.logo2[0].filename;
        }
        if (req.files && req.files.favicon) {
            setting_detail.favicon = req.files.favicon[0].filename;
        }
        if (req.files && req.files.brochure) {
            setting_detail.brochure = req.files.brochure[0].filename;
        }

        Setting.updateOne({ _id: id }, { $set: setting_detail }).then(num => {
            if (num.ok == 1) {
                req.flash('success', `Setting updated successfully!`);
                res.redirect('/setting');
            } else {
                req.flash('danger', `Cannot update Setting with id=${id}. Maybe Setting was not found or req.body is empty!`);
                res.redirect('/setting');
            }
        })
            .catch(err => {
                req.flash('danger', 'Error updating Setting with id=' + id);
                res.redirect('/setting');
            });

    })
};

// Update a Setting by the id in the request
exports.update1 = (req, res) => {
    const id = req.params.id;

    upload(req, res, function (err) {
        if (err) {
            res.redirect('/setting');
        }

        const detail = {};

        detail.title = req.body.title;
        detail.email = req.body.email;
        detail.mobile = req.body.mobile;
        detail.address = req.body.address;
        detail.map = req.body.map;
        detail.except = req.body.except;
        detail.description = req.body.description;
        detail.social_links = req.body.social_links;
        detail.seo_details = req.body.seo_details;
        detail.other_details = req.body.other_details;

        if (req.files && req.files.logo) {
            detail.logo = req.files.logo[0].filename;
        }
        if (req.files && req.files.logo2) {
            detail.logo2 = req.files.logo2[0].filename;
        }
        if (req.files && req.files.favicon) {
            detail.favicon = req.files.favicon[0].filename;
        }
        if (req.files && req.files.brochure) {
            setting_detail.brochure = req.files.brochure[0].filename;
        }

        Setting.updateOne({ _id: id }, { $set: detail }).then(num => {
            if (num.ok == 1) {
                req.flash('success', `Setting updated successfully!`);
                res.redirect('/setting');
            } else {
                req.flash('danger', `Cannot update Setting with id=${id}. Maybe Setting was not found or req.body is empty!`);
                res.redirect('/setting/edit/' + id);
            }
        })
            .catch(err => {
                req.flash('danger', 'Error updating Setting with id=' + id);
                res.redirect('/setting/edit/' + id);
            });

    })
};