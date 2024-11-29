const cookieParser = require("cookie-parser");
const jwt = require("jsonwebtoken");

const config = process.env;

// const decoded = jwt.verify(token, config.TOKEN_KEY);

const auth = [
    cookieParser(),
    (req, res, next) => {
        const claims = jwt.verify(req.cookies['jwt'], 'ADMIN', function(err, decoded) {
            if (err) {
                res.clearCookie("jwt");
                res.clearCookie("user");
                req.flash('danger', 'Token expired. Please login.');
                res.redirect('/login');
            };
        });
        // req['authUserId'] = claims['sub']
        next()
    }
];
const auth1 = [
    cookieParser(),
    (req, res, next) => {
        const claims = jwt.verify(req.headers._token, 'API', function(err, decoded) {
            if (err) {
                return res.send({ message: 'You are not authrize.' });
            };
        });
        // req['authUserId'] = claims['sub']
        next()
    }
];
const guest = [
    cookieParser(),
    (req, res, next) => {
        const claims = jwt.verify(req.cookies['jwt'], 'ADMIN', function(err, decoded) {
            if (!err) {
                req.flash('success', 'You are already logged in');
                res.redirect('/');
            };
        });
        // req['authUserId'] = claims['sub']
        next()
    }
];

module.exports = { auth, guest, auth1 };