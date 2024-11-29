import mongoose from 'mongoose';
const Schema = mongoose.Schema;
var crypto = require('crypto');
var bcrypt = require('bcrypt-nodejs');
var jwt = require('jsonwebtoken');
var secret = require('../config').secret;

const UserSchema = new Schema({
    name: String,
    mobile: String,
    email: {
        type: String,
        unique: true,
        requied: true,
    },
    password: {
        type: String,
        requied: true,
    },
    role: { type: mongoose.Schema.Types.ObjectId, ref: 'Role', required: true }
}, { timestamps: true });

// generating a hash
UserSchema.methods.generateHash = function (password) {
    return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
};

// checking if password is valid
UserSchema.methods.validPassword = function (password) {
    return bcrypt.compareSync(password, this.password);
};

module.exports = mongoose.model("User", UserSchema);