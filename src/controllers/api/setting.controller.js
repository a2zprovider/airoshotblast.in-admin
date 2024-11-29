const Setting = require('../../schemas/settings.js');

exports.findOne = async (req, res) => {
    try {
        const setting = await Setting.findOne();
        if (!setting) {
            return res.status(404).send({ success: false, message: 'Setting not found' });
        }
        res.status(200).send({ success: true, message: 'Record Found', data: setting });
    } catch (err) {
        res.status(500).send({ success: false, message: 'Internal Server Error', error: err });
    }
};
